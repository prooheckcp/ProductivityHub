import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useLocation } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import { PlusIcon } from '../components/icons'
import { useTimersContext } from '../features/timers/TimersContext'
import TimerCard from '../features/timers/TimerCard'
import TimerFormModal from '../features/timers/TimerFormModal'
import TimerRunModal from '../features/timers/TimerRunModal'
import './TimeTracker.css'

export default function TimeTracker(): JSX.Element {
  const {
    timers,
    loading,
    now,
    createTimer,
    updateTimer,
    removeTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    setManualTime
  } = useTimersContext()

  const location = useLocation()
  const deepLinkTimerId = (location.state as { openTimerId?: string } | null)?.openTimerId ?? null

  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(deepLinkTimerId)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Re-applies the deep link even when we're already on this page — e.g. tapping
  // the active-timer widget while sitting on Time Tracker. location.key changes
  // on every navigate() call, even to the same path, so this fires every time.
  useEffect(() => {
    if (deepLinkTimerId) setOpenId(deepLinkTimerId)
  }, [location.key, deepLinkTimerId])

  const editingTimer = timers.find((t) => t.id === editingId) ?? null
  const openTimer = timers.find((t) => t.id === openId) ?? null

  async function handleDeleteConfirmed(): Promise<void> {
    if (!deletingId) return
    await removeTimer(deletingId)
    setDeletingId(null)
    setEditingId(null)
  }

  return (
    <>
      <PageHeader
        title="Time Tracker"
        subtitle="Create timers, run them, and review your stats."
        actions={
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            <PlusIcon size={15} />
            New Timer
          </Button>
        }
      />

      {!loading && timers.length === 0 && (
        <EmptyState
          title="No timers yet"
          description="Create your first timer to start tracking time on a task or project."
          action={
            <Button variant="secondary" onClick={() => setShowCreate(true)}>
              <PlusIcon size={15} />
              New Timer
            </Button>
          }
        />
      )}

      {timers.length > 0 && (
        <div className="timer-grid">
          {timers.map((timer) => (
            <TimerCard
              key={timer.id}
              timer={timer}
              now={now}
              onOpen={() => setOpenId(timer.id)}
              onEdit={() => setEditingId(timer.id)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <TimerFormModal
          onClose={() => setShowCreate(false)}
          onSubmit={async (values) => {
            await createTimer(values)
          }}
        />
      )}

      {editingTimer && (
        <TimerFormModal
          initial={editingTimer}
          onClose={() => setEditingId(null)}
          onSubmit={async (values) => {
            await updateTimer(editingTimer.id, values)
          }}
          onDelete={() => setDeletingId(editingTimer.id)}
        />
      )}

      {openTimer && (
        <TimerRunModal
          timer={openTimer}
          now={now}
          onClose={() => setOpenId(null)}
          onStart={startTimer}
          onPause={pauseTimer}
          onReset={resetTimer}
          onSetManualTime={setManualTime}
        />
      )}

      {deletingId && (
        <ConfirmDialog
          title="Delete this timer?"
          description="This permanently deletes the timer and its photo. Past stats history for it will remain."
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </>
  )
}
