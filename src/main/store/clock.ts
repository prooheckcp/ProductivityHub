import { randomUUID } from 'crypto'
import type { Alarm, AlarmFormInput, CountdownTimer, CountdownTimerFormInput } from '../../shared/types'
import { dataFile } from './paths'
import { readJsonFile, writeJsonFile } from './jsonFile'

const alarmsFile = (): string => dataFile('alarms.json')
const countdownTimersFile = (): string => dataFile('countdown-timers.json')

function loadAlarms(): Alarm[] {
  return readJsonFile<Alarm[]>(alarmsFile(), [])
}

function saveAlarms(alarms: Alarm[]): void {
  writeJsonFile(alarmsFile(), alarms)
}

function loadCountdownTimers(): CountdownTimer[] {
  return readJsonFile<CountdownTimer[]>(countdownTimersFile(), [])
}

function saveCountdownTimers(timers: CountdownTimer[]): void {
  writeJsonFile(countdownTimersFile(), timers)
}

function mustFindAlarm(alarms: Alarm[], id: string): Alarm {
  const alarm = alarms.find((a) => a.id === id)
  if (!alarm) throw new Error(`Alarm not found: ${id}`)
  return alarm
}

function mustFindCountdownTimer(timers: CountdownTimer[], id: string): CountdownTimer {
  const timer = timers.find((t) => t.id === id)
  if (!timer) throw new Error(`Countdown timer not found: ${id}`)
  return timer
}

// ---- Alarms ----

export function listAlarms(): Alarm[] {
  return loadAlarms()
}

export function restoreAlarms(alarms: Alarm[]): void {
  saveAlarms(alarms)
}

export function createAlarm(input: AlarmFormInput): Alarm {
  const now = Date.now()
  const alarm: Alarm = {
    id: randomUUID(),
    name: input.name.trim() || 'Alarm',
    hour: input.hour,
    minute: input.minute,
    repeat: input.repeat,
    daysOfWeek: input.daysOfWeek,
    enabled: input.enabled,
    lastTriggeredAt: null,
    createdAt: now,
    updatedAt: now
  }
  const alarms = loadAlarms()
  alarms.push(alarm)
  saveAlarms(alarms)
  return alarm
}

export function updateAlarm(id: string, patch: AlarmFormInput): Alarm {
  const alarms = loadAlarms()
  const alarm = mustFindAlarm(alarms, id)
  alarm.name = patch.name.trim() || alarm.name
  alarm.hour = patch.hour
  alarm.minute = patch.minute
  alarm.repeat = patch.repeat
  alarm.daysOfWeek = patch.daysOfWeek
  alarm.enabled = patch.enabled
  alarm.updatedAt = Date.now()
  saveAlarms(alarms)
  return alarm
}

export function deleteAlarm(id: string): void {
  saveAlarms(loadAlarms().filter((a) => a.id !== id))
}

/** Background watcher calls this once an alarm fires — one-time alarms disable themselves. */
export function markAlarmTriggered(id: string): void {
  const alarms = loadAlarms()
  const alarm = alarms.find((a) => a.id === id)
  if (!alarm) return
  alarm.lastTriggeredAt = Date.now()
  if (alarm.repeat === 'once') alarm.enabled = false
  saveAlarms(alarms)
}

/** Alarms whose hour:minute matches now and haven't already fired in this same minute. */
export function findDueAlarms(now: Date): Alarm[] {
  const nowMs = now.getTime()
  return loadAlarms().filter((alarm) => {
    if (!alarm.enabled) return false
    if (alarm.hour !== now.getHours() || alarm.minute !== now.getMinutes()) return false
    const dayMatches = alarm.daysOfWeek.length === 0 || alarm.daysOfWeek.includes(now.getDay())
    if (!dayMatches) return false
    if (alarm.lastTriggeredAt !== null && nowMs - alarm.lastTriggeredAt < 55_000) return false
    return true
  })
}

// ---- Countdown timers ----

export function listCountdownTimers(): CountdownTimer[] {
  return loadCountdownTimers()
}

export function restoreCountdownTimers(timers: CountdownTimer[]): void {
  saveCountdownTimers(timers)
}

export function createCountdownTimer(input: CountdownTimerFormInput): CountdownTimer {
  const now = Date.now()
  const durationMs = Math.max(1000, Math.round(input.durationMs))
  const timer: CountdownTimer = {
    id: randomUUID(),
    name: input.name.trim() || 'Timer',
    durationMs,
    remainingMs: durationMs,
    status: 'idle',
    endsAt: null,
    createdAt: now,
    updatedAt: now
  }
  const timers = loadCountdownTimers()
  timers.push(timer)
  saveCountdownTimers(timers)
  return timer
}

export function deleteCountdownTimer(id: string): void {
  saveCountdownTimers(loadCountdownTimers().filter((t) => t.id !== id))
}

/** Play/resume from wherever remainingMs currently sits. */
export function startCountdownTimer(id: string): CountdownTimer {
  const timers = loadCountdownTimers()
  const timer = mustFindCountdownTimer(timers, id)
  const now = Date.now()
  if (timer.status !== 'running') {
    const remaining = timer.remainingMs > 0 ? timer.remainingMs : timer.durationMs
    timer.remainingMs = remaining
    timer.endsAt = now + remaining
    timer.status = 'running'
    timer.updatedAt = now
  }
  saveCountdownTimers(timers)
  return timer
}

export function pauseCountdownTimer(id: string): CountdownTimer {
  const timers = loadCountdownTimers()
  const timer = mustFindCountdownTimer(timers, id)
  const now = Date.now()
  if (timer.status === 'running' && timer.endsAt !== null) {
    timer.remainingMs = Math.max(0, timer.endsAt - now)
  }
  timer.status = 'paused'
  timer.endsAt = null
  timer.updatedAt = now
  saveCountdownTimers(timers)
  return timer
}

/** Resets back to the full configured duration, stopped (does not auto-play). */
export function restartCountdownTimer(id: string): CountdownTimer {
  const timers = loadCountdownTimers()
  const timer = mustFindCountdownTimer(timers, id)
  timer.remainingMs = timer.durationMs
  timer.status = 'idle'
  timer.endsAt = null
  timer.updatedAt = Date.now()
  saveCountdownTimers(timers)
  return timer
}

/** Background watcher calls this every tick; returns whichever running timers just crossed zero. */
export function finalizeExpiredCountdownTimers(now: number): CountdownTimer[] {
  const timers = loadCountdownTimers()
  const justFinished: CountdownTimer[] = []
  for (const timer of timers) {
    if (timer.status === 'running' && timer.endsAt !== null && timer.endsAt <= now) {
      timer.status = 'finished'
      timer.remainingMs = 0
      timer.endsAt = null
      timer.updatedAt = now
      justFinished.push(timer)
    }
  }
  if (justFinished.length > 0) saveCountdownTimers(timers)
  return justFinished
}
