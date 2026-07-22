import type { AppDetailBucket, AppDetailRange, AppDetailResult } from '../shared/types'
import { currentAppUsage } from './appTracker'
import { listAppUsageSessions } from './store/appUsage'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

function startOfLocalDay(ms: number): number {
  const date = new Date(ms)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

type Slice = { start: number; ms: number }

/** Split [startedAt, endedAt) into per-local-hour slices. */
function splitByHour(startedAt: number, endedAt: number): Slice[] {
  const slices: Slice[] = []
  let cursor = startedAt
  while (cursor < endedAt) {
    const hourStart = Math.floor(cursor / HOUR_MS) * HOUR_MS
    const nextHour = hourStart + HOUR_MS
    const sliceEnd = Math.min(endedAt, nextHour)
    slices.push({ start: cursor, ms: sliceEnd - cursor })
    cursor = sliceEnd
  }
  return slices
}

/** Split [startedAt, endedAt) into per-local-day slices (handles past-midnight). */
function splitByDay(startedAt: number, endedAt: number): Slice[] {
  const slices: Slice[] = []
  let cursor = startedAt
  while (cursor < endedAt) {
    const dayStart = startOfLocalDay(cursor)
    const nextDay = dayStart + DAY_MS
    const sliceEnd = Math.min(endedAt, nextDay)
    slices.push({ start: cursor, ms: sliceEnd - cursor })
    cursor = sliceEnd
  }
  return slices
}

function rangeStartMs(range: AppDetailRange, now: number): number {
  switch (range) {
    case 'today':
      return startOfLocalDay(now)
    case 'week':
      return startOfLocalDay(now) - 6 * DAY_MS
    case 'month':
      return startOfLocalDay(now) - 29 * DAY_MS
    case 'year':
      return startOfLocalDay(now) - 364 * DAY_MS
    case 'all':
      return -Infinity
  }
}

export function getAppDetail(appName: string, range: AppDetailRange): AppDetailResult {
  const now = Date.now()
  const sessions = listAppUsageSessions().filter((s) => s.appName === appName)
  const live = currentAppUsage()
  const isLiveMatch = live?.appName === appName
  const appPath = sessions.find((s) => s.appPath)?.appPath ?? (isLiveMatch ? live!.appPath : null)

  const intervals: { startedAt: number; endedAt: number }[] = sessions.map((s) => ({
    startedAt: s.startedAt,
    endedAt: s.endedAt
  }))
  if (isLiveMatch) intervals.push({ startedAt: live!.startedAt, endedAt: now })

  const windowStart = rangeStartMs(range, now)

  // All-time total + earliest day (for the all-time average).
  let totalMs = 0
  let firstDay = Infinity
  for (const iv of intervals) {
    for (const slice of splitByDay(iv.startedAt, iv.endedAt)) {
      if (slice.ms <= 0) continue
      totalMs += slice.ms
      const dayStart = startOfLocalDay(slice.start)
      if (dayStart < firstDay) firstDay = dayStart
    }
  }

  // Bucket the in-window time. 'today' buckets by hour; everything else by day,
  // then day-buckets are grouped into the display granularity.
  const dayMs = new Map<number, number>() // dayStart -> ms (within window)
  const hourMs = new Array(24).fill(0) as number[] // for 'today'
  let windowMs = 0

  for (const iv of intervals) {
    const clampedStart = Math.max(iv.startedAt, windowStart === -Infinity ? iv.startedAt : windowStart)
    if (clampedStart >= iv.endedAt) continue
    if (range === 'today') {
      for (const slice of splitByHour(clampedStart, iv.endedAt)) {
        if (slice.ms <= 0) continue
        windowMs += slice.ms
        hourMs[new Date(slice.start).getHours()] += slice.ms
      }
    } else {
      for (const slice of splitByDay(clampedStart, iv.endedAt)) {
        if (slice.ms <= 0) continue
        windowMs += slice.ms
        const dayStart = startOfLocalDay(slice.start)
        dayMs.set(dayStart, (dayMs.get(dayStart) ?? 0) + slice.ms)
      }
    }
  }

  let breakdown: AppDetailBucket[] = []
  let breakdownTitle = ''
  let averageMs = 0
  let averageUnit = 'day'

  if (range === 'today') {
    breakdownTitle = 'By hour'
    breakdown = hourMs.map((ms, h) => ({ key: String(h), label: `${String(h).padStart(2, '0')}h`, ms }))
    const hoursElapsed = Math.max(1, Math.ceil((now - startOfLocalDay(now)) / HOUR_MS))
    averageMs = windowMs / hoursElapsed
    averageUnit = 'hour'
  } else if (range === 'week' || range === 'month') {
    // Daily buckets across every day in the window (chronological).
    breakdownTitle = 'By day'
    const days = range === 'week' ? 7 : 30
    const firstBucketDay = startOfLocalDay(now) - (days - 1) * DAY_MS
    for (let i = 0; i < days; i++) {
      const dayStart = firstBucketDay + i * DAY_MS
      const date = new Date(dayStart)
      const label = range === 'week' ? WEEKDAY_LABELS[date.getDay()] : `${MONTH_LABELS[date.getMonth()]} ${date.getDate()}`
      breakdown.push({ key: String(dayStart), label, ms: dayMs.get(dayStart) ?? 0 })
    }
    averageMs = windowMs / days
    averageUnit = 'day'
  } else {
    // 'year' and 'all' → monthly buckets.
    breakdownTitle = 'By month'
    const monthly = new Map<string, { label: string; ms: number; sort: number }>()
    for (const [dayStart, ms] of dayMs.entries()) {
      const date = new Date(dayStart)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = range === 'year' ? MONTH_LABELS[date.getMonth()] : `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`
      const sort = date.getFullYear() * 12 + date.getMonth()
      const existing = monthly.get(key)
      if (existing) existing.ms += ms
      else monthly.set(key, { label, ms, sort })
    }
    breakdown = Array.from(monthly.values())
      .sort((a, b) => a.sort - b.sort)
      .map((m, i) => ({ key: String(i), label: m.label, ms: m.ms }))
    if (range === 'year') {
      averageMs = windowMs / 12
      averageUnit = 'month'
    } else {
      const monthsActive = Math.max(1, breakdown.length)
      averageMs = windowMs / monthsActive
      averageUnit = 'month'
    }
  }

  return { appName, appPath, range, totalMs, windowMs, averageMs, averageUnit, breakdown, breakdownTitle }
}
