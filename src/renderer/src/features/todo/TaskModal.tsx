import { useState } from 'react'
import type { JSX } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { PauseIcon, PlayIcon, PlusIcon } from '../../components/icons'
import { currentElapsedMs } from '@shared/timeMath'
import type { Project, Task, TaskFormInput, TaskPriority } from '@shared/types'
import { formatClock } from '../../utils/format'
import { useTimersContext } from '../timers/TimersContext'
import { datetimeLocalToMs, msToDatetimeLocal } from './taskDates'
import { hasSprintConfig } from './sprintMath'
import ImageGallery from './ImageGallery'
import MarkdownField from './MarkdownField'
import PriorityBadge, { PRIORITIES } from './PriorityBadge'
import TaskStatusControl from './TaskStatusControl'
import './TaskModal.css'

type TaskModalProps = {
  task?: Task
  project: Project
  now: number
  subtasks: Task[]
  onClose: () => void
  onCreate: (input: TaskFormInput) => Promise<Task>
  onUpdate: (id: string, input: TaskFormInput) => Promise<Task>
  onDelete: (id: string) => Promise<void>
  onSetStatus: (id: string, status: Task['status']) => Promise<Task>
  onStart: (id: string) => Promise<Task>
  onPause: (id: string) => Promise<Task>
  onAddSubtask: (name: string) => Promise<void>
  onOpenSubtask: (task: Task) => void
}

export default function TaskModal({
  task,
  project,
  now,
  subtasks,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onSetStatus,
  onStart,
  onPause,
  onAddSubtask,
  onOpenSubtask
}: TaskModalProps): JSX.Element {
  const { timers } = useTimersContext()
  const [name, setName] = useState(task?.name ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [images, setImages] = useState<string[]>(task?.images ?? [])
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [deadline, setDeadline] = useState(msToDatetimeLocal(task?.deadline ?? null))
  const [estimateMinutes, setEstimateMinutes] = useState(
    task?.estimatedMs ? String(Math.round(task.estimatedMs / 60000)) : ''
  )
  const [sprintNumber, setSprintNumber] = useState(task?.sprintNumber?.toString() ?? '')
  const [linkedTimerId, setLinkedTimerId] = useState(task?.linkedTimerId ?? '')
  const [timerTargetMinutes, setTimerTargetMinutes] = useState(
    task?.timerTargetMs ? String(Math.round(task.timerTargetMs / 60000)) : ''
  )
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [subtaskName, setSubtaskName] = useState('')

  const isRunning = task?.runningSince !== null && task?.runningSince !== undefined
  const elapsed = task ? formatClock(currentElapsedMs(task, now)) : null

  function buildInput(): TaskFormInput {
    const parsedSprint = parseInt(sprintNumber, 10)
    const parsedTarget = parseInt(timerTargetMinutes, 10)
    return {
      name: name.trim(),
      description,
      images,
      priority,
      deadline: datetimeLocalToMs(deadline),
      estimatedMs: estimateMinutes.trim() ? Number(estimateMinutes) * 60000 : null,
      sprintNumber: Number.isFinite(parsedSprint) && parsedSprint > 0 ? parsedSprint : null,
      linkedTimerId: linkedTimerId || null,
      timerTargetMs: linkedTimerId && Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget * 60000 : null
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
            <TaskStatusControl priority={task.priority} status={task.status} onChange={(status) => onSetStatus(task.id, status)} />
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

          {hasSprintConfig(project) && (
            <div className="task-modal__field">
              <p className="task-modal__label">Sprint</p>
              <input
                type="number"
                min={1}
                className="task-modal__input"
                value={sprintNumber}
                onChange={(event) => setSprintNumber(event.target.value)}
                placeholder="Backlog"
              />
            </div>
          )}

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

        <div className="task-modal__field">
          <p className="task-modal__label">Linked timer</p>
          <p className="task-modal__hint">
            Pick a timer and a target — once it accumulates that much time, this task auto-finishes.
          </p>
          <div className="task-modal__timer-link-row">
            <select
              className="task-modal__input"
              value={linkedTimerId}
              onChange={(event) => setLinkedTimerId(event.target.value)}
            >
              <option value="">No linked timer</option>
              {timers.map((timer) => (
                <option key={timer.id} value={timer.id}>
                  {timer.name}
                </option>
              ))}
            </select>
            {linkedTimerId && (
              <input
                type="number"
                min={1}
                className="task-modal__input"
                value={timerTargetMinutes}
                onChange={(event) => setTimerTargetMinutes(event.target.value)}
                placeholder="Target minutes"
              />
            )}
          </div>
        </div>

        {task && (
          <div className="task-modal__field">
            <p className="task-modal__label">Subtasks</p>
            <ul className="task-modal__subtasks">
              {subtasks.map((subtask) => (
                <li key={subtask.id}>
                  <TaskStatusControl
                    priority={subtask.priority}
                    status={subtask.status}
                    onChange={(status) => onSetStatus(subtask.id, status)}
                  />
                  <button type="button" className="task-modal__subtask" onClick={() => onOpenSubtask(subtask)}>
                    <span className={subtask.status === 'finished' ? 'task-modal__subtask-name--done' : ''}>
                      {subtask.name}
                    </span>
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
