import type { StatsEntry, StatsRangeKey, StatsResult } from '../shared/types'
import { currentAppUsage } from './appTracker'
import { listAppUsageSessions } from './store/appUsage'
import { listTimers, listTimerSessions } from './store/timers'

const RANGE_MS: Record<StatsRangeKey, number | null> = {
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  all: null
}

type Interval = { key: string; label: string; startedAt: number; endedAt: number }

function overlapMs(interval: Interval, cutoff: number | null, now: number): number {
  const rangeStart = cutoff === null ? -Infinity : now - cutoff
  const clampedStart = Math.max(interval.startedAt, rangeStart)
  const clampedEnd = Math.min(interval.endedAt, now)
  return Math.max(0, clampedEnd - clampedStart)
}

function sumByKey(intervals: Interval[], cutoff: number | null, now: number): StatsEntry[] {
  const totals = new Map<string, { label: string; ms: number }>()
  for (const interval of intervals) {
    const ms = overlapMs(interval, cutoff, now)
    if (ms <= 0) continue
    const existing = totals.get(interval.key)
    if (existing) existing.ms += ms
    else totals.set(interval.key, { label: interval.label, ms })
  }
  return Array.from(totals.entries())
    .map(([key, { label, ms }]) => ({ key, label, ms }))
    .sort((a, b) => b.ms - a.ms)
}

export function getStats(range: StatsRangeKey): StatsResult {
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
      timerIntervals.push({
        key: timer.id,
        label: timer.name,
        startedAt: timer.runningSince,
        endedAt: now
      })
    }
  }

  const appIntervals: Interval[] = listAppUsageSessions().map((session) => ({
    key: session.appName,
    label: session.appName,
    startedAt: session.startedAt,
    endedAt: session.endedAt
  }))
  const liveApp = currentAppUsage()
  if (liveApp) {
    appIntervals.push({
      key: liveApp.appName,
      label: liveApp.appName,
      startedAt: liveApp.startedAt,
      endedAt: now
    })
  }

  return {
    range,
    timers: sumByKey(timerIntervals, cutoff, now),
    apps: sumByKey(appIntervals, cutoff, now)
  }
}
