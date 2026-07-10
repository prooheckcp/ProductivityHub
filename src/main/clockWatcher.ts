import { Notification, shell } from 'electron'
import { findDueAlarms, finalizeExpiredCountdownTimers, markAlarmTriggered } from './store/clock'

// 1s resolution so a countdown timer notifies within a second of hitting zero,
// and so alarm hour:minute matching doesn't miss the boundary.
const CHECK_INTERVAL_MS = 1000

let intervalHandle: NodeJS.Timeout | null = null

// Electron's main process has no built-in way to play a custom sound, and
// bundling an audio asset just for this would need a real recorded file we
// don't have — shell.beep() is the OS system alert sound, works with zero
// assets/dependencies, and (unlike anything routed through the renderer)
// keeps firing even if the window has been fully closed, not just hidden.
function ringAlert(): void {
  shell.beep()
  setTimeout(() => shell.beep(), 450)
  setTimeout(() => shell.beep(), 900)
}

function checkClock(): void {
  const now = new Date()

  for (const alarm of findDueAlarms(now)) {
    markAlarmTriggered(alarm.id)
    if (Notification.isSupported()) {
      new Notification({ title: `⏰ ${alarm.name}`, body: 'Alarm' }).show()
    }
    ringAlert()
  }

  for (const timer of finalizeExpiredCountdownTimers(now.getTime())) {
    if (Notification.isSupported()) {
      new Notification({ title: `⏱️ ${timer.name}`, body: "Time's up" }).show()
    }
    ringAlert()
  }
}

export function startClockWatcher(): void {
  if (intervalHandle) return
  intervalHandle = setInterval(checkClock, CHECK_INTERVAL_MS)
  checkClock()
}

export function stopClockWatcher(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}
