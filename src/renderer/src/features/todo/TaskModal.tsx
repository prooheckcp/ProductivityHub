import { useState } from 'react'
import type { JSX } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { CheckIcon, PauseIcon, PlayIcon, PlusIcon } from '../../components/icons'
import { currentElapsedMs } from '@shared/timeMath'
import type { Task, TaskFormInput, TaskPriority } from '@shared/types'
import { formatClock } from '../../utils/format'
import { datetimeLocalToMs, msToDatetimeLocal } from './taskDates'
import ImageGallery from './ImageGallery'
import MarkdownField from './MarkdownField'
import PriorityBadge, { PRIORITIES } from './PriorityBadge'
import './TaskModal.css'

type TaskModalProps = {
  task?: Task
  now: number
  subtasks: Task[]
  onClose: () => void
  onCreate: (input: TaskFormInput) => Promise<Task>
  onUpdate: (id: string, input: TaskFormInput) => Promise<Task>
  onDelete: (id: string) => Promise<void>
  onSetCompleted: (id: string, completed: boolean) => Promise<Task>
  onStart: (id: string) => Promise<Task>
  onPause: (id: string) => Promise<Task>
  onAddSubtask: (name: string) => Promise<void>
  onOpenSubtask: (task: Task) => void
}

export default function TaskModal({
  task,
  now,
  subtasks,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onSetCompleted,
  onStart,
  onPause,
  onAddSubtask,
  onOpenSubtask
}: TaskModalProps): JSX.Element {
  const [name, setName] = useState(task?.name ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [images, setImages] = useState<string[]>(task?.images ?? [])
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [deadline, setDeadline] = useState(msToDatetimeLocal(task?.deadline ?? null))
  const [estimateMinutes, setEstimateMinutes] = useState(
    task?.estimatedMs ? String(Math.round(task.estimatedMs / 60000)) : ''
  )
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [subtaskName, setSubtaskName] = useState('')

  const isRunning = task?.runningSince !== null && task?.runningSince !== undefined
  const elapsed = task ? formatClock(currentElapsedMs(task, now)) : null

  function buildInput(): TaskFormInput {
    return {
      name: name.trim(),
      description,
      images,
      priority,
      deadline: datetimeLocalToMs(deadline),
      estimatedMs: estimateMinutes.trim() ? Number(estimateMinutes) * 60000 : null
    }
  }

  async function handleSave(): Promise<void> {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (task) await onUpdate(task.id, buildInput())
      else await onCreate(buildInput())
      onClose()
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleRunning(): Promise<void> {
    if (!task) return
    setBusy(true)
    try {
      if (isRunning) await onPause(task.id)
      else await onStart(task.id)
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleCompleted(): Promise<void> {
    if (!task) return
    setBusy(true)
    try {
      await onSetCompleted(task.id, !task.completed)
    } finally {
      setBusy(false)
    }
  }

  async function handleAddSubtask(): Promise<void> {
    if (!subtaskName.trim()) return
    await onAddSubtask(subtaskName.trim())
    setSubtaskName('')
  }

  async function handleDeleteConfirmed(): Promise<void> {
    if (!task) return
    await onDelete(task.id)
    setConfirmingDelete(false)
    onClose()
  }

  return (
    <Modal
      title={task ? 'Edit task' : 'New task'}
      onClose={onClose}
      width={560}
      footer={
        <>
          {task && (
            <Button variant="ghost" type="button" onClick={() => setConfirmingDelete(true)} className="task-modal__delete">
              Delete
            </Button>
          )}
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={handleSave} disabled={saving || !name.trim()}>
            {task ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <div className="task-modal">
        <div className="task-modal__row">
          {task && (
            <button
              type="button"
              className={'task-modal__complete' + (task.completed ? ' task-modal__complete--done' : '')}
              onClick={handleToggleCompleted}
              disabled={busy}
              aria-label="Toggle completed"
            >
              {task.completed && <CheckIcon size={14} />}
            </button>
          )}
          <input
            type="text"
            className="task-modal__name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Task name"
            autoFocus
          />
        </div>

        <MarkdownField value={description} onChange={setDescription} placeholder="Description (markdown supported)" />

        <div className="task-modal__field">
          <p className="task-modal__label">Photos</p>
          <ImageGallery images={images} onChange={setImages} />
        </div>

        <div className="task-modal__grid">
          <div className="task-modal__field">
            <p className="task-modal__label">Priority</p>
            <div className="task-modal__priority-row">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={'task-modal__priority-option' + (priority === p ? ' task-modal__priority-option--active' : '')}
                  onClick={() => setPriority(p)}
                >
                  <PriorityBadge priority={p} />
                </button>
              ))}
            </div>
          </div>

          <div className="task-modal__field">
            <p className="task-modal__label">Deadline</p>
            <input
              type="datetime-local"
              className="task-modal__input"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </div>

          <div className="task-modal__field">
            <p className="task-modal__label">Estimated time (minutes)</p>
            <input
              type="number"
              min={0}
              className="task-modal__input"
              value={estimateMinutes}
              onChange={(event) => setEstimateMinutes(event.target.value)}
              placeholder="e.g. 90"
            />
          </div>

          {task && (
            <div className="task-modal__field">
              <p className="task-modal__label">Time spent</p>
              <div className="task-modal__time-row">
                <span className="task-modal__time">
                  {elapsed?.hh}:{elapsed?.mm}:{elapsed?.ss}
                </span>
                <button
                  type="button"
                  className="task-modal__time-toggle"
                  onClick={handleToggleRunning}
                  disabled={busy}
                  aria-label={isRunning ? 'Pause' : 'Start'}
                >
                  {isRunning ? <PauseIcon size={13} /> : <PlayIcon size={13} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {task && (
          <div className="task-modal__field">
            <p className="task-modal__label">Subtasks</p>
            <ul className="task-modal__subtasks">
              {subtasks.map((subtask) => (
                <li key={subtask.id}>
                  <button type="button" className="task-modal__subtask" onClick={() => onOpenSubtask(subtask)}>
                    <span
                      className={'task-modal__subtask-check' + (subtask.completed ? ' task-modal__subtask-check--done' : '')}
                    >
                      {subtask.completed && <CheckIcon size={11} />}
                    </span>
                    <span className={subtask.completed ? 'task-modal__subtask-name--done' : ''}>{subtask.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="task-modal__add-subtask">
              <input
                type="text"
                className="task-modal__input"
                value={subtaskName}
                onChange={(event) => setSubtaskName(event.target.value)}
                placeholder="Add a subtask…"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleAddSubtask()
                  }
                }}
              />
              <Button variant="secondary" type="button" onClick={handleAddSubtask}>
                <PlusIcon size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this task?"
          description="This also deletes its subtasks and photos. This can't be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </Modal>
  )
}
