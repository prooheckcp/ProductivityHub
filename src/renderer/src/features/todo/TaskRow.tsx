import type { JSX } from 'react'
import type { Task, TaskStatus } from '@shared/types'
import { formatDeadline } from './taskDates'
import PriorityBadge from './PriorityBadge'
import TaskStatusControl from './TaskStatusControl'
import './TaskRow.css'

type TaskRowProps = {
  task: Task
  subtaskCount: number
  onOpen: () => void
  onChangeStatus: (status: TaskStatus) => void
}

export default function TaskRow({ task, subtaskCount, onOpen, onChangeStatus }: TaskRowProps): JSX.Element {
  const isDone = task.status === 'finished'
  const isOverdue = task.deadline !== null && task.deadline < Date.now() && !isDone

  return (
    <div className="task-row">
      <TaskStatusControl priority={task.priority} status={task.status} onChange={onChangeStatus} />

      <button type="button" className="task-row__body" onClick={onOpen}>
        <span className={'task-row__name' + (isDone ? ' task-row__name--done' : '')}>{task.name}</span>
        <span className="task-row__meta">
          <PriorityBadge priority={task.priority} />
          {task.deadline !== null && (
            <span className={'task-row__deadline' + (isOverdue ? ' task-row__deadline--overdue' : '')}>
              {formatDeadline(task.deadline)}
            </span>
          )}
          {subtaskCount > 0 && <span className="task-row__subtask-count">{subtaskCount} subtasks</span>}
        </span>
      </button>
    </div>
  )
}
