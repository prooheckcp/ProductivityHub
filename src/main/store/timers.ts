import { randomUUID } from 'crypto'
import type { Timer, TimerFormInput, TimerSession } from '../../shared/types'
import { dataFile } from './paths'
import { readJsonFile, writeJsonFile } from './jsonFile'

const timersFile = (): string => dataFile('timers.json')
const sessionsFile = (): string => dataFile('timer-sessions.json')

function loadTimers(): Timer[] {
  return readJsonFile<Timer[]>(timersFile(), [])
}

function saveTimers(timers: Timer[]): void {
  writeJsonFile(timersFile(), timers)
}

function loadSessions(): TimerSession[] {
  return readJsonFile<TimerSession[]>(sessionsFile(), [])
}

function appendSession(session: TimerSession): void {
  const sessions = loadSessions()
  sessions.push(session)
  writeJsonFile(sessionsFile(), sessions)
}

function mustFind(timers: Timer[], id: string): Timer {
  const timer = timers.find((t) => t.id === id)
  if (!timer) throw new Error(`Timer not found: ${id}`)
  return timer
}

/** Ends the in-flight running segment (if any), logging it for stats and folding it into accumulatedMs. */
function finalizeRunningSession(timer: Timer, now: number): void {
  if (timer.runningSince === null) return
  const durationMs = Math.max(0, now - timer.runningSince)
  if (durationMs > 0) {
    appendSession({
      id: randomUUID(),
      timerId: timer.id,
      timerName: timer.name,
      startedAt: timer.runningSince,
      endedAt: now,
      durationMs
    })
    timer.accumulatedMs += durationMs
  }
  timer.runningSince = null
}

export function listTimers(): Timer[] {
  return loadTimers()
}

export function listTimerSessions(): TimerSession[] {
  return loadSessions()
}

export function restoreTimersData(timers: Timer[], sessions: TimerSession[]): void {
  saveTimers(timers)
  writeJsonFile(sessionsFile(), sessions)
}

export function createTimer(input: TimerFormInput): Timer {
  const now = Date.now()
  const timer: Timer = {
    id: randomUUID(),
    name: input.name.trim() || 'Untitled timer',
    description: input.description.trim(),
    imagePath: input.imagePath,
    createdAt: now,
    updatedAt: now,
    accumulatedMs: 0,
    runningSince: null,
    lastResetAt: null
  }
  const timers = loadTimers()
  timers.push(timer)
  saveTimers(timers)
  return timer
}

export function updateTimer(id: string, patch: TimerFormInput): Timer {
  const timers = loadTimers()
  const timer = mustFind(timers, id)
  timer.name = patch.name.trim() || timer.name
  timer.description = patch.description.trim()
  timer.imagePath = patch.imagePath
  timer.updatedAt = Date.now()
  saveTimers(timers)
  return timer
}

export function deleteTimer(id: string): void {
  const timers = loadTimers().filter((t) => t.id !== id)
  saveTimers(timers)
}

export function startTimer(id: string): Timer {
  const timers = loadTimers()
  const timer = mustFind(timers, id)
  if (timer.runningSince === null) {
    timer.runningSince = Date.now()
    timer.updatedAt = timer.runningSince
  }
  saveTimers(timers)
  return timer
}

export function pauseTimer(id: string): Timer {
  const timers = loadTimers()
  const timer = mustFind(timers, id)
  finalizeRunningSession(timer, Date.now())
  timer.updatedAt = Date.now()
  saveTimers(timers)
  return timer
}

export function resetTimer(id: string): Timer {
  const timers = loadTimers()
  const timer = mustFind(timers, id)
  const now = Date.now()
  finalizeRunningSession(timer, now)
  timer.accumulatedMs = 0
  timer.lastResetAt = now
  timer.updatedAt = now
  saveTimers(timers)
  return timer
}

/** Manual override via the editable clock. Pauses first if running, so the new value is unambiguous. */
export function setManualTime(id: string, ms: number): Timer {
  const timers = loadTimers()
  const timer = mustFind(timers, id)
  const now = Date.now()
  finalizeRunningSession(timer, now)
  timer.accumulatedMs = Math.max(0, Math.round(ms))
  timer.updatedAt = now
  saveTimers(timers)
  return timer
}
