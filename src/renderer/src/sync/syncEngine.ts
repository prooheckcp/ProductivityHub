import type { DataBundle } from '@shared/types'
import { computeTotalTrackedMs, pickSyncedSettings } from '@shared/syncBundle'
import { isTrackedLanguage } from '@shared/languageExtensions'
import { matchAppToItem } from '@shared/appLeaderboardCatalog'
import { supabase } from '../supabase/client'

export type RemoteData = {
  bundle: Partial<DataBundle>
  totalTrackedMs: number
  updatedAt: string
} | null

// True when a bundle actually contains user content worth uploading (used to
// decide whether to offer the "upload local data?" prompt on first login).
export function bundleHasData(bundle: Partial<DataBundle>): boolean {
  return Boolean(
    bundle.timers?.length ||
      bundle.timerSessions?.length ||
      bundle.tasks?.length ||
      bundle.projects?.length ||
      bundle.notes?.length ||
      bundle.appUsageSessions?.length ||
      bundle.codingSessions?.length ||
      bundle.alarms?.length ||
      bundle.countdownTimers?.length
  )
}

export async function pullRemote(userId: string): Promise<RemoteData> {
  const { data, error } = await supabase
    .from('user_data')
    .select('bundle, total_tracked_ms, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    bundle: (data.bundle ?? {}) as Partial<DataBundle>,
    totalTrackedMs: Number(data.total_tracked_ms ?? 0),
    updatedAt: data.updated_at as string
  }
}

export async function pushRemote(userId: string, bundle: DataBundle): Promise<{ error: string | null }> {
  // Machine-only settings (launchAtLogin, showTimerOverlay) never leave this
  // device — replace settings with just the synced theme fields before upload.
  const cloudBundle = { ...bundle, settings: pickSyncedSettings(bundle.settings) }
  const totalTrackedMs = computeTotalTrackedMs(bundle)
  const { error } = await supabase
    .from('user_data')
    .upsert({ user_id: userId, bundle: cloudBundle, total_tracked_ms: totalTrackedMs }, { onConflict: 'user_id' })
  return { error: error ? error.message : null }
}

// A small, cheap content signature so we only push when something changed.
// ---- Leaderboard aggregation (per language: all-time / today / this week) ----
// Dates are computed in UTC so they line up exactly with the Postgres RPCs,
// which use `(now() at time zone 'utc')` and `to_char(..., 'IYYY"-W"IW')`.

function utcDateString(date: Date): string {
  return date.toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
}

// ISO week key like "2026-W29", matching Postgres to_char(ts, 'IYYY"-W"IW').
export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = (d.getUTCDay() + 6) % 7 // Mon=0 … Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3) // move to Thursday of this ISO week
  const isoYear = d.getUTCFullYear()
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4))
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3)
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000))
  return `${isoYear}-W${String(week).padStart(2, '0')}`
}

// Recompute the caller's per-language totals from coding sessions and upsert them
// to the public leaderboard. All languages are always written (today/week reset
// to 0 when a session isn't in the current window) so stale windows clear out.
export async function pushLeaderboard(userId: string, bundle: DataBundle): Promise<{ error: string | null }> {
  const now = new Date()
  const todayStr = utcDateString(now)
  const weekKey = isoWeekKey(now)
  const map = new Map<string, { all: number; today: number; week: number }>()

  for (const s of bundle.codingSessions) {
    const language = (s.language || '').trim()
    // Only rank languages we actually track (skip 'Other', raw languageIds, etc.)
    if (!language || !isTrackedLanguage(language)) continue
    const cur = map.get(language) ?? { all: 0, today: 0, week: 0 }
    cur.all += s.durationMs
    const started = new Date(s.startedAt)
    if (utcDateString(started) === todayStr) cur.today += s.durationMs
    if (isoWeekKey(started) === weekKey) cur.week += s.durationMs
    map.set(language, cur)
  }
  if (map.size === 0) return { error: null }

  const rows = [...map].map(([language, v]) => ({
    user_id: userId,
    language,
    all_time_ms: v.all,
    today_ms: v.today,
    today_date: todayStr,
    week_ms: v.week,
    week_key: weekKey
  }))
  const { error } = await supabase.from('coding_leaderboard').upsert(rows, { onConflict: 'user_id,language' })
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[sync] leaderboard push failed (will retry):', error.message)
    return { error: error.message }
  }
  return { error: null }
}

// Aggregate app-usage sessions into (category, item) buckets and upsert them to
// the app leaderboard. Only apps in the curated catalog (Dev Tools / Games) are
// ranked; everything else is ignored.
export async function pushAppLeaderboard(userId: string, bundle: DataBundle): Promise<{ error: string | null }> {
  const now = new Date()
  const todayStr = utcDateString(now)
  const weekKey = isoWeekKey(now)
  const map = new Map<string, { category: string; item: string; all: number; today: number; week: number }>()

  for (const s of bundle.appUsageSessions) {
    const match = matchAppToItem(s.appName)
    if (!match) continue
    const key = `${match.category}|${match.item}`
    const cur = map.get(key) ?? { category: match.category, item: match.item, all: 0, today: 0, week: 0 }
    cur.all += s.durationMs
    const started = new Date(s.startedAt)
    if (utcDateString(started) === todayStr) cur.today += s.durationMs
    if (isoWeekKey(started) === weekKey) cur.week += s.durationMs
    map.set(key, cur)
  }
  if (map.size === 0) return { error: null }

  const rows = [...map.values()].map((v) => ({
    user_id: userId,
    category: v.category,
    item: v.item,
    all_time_ms: v.all,
    today_ms: v.today,
    today_date: todayStr,
    week_ms: v.week,
    week_key: weekKey
  }))
  const { error } = await supabase.from('app_leaderboard').upsert(rows, { onConflict: 'user_id,category,item' })
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[sync] app leaderboard push failed (will retry):', error.message)
    return { error: error.message }
  }
  return { error: null }
}

function signature(bundle: DataBundle): string {
  const now = new Date()
  return JSON.stringify({
    // Include the current UTC day/week so a rollover past midnight triggers a
    // push (which recomputes today/week leaderboard windows) even with no edits.
    day: utcDateString(now),
    week: isoWeekKey(now),
    t: computeTotalTrackedMs(bundle),
    counts: [
      bundle.timers.length,
      bundle.timerSessions.length,
      bundle.tasks.length,
      bundle.projects.length,
      bundle.categories.length,
      bundle.notes.length,
      bundle.noteGroups.length,
      bundle.noteFiles.length,
      bundle.alarms.length,
      bundle.countdownTimers.length,
      bundle.appUsageSessions.length,
      bundle.codingSessions.length
    ],
    settings: pickSyncedSettings(bundle.settings),
    achievements: Object.keys(bundle.achievements?.unlocked ?? {}).length
  })
}

// Periodically pushes local changes to the cloud while signed in. Also flushes
// when the window is hidden or about to unload, so a quit doesn't lose the last
// edits. Returns a stop() cleanup.
export function startPushEngine(userId: string, intervalMs = 20000): () => void {
  let lastSignature = ''
  let stopped = false

  async function flush(): Promise<void> {
    if (stopped) return
    try {
      const bundle = await window.api.data.getBundle()
      const sig = signature(bundle)
      if (sig === lastSignature) return
      // Push both independently — a user_data failure (e.g. anti-cheat) must not
      // block the leaderboard, and vice-versa.
      const userData = await pushRemote(userId, bundle)
      const leaderboard = await pushLeaderboard(userId, bundle)
      const appLeaderboard = await pushAppLeaderboard(userId, bundle)
      if (userData.error) {
        // eslint-disable-next-line no-console
        console.warn('[sync] user_data push failed (will retry):', userData.error)
      }
      // Only mark this state as synced when everything landed; otherwise retry
      // on the next tick.
      if (!userData.error && !leaderboard.error && !appLeaderboard.error) lastSignature = sig
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[sync] push error (will retry):', err)
    }
  }

  const interval = setInterval(flush, intervalMs)
  const onHide = (): void => {
    if (document.visibilityState === 'hidden') void flush()
  }
  const onUnload = (): void => {
    void flush()
  }
  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('beforeunload', onUnload)

  // Push once on start (lastSignature is empty) so the cloud + leaderboard are
  // seeded immediately on login without waiting for the first edit.
  void flush()

  return () => {
    stopped = true
    clearInterval(interval)
    document.removeEventListener('visibilitychange', onHide)
    window.removeEventListener('beforeunload', onUnload)
  }
}
