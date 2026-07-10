import type { JSX } from 'react'
import type { Task, TaskStatus } from '@shared/types'
import ProgressBar from '../../components/ProgressBar'
import { ChevronDownIcon } from '../../components/icons'
import { formatDeadline } from './taskDates'
import PriorityBadge from './PriorityBadge'
import TaskStatusControl from './TaskStatusControl'
import './TaskRow.css'

type TaskRowProps = {
  task: Task
  subtaskCount: number
  expandable?: boolean
  expanded?: boolean
  onToggleExpand?: () => void
  progress?: { completed: number; total: number } | null
  onOpen: () => void
  onChangeStatus: (status: TaskStatus) => void
}

export default function TaskRow({
  task,
  subtaskCount,
  expandable,
  expanded,
  onToggleExpand,
  progress,
  onOpen,
  onChangeStatus
}: TaskRowProps): JSX.Element {
  const isDone = task.status === 'finished'
  const isOverdue = task.deadline !== null && task.deadline < Date.now() && !isDone
  const progressPercent = progress && progress.total > 0 ? (progress.completed / progress.total) * 100 : 0

  return (
    <div className="task-row">
      {expandable ? (
        <button
          type="button"
          className={'task-row__expand' + (expanded ? ' task-row__expand--open' : '')}
          onClick={(event) => {
            event.stopPropagation()
            onToggleExpand?.()
          }}
          aria-label={expanded ? 'Collapse subtasks' : 'Expand subtasks'}
        >
          <ChevronDownIcon size={13} />
        </button>
      ) : (
        <span className="task-row__expand-spacer" />
      )}

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
        {progress && progress.total > 0 && (
          <div className="task-row__progress">
            <ProgressBar percent={progressPercent} label={`${progress.completed}/${progress.total} subtasks`} />
          </div>
        )}
      </button>
    </div>
  )
}
