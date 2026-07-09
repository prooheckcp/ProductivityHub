import type { StatsEntry, StatsRangeKey, StatsResult } from '../shared/types'
import { currentAppUsage } from './appTracker'
import { CATEGORY_SUPPORTED, getAppCategory } from './appCategory'
import { listAppUsageSessions } from './store/appUsage'
import { listTimers, listTimerSessions } from './store/timers'

const RANGE_MS: Record<StatsRangeKey, number | null> = {
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  all: null
}

type Interval = {
  key: string
  label: string
  startedAt: number
  endedAt: number
  appPath?: string | null
}

function overlapMs(interval: Interval, cutoff: number | null, now: number): number {
  const rangeStart = cutoff === null ? -Infinity : now - cutoff
  const clampedStart = Math.max(interval.startedAt, rangeStart)
  const clampedEnd = Math.min(interval.endedAt, now)
  return Math.max(0, clampedEnd - clampedStart)
}

function sumByKey(intervals: Interval[], cutoff: number | null, now: number): StatsEntry[] {
  const totals = new Map<string, { label: string; ms: number; appPath: string | null }>()
  for (const interval of intervals) {
    const ms = overlapMs(interval, cutoff, now)
    if (ms <= 0) continue
    const existing = totals.get(interval.key)
    if (existing) {
      existing.ms += ms
      if (!existing.appPath && interval.appPath) existing.appPath = interval.appPath
    } else {
      totals.set(interval.key, { label: interval.label, ms, appPath: interval.appPath ?? null })
    }
  }
  return Array.from(totals.entries())
    .map(([key, v]) => ({ key, label: v.label, ms: v.ms, appPath: v.appPath }))
    .sort((a, b) => b.ms - a.ms)
}

function buildAppIntervals(): Interval[] {
  const now = Date.now()
  const intervals: Interval[] = listAppUsageSessions().map((session) => ({
    key: session.appName,
    label: session.appName,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    appPath: session.appPath
  }))
  const live = currentAppUsage()
  if (live) {
    intervals.push({
      key: live.appName,
      label: live.appName,
      startedAt: live.startedAt,
      endedAt: now,
      appPath: live.appPath
    })
  }
  return intervals
}

async function buildCategoryBreakdown(apps: StatsEntry[]): Promise<StatsEntry[]> {
  const totals = new Map<string, number>()
  for (const entry of apps) {
    const category = (await getAppCategory(entry.appPath ?? null)) ?? 'Uncategorized'
    totals.set(category, (totals.get(category) ?? 0) + entry.ms)
  }
  return Array.from(totals.entries())
    .map(([key, ms]) => ({ key, label: key, ms }))
    .sort((a, b) => b.ms - a.ms)
}

export async function getStats(range: StatsRangeKey): Promise<StatsResult> {
  const now = Date.now()
  const cutoff = RANGE_MS[range]

  const timerIntervals: Interval[] = listTimerSessions().map((session) => ({
    key: session.timerId,
    label: session.timerName,
    startedAt: session.startedAt,
    endedAt: session.endedAt
  }))
  for (const timer of listTimers()) {
    if (timer.runningSince !== null) {
      timerIntervals.push({ key: timer.id, label: timer.name, startedAt: timer.runningSince, endedAt: now })
    }
  }

  const appIntervals = buildAppIntervals()
  const apps = sumByKey(appIntervals, cutoff, now)
  const appsAllTime = sumByKey(appIntervals, null, now)
  const categories = CATEGORY_SUPPORTED ? await buildCategoryBreakdown(apps) : []

  return {
    range,
    timers: sumByKey(timerIntervals, cutoff, now),
    apps,
    appsAllTime,
    categories,
    categorySupport: CATEGORY_SUPPORTED
  }
}
