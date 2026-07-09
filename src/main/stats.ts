import type { StatsEntry, StatsQuery, StatsResult } from '../shared/types'
import { currentAppUsage } from './appTracker'
import { CATEGORY_AUTO_DETECT_SUPPORTED, getAppCategory } from './appCategory'
import { listAppUsageSessions } from './store/appUsage'
import { listTimers, listTimerSessions } from './store/timers'

const RANGE_MS: Record<string, number | null> = {
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
  appName?: string
  appPath?: string | null
}

function overlapMs(interval: Interval, rangeStart: number, rangeEnd: number): number {
  const clampedStart = Math.max(interval.startedAt, rangeStart)
  const clampedEnd = Math.min(interval.endedAt, rangeEnd)
  return Math.max(0, clampedEnd - clampedStart)
}

function sumByKey(intervals: Interval[], rangeStart: number, rangeEnd: number): StatsEntry[] {
  const totals = new Map<string, { label: string; ms: number; appPath: string | null; appName?: string }>()
  for (const interval of intervals) {
    const ms = overlapMs(interval, rangeStart, rangeEnd)
    if (ms <= 0) continue
    const existing = totals.get(interval.key)
    if (existing) {
      existing.ms += ms
      if (!existing.appPath && interval.appPath) existing.appPath = interval.appPath
    } else {
      totals.set(interval.key, {
        label: interval.label,
        ms,
        appPath: interval.appPath ?? null,
        appName: interval.appName
      })
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
    appName: session.appName,
    appPath: session.appPath
  }))
  const live = currentAppUsage()
  if (live) {
    intervals.push({
      key: live.appName,
      label: live.appName,
      startedAt: live.startedAt,
      endedAt: now,
      appName: live.appName,
      appPath: live.appPath
    })
  }
  return intervals
}

async function attachCategories(entries: StatsEntry[]): Promise<StatsEntry[]> {
  return Promise.all(
    entries.map(async (entry) => ({ ...entry, category: await getAppCategory(entry.label, entry.appPath ?? null) }))
  )
}

async function buildCategoryBreakdown(apps: StatsEntry[]): Promise<StatsEntry[]> {
  const totals = new Map<string, number>()
  for (const entry of apps) {
    const category = entry.category ?? 'Uncategorized'
    totals.set(category, (totals.get(category) ?? 0) + entry.ms)
  }
  return Array.from(totals.entries())
    .map(([key, ms]) => ({ key, label: key, ms }))
    .sort((a, b) => b.ms - a.ms)
}

function resolveRange(query: StatsQuery, now: number): { start: number; end: number } {
  if (query.range === 'custom') {
    return { start: query.startMs ?? 0, end: query.endMs ?? now }
  }
  const span = RANGE_MS[query.range]
  return { start: span === null ? -Infinity : now - span, end: now }
}

export async function getStats(query: StatsQuery): Promise<StatsResult> {
  const now = Date.now()
  const { start, end } = resolveRange(query, now)

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
  const apps = await attachCategories(sumByKey(appIntervals, start, end))
  const appsAllTime = await attachCategories(sumByKey(appIntervals, -Infinity, now))
  const categories = await buildCategoryBreakdown(apps)

  const availableCategories = Array.from(
    new Set(appsAllTime.map((entry) => entry.category ?? 'Uncategorized'))
  ).sort()

  const categoryFilter = query.category ?? null
  const filteredApps = categoryFilter ? apps.filter((entry) => (entry.category ?? 'Uncategorized') === categoryFilter) : apps
  const filteredAppsAllTime = categoryFilter
    ? appsAllTime.filter((entry) => (entry.category ?? 'Uncategorized') === categoryFilter)
    : appsAllTime

  return {
    range: query.range,
    timers: sumByKey(timerIntervals, start, end),
    apps: filteredApps,
    appsAllTime: filteredAppsAllTime,
    categories,
    categorySupport: CATEGORY_AUTO_DETECT_SUPPORTED,
    availableCategories
  }
}
