import type { JSX } from 'react'
import { CheckIcon } from '../../components/icons'
import type { Task } from '@shared/types'
import { formatDeadline } from './taskDates'
import PriorityBadge from './PriorityBadge'
import './TaskRow.css'

type TaskRowProps = {
  task: Task
  subtaskCount: number
  onOpen: () => void
  onToggleCompleted: () => void
}

export default function TaskRow({ task, subtaskCount, onOpen, onToggleCompleted }: TaskRowProps): JSX.Element {
  const isOverdue = task.deadline !== null && task.deadline < Date.now() && !task.completed

  return (
    <div className="task-row">
      <button
        type="button"
        className={'task-row__check' + (task.completed ? ' task-row__check--done' : '')}
        onClick={(event) => {
          event.stopPropagation()
          onToggleCompleted()
        }}
        aria-label="Toggle completed"
      >
        {task.completed && <CheckIcon size={12} />}
      </button>

      <button type="button" className="task-row__body" onClick={onOpen}>
        <span className={'task-row__name' + (task.completed ? ' task-row__name--done' : '')}>{task.name}</span>
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
