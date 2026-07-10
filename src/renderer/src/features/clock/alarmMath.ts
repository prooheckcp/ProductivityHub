import type { Alarm } from '@shared/types'

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Milliseconds until this alarm's next scheduled fire, or null if it's off. */
export function msUntilNextFire(alarm: Alarm, now: Date): number | null {
  if (!alarm.enabled) return null
  // No day picked (a plain "once" alarm) fires at the next occurrence of this
  // time on any day — checking all 7 candidates and taking the closest one
  // naturally resolves to "today" if the time hasn't passed yet, else tomorrow.
  const days = alarm.daysOfWeek.length > 0 ? alarm.daysOfWeek : [0, 1, 2, 3, 4, 5, 6]
  let best: number | null = null
  for (const day of days) {
    const candidate = new Date(now)
    const dayDelta = (day - now.getDay() + 7) % 7
    candidate.setDate(now.getDate() + dayDelta)
    candidate.setHours(alarm.hour, alarm.minute, 0, 0)
    if (candidate.getTime() <= now.getTime()) {
      candidate.setDate(candidate.getDate() + 7)
    }
    const diff = candidate.getTime() - now.getTime()
    if (best === null || diff < best) best = diff
  }
  return best
}

export function formatCountdown(ms: number): string {
  const totalMinutes = Math.round(ms / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `in ${days}d ${hours}h`
  if (hours > 0) return `in ${hours}h ${minutes}m`
  if (minutes > 0) return `in ${minutes}m`
  return 'in <1m'
}

export function formatNextFire(alarm: Alarm, now: Date): string {
  const ms = msUntilNextFire(alarm, now)
  return ms === null ? 'Off' : formatCountdown(ms)
}

export function formatAlarmTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`
}
