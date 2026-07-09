import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { CheckIcon, CloseIcon, PauseIcon, PlayIcon } from '../../components/icons'
import defaultCover from '../../assets/shiba-clock.png'
import { toFileUrl } from '../../utils/fileUrl'
import { clockToMs, formatClock, formatClockWithCentis } from '../../utils/format'
import type { ClockParts } from '../../utils/format'
import { currentElapsedMs } from '@shared/timeMath'
import type { Timer } from '@shared/types'
import './TimerRunModal.css'

const FAST_TICK_MS = 30

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
  const isRunning = timer.runningSince !== null

  // The page-level `now` only ticks once a second (shared across the whole
  // timer grid) — run a faster local clock in here so milliseconds move
  // smoothly while this modal is the one thing on screen.
  const [fastNow, setFastNow] = useState(() => Date.now())
  useEffect(() => {
    if (!isRunning || editing) return
    const interval = setInterval(() => setFastNow(Date.now()), FAST_TICK_MS)
    return () => clearInterval(interval)
  }, [isRunning, editing])

  const clock = formatClockWithCentis(currentElapsedMs(timer, isRunning ? fastNow : now))

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
    <Modal title={timer.name} onClose={onClose} width={620} titleClassName="timer-run__title">
      <div className="timer-run">
        <img
          className="timer-run__image"
          src={timer.imagePath ? toFileUrl(timer.imagePath) : defaultCover}
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = defaultCover
          }}
          alt=""
        />
        {timer.description && <p className="timer-run__description">{timer.description}</p>}

        {!editing ? (
          <button type="button" className="timer-run__clock" onClick={handleEditStart} disabled={busy}>
            <span className="timer-run__clock-main">
              <span>{clock.hh}</span>:<span>{clock.mm}</span>:<span>{clock.ss}</span>
            </span>
            <span className="timer-run__clock-centis">.{clock.cs}</span>
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
          <button
            type="button"
            className="timer-run__toggle"
            onClick={handleToggle}
            disabled={busy || editing}
            aria-label={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? <PauseIcon size={26} /> : <PlayIcon size={26} />}
          </button>
          <button
            type="button"
            className="timer-run__reset"
            onClick={() => setConfirmingReset(true)}
            disabled={busy}
          >
            Reset
          </button>
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
