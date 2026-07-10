import type { TaskStatus } from '@shared/types'

export const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'under_review', 'finished']

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To-do',
  in_progress: 'In progress',
  under_review: 'Under review',
  finished: 'Finished'
}
