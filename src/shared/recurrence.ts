import type { Recurrence, RecurrenceMode } from './types'

// A completed recurring task resets `RECURRENCE_TOLERANCE_MS` BEFORE its full
// period elapses, so completing it a little early still counts as "on time".
// e.g. a daily task (24h) resets 4h early → 20h after completion.
export const RECURRENCE_TOLERANCE_MS = 4 * 60 * 60 * 1000 // 4 hours

const DAY_MS = 24 * 60 * 60 * 1000

// Base period per fixed mode. 'monthly' uses a 30-day approximation (the custom
// month mode exists for exact calendar-day scheduling).
const BASE_PERIOD_MS: Record<Exclude<RecurrenceMode, 'custom'>, number> = {
  daily: DAY_MS,
  weekly: 7 * DAY_MS,
  biweekly: 14 * DAY_MS,
  monthly: 30 * DAY_MS
}

const WEEKDAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function emptyRecurrence(mode: RecurrenceMode = 'daily'): Recurrence {
  return { mode, calendarMode: 'week', daysOfWeek: [], daysOfMonth: [] }
}

// Whether a recurrence is actually usable — custom modes need at least one day.
export function isRecurrenceValid(recurrence: Recurrence | null): boolean {
  if (!recurrence) return false
  if (recurrence.mode !== 'custom') return true
  return recurrence.calendarMode === 'week'
    ? recurrence.daysOfWeek.length > 0
    : recurrence.daysOfMonth.length > 0
}

// The next calendar day (at local midnight) at/after `from` that matches the
// custom schedule. Starts from the day AFTER `from` so a same-day completion
// doesn't immediately re-fire. Falls back to +1 day if nothing is selected.
function nextCustomOccurrence(recurrence: Recurrence, from: number): number {
  const anchor = new Date(from)
  for (let i = 1; i <= 366; i++) {
    const day = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + i, 0, 0, 0, 0)
    const matches =
      recurrence.calendarMode === 'week'
        ? recurrence.daysOfWeek.includes(day.getDay())
        : recurrence.daysOfMonth.includes(day.getDate())
    if (matches) return day.getTime()
  }
  return from + DAY_MS
}

// When a task completed at `completedAt` should reset back to 'todo', applying
// the 4h tolerance.
export function computeNextDueAt(recurrence: Recurrence, completedAt: number): number {
  if (recurrence.mode !== 'custom') {
    return completedAt + BASE_PERIOD_MS[recurrence.mode] - RECURRENCE_TOLERANCE_MS
  }
  return nextCustomOccurrence(recurrence, completedAt) - RECURRENCE_TOLERANCE_MS
}

// Human-readable summary for badges/labels, e.g. "Daily", "Every 2 weeks",
// "Mon · Wed · Fri", or "Day 1, 15".
export function describeRecurrence(recurrence: Recurrence): string {
  switch (recurrence.mode) {
    case 'daily':
      return 'Daily'
    case 'weekly':
      return 'Weekly'
    case 'biweekly':
      return 'Every 2 weeks'
    case 'monthly':
      return 'Monthly'
    case 'custom': {
      if (recurrence.calendarMode === 'week') {
        if (recurrence.daysOfWeek.length === 0) return 'Custom'
        if (recurrence.daysOfWeek.length === 7) return 'Every day'
        return [...recurrence.daysOfWeek].sort((a, b) => a - b).map((d) => WEEKDAY_ABBR[d]).join(' · ')
      }
      if (recurrence.daysOfMonth.length === 0) return 'Custom'
      return 'Day ' + [...recurrence.daysOfMonth].sort((a, b) => a - b).join(', ')
    }
  }
}
