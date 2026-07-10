import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import type { TaskPriority, TaskStatus } from '@shared/types'
import { CheckIcon, EyeIcon, PlayIcon } from '../../components/icons'
import { STATUSES, STATUS_LABELS } from './taskStatus'
import './TaskStatusControl.css'

type TaskStatusControlProps = {
  priority: TaskPriority
  status: TaskStatus
  onChange: (status: TaskStatus) => void
}

function StatusGlyph({ status }: { status: TaskStatus }): JSX.Element | null {
  if (status === 'in_progress') return <PlayIcon size={10} />
  if (status === 'under_review') return <EyeIcon size={12} />
  if (status === 'finished') return <CheckIcon size={12} />
  return null
}

export default function TaskStatusControl({ priority, status, onChange }: TaskStatusControlProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="task-status-control" ref={rootRef}>
      <button
        type="button"
        className={`task-status-control__circle task-status-control__circle--${priority} task-status-control__circle--${status}`}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((v) => !v)
        }}
        aria-label={`Status: ${STATUS_LABELS[status]} — click to change`}
      >
        <StatusGlyph status={status} />
      </button>

      {open && (
        <div className="task-status-control__menu" onClick={(event) => event.stopPropagation()}>
          {STATUSES.map((option) => (
            <button
              key={option}
              type="button"
              className={
                'task-status-control__option' + (option === status ? ' task-status-control__option--active' : '')
              }
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
            >
              <span className={`task-status-control__dot task-status-control__dot--${priority}`}>
                <StatusGlyph status={option} />
              </span>
              {STATUS_LABELS[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
