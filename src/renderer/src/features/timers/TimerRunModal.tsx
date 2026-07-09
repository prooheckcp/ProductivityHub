import { useState } from 'react'
import type { JSX } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import { CheckIcon, CloseIcon, PauseIcon, PlayIcon } from '../../components/icons'
import { toFileUrl } from '../../utils/fileUrl'
import { clockToMs, formatClock } from '../../utils/format'
import type { ClockParts } from '../../utils/format'
import { currentElapsedMs } from '@shared/timeMath'
import type { Timer } from '@shared/types'
import './TimerRunModal.css'

type TimerRunModalProps = {
  timer: Timer
  now: number
  onClose: () => void
  onStart: (id: string) => Promise<Timer>
  onPause: (id: string) => Promise<Timer>
  onReset: (id: string) => Promise<Timer>
  onSetManualTime: (id: string, ms: number) => Promise<Timer>
}

export default function TimerRunModal({
  timer,
  now,
  onClose,
  onStart,
  onPause,
  onReset,
  onSetManualTime
}: TimerRunModalProps): JSX.Element {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ClockParts>({ hh: '00', mm: '00', ss: '00' })
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [busy, setBusy] = useState(false)

  const clock = formatClock(currentElapsedMs(timer, now))
  const isRunning = timer.runningSince !== null

  async function handleToggle(): Promise<void> {
    setBusy(true)
    try {
      if (isRunning) await onPause(timer.id)
      else await onStart(timer.id)
    } finally {
      setBusy(false)
    }
  }

  async function handleEditStart(): Promise<void> {
    setBusy(true)
    try {
      const paused = isRunning ? await onPause(timer.id) : timer
      setDraft(formatClock(currentElapsedMs(paused, Date.now())))
      setEditing(true)
    } finally {
      setBusy(false)
    }
  }

  async function handleEditConfirm(): Promise<void> {
    const ms = clockToMs(Number(draft.hh) || 0, Number(draft.mm) || 0, Number(draft.ss) || 0)
    setBusy(true)
    try {
      await onSetManualTime(timer.id, ms)
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  async function handleResetConfirmed(): Promise<void> {
    setBusy(true)
    try {
      await onReset(timer.id)
      setConfirmingReset(false)
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={timer.name} onClose={onClose} width={420}>
      <div className="timer-run">
        {timer.imagePath && <img className="timer-run__image" src={toFileUrl(timer.imagePath)} alt="" />}
        {timer.description && <p className="timer-run__description">{timer.description}</p>}

        {!editing ? (
          <button type="button" className="timer-run__clock" onClick={handleEditStart} disabled={busy}>
            <span>{clock.hh}</span>:<span>{clock.mm}</span>:<span>{clock.ss}</span>
          </button>
        ) : (
          <div className="timer-run__clock-edit">
            {(['hh', 'mm', 'ss'] as const).map((segment) => (
              <input
                key={segment}
                type="number"
                min={0}
                className="timer-run__clock-input"
                value={draft[segment]}
                onChange={(event) => setDraft((prev) => ({ ...prev, [segment]: event.target.value }))}
              />
            ))}
            <button
              type="button"
              className="timer-run__clock-action"
              onClick={handleEditConfirm}
              aria-label="Confirm new time"
              disabled={busy}
            >
              <CheckIcon size={16} />
            </button>
            <button
              type="button"
              className="timer-run__clock-action"
              onClick={() => setEditing(false)}
              aria-label="Cancel editing"
              disabled={busy}
            >
              <CloseIcon size={16} />
            </button>
          </div>
        )}

        <div className="timer-run__actions">
          <Button variant="primary" onClick={handleToggle} disabled={busy || editing}>
            {isRunning ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button variant="secondary" onClick={() => setConfirmingReset(true)} disabled={busy}>
            Reset
          </Button>
        </div>
      </div>

      {confirmingReset && (
        <ConfirmDialog
          title="Reset this timer?"
          description="This sets the timer back to zero. Your stats history for this timer is kept."
          confirmLabel="Reset"
          onConfirm={handleResetConfirmed}
          onCancel={() => setConfirmingReset(false)}
        />
      )}
    </Modal>
  )
}
