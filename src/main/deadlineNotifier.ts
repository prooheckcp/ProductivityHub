import { Notification } from 'electron'
import { listTasks, markTaskDeadlineNotified } from './store/todo'

const CHECK_INTERVAL_MS = 60 * 1000
const NEAR_DEADLINE_WINDOW_MS = 24 * 60 * 60 * 1000

let intervalHandle: NodeJS.Timeout | null = null

function checkDeadlines(): void {
  const now = Date.now()
  for (const task of listTasks()) {
    if (task.completed || task.deadline === null || task.deadlineNotifiedAt !== null) continue
    const isOverdue = task.deadline < now
    const isNear = task.deadline - now <= NEAR_DEADLINE_WINDOW_MS
    if (!isOverdue && !isNear) continue

    if (Notification.isSupported()) {
      new Notification({
        title: isOverdue ? 'Task overdue' : 'Task due soon',
        body: task.name
      }).show()
    }
    markTaskDeadlineNotified(task.id)
  }
}

export function startDeadlineNotifier(): void {
  if (intervalHandle) return
  intervalHandle = setInterval(checkDeadlines, CHECK_INTERVAL_MS)
  checkDeadlines()
}

export function stopDeadlineNotifier(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}
