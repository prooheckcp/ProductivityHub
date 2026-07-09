import type { AppDetailBucket, AppDetailResult } from '../shared/types'
import { currentAppUsage } from './appTracker'
import { listAppUsageSessions } from './store/appUsage'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_MS = 24 * 60 * 60 * 1000

function startOfLocalDay(ms: number): number {
  const date = new Date(ms)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function monthKeyAndLabel(dayStart: number): { key: string; label: string } {
  const date = new Date(dayStart)
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  const label = date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
  return { key, label }
}

/** Splits an interval into per-local-calendar-day slices so a session that
 * runs past midnight attributes its time to the correct day/weekday/month. */
function splitByLocalDay(startedAt: number, endedAt: number): { dayStart: number; ms: number }[] {
  const slices: { dayStart: number; ms: number }[] = []
  let cursor = startedAt
  while (cursor < endedAt) {
    const dayStart = startOfLocalDay(cursor)
    const nextDayStart = dayStart + DAY_MS
    const sliceEnd = Math.min(endedAt, nextDayStart)
    slices.push({ dayStart, ms: sliceEnd - cursor })
    cursor = sliceEnd
  }
  return slices
}

export function getAppDetail(appName: string): AppDetailResult {
  const now = Date.now()
  const sessions = listAppUsageSessions().filter((s) => s.appName === appName)
  const live = currentAppUsage()
  const isLiveMatch = live?.appName === appName

  const appPath = sessions.find((s) => s.appPath)?.appPath ?? (isLiveMatch ? live!.appPath : null)

  const weekdayTotals = new Array(7).fill(0) as number[]
  const monthTotals = new Map<string, { label: string; ms: number }>()
  let totalMs = 0
  let firstDay = Infinity

  function addInterval(startedAt: number, endedAt: number): void {
    for (const slice of splitByLocalDay(startedAt, endedAt)) {
      if (slice.ms <= 0) continue
      totalMs += slice.ms
      weekdayTotals[new Date(slice.dayStart).getDay()] += slice.ms
      const { key, label } = monthKeyAndLabel(slice.dayStart)
      const existing = monthTotals.get(key)
      if (existing) existing.ms += slice.ms
      else monthTotals.set(key, { label, ms: slice.ms })
      if (slice.dayStart < firstDay) firstDay = slice.dayStart
    }
  }

  for (const session of sessions) addInterval(session.startedAt, session.endedAt)
  if (isLiveMatch) addInterval(live!.startedAt, now)

  const byWeekday: AppDetailBucket[] = WEEKDAY_LABELS.map((label, index) => ({
    key: String(index),
    label,
    ms: weekdayTotals[index]
  }))

  const byMonth: AppDetailBucket[] = Array.from(monthTotals.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, v]) => ({ key, label: v.label, ms: v.ms }))

  const daysSinceFirst = firstDay === Infinity ? 1 : Math.round((startOfLocalDay(now) - firstDay) / DAY_MS) + 1
  const averagePerDayMs = totalMs / Math.max(1, daysSinceFirst)

  return { appName, appPath, totalMs, averagePerDayMs, byWeekday, byMonth }
}
