import { Notification } from 'electron'
import { broadcast } from './broadcast'
import { listTasks, resetRecurringTask } from './store/todo'

// Recurring tasks are marked complete like any other, but a completion schedules
// a reset (task.nextDueAt). This watcher flips those tasks back to 'todo' once
// their reset time arrives, firing both an in-app toast (via broadcast) and an
// OS notification — mirroring how achievement unlocks are surfaced.
const CHECK_INTERVAL_MS = 60 * 1000

let intervalHandle: NodeJS.Timeout | null = null

function checkRecurring(): void {
  const now = Date.now()
  for (const task of listTasks()) {
    if (!task.recurrence || task.status !== 'finished' || task.nextDueAt === null) continue
    if (now < task.nextDueAt) continue

    resetRecurringTask(task.id)

    // In-app popup (renderer listens on this channel, like achievement unlocks).
    broadcast('todo:recurring-due', { id: task.id, name: task.name })

    if (Notification.isSupported()) {
      new Notification({ title: 'Recurring task due', body: `Time to do "${task.name}" again` }).show()
    }
  }
}

export function startRecurringTaskWatcher(): void {
  if (intervalHandle) return
  intervalHandle = setInterval(checkRecurring, CHECK_INTERVAL_MS)
  checkRecurring()
}

export function stopRecurringTaskWatcher(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}
