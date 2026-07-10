import { listTimers } from './store/timers'
import { checkTimerLinkedTasks } from './store/todo'

const CHECK_INTERVAL_MS = 15 * 1000

let intervalHandle: NodeJS.Timeout | null = null

function checkRunningTimers(): void {
  const now = Date.now()
  for (const timer of listTimers()) {
    if (timer.runningSince === null) continue
    const liveMs = timer.accumulatedMs + Math.max(0, now - timer.runningSince)
    checkTimerLinkedTasks(timer.id, liveMs)
  }
}

export function startTimerTaskWatcher(): void {
  if (intervalHandle) return
  intervalHandle = setInterval(checkRunningTimers, CHECK_INTERVAL_MS)
  checkRunningTimers()
}

export function stopTimerTaskWatcher(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}
