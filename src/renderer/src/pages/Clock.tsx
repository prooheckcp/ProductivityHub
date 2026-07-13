import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import { PlusIcon } from '../components/icons'
import { useClockContext } from '../features/clock/ClockContext'
import AlarmRow from '../features/clock/AlarmRow'
import AlarmFormModal from '../features/clock/AlarmFormModal'
import CountdownTimerCard from '../features/clock/CountdownTimerCard'
import CountdownTimerFormModal from '../features/clock/CountdownTimerFormModal'
import './Clock.css'

const VALID_VIEWS = ['alarms', 'timers'] as const
type ClockView = (typeof VALID_VIEWS)[number]

export default function Clock(): JSX.Element {
  const { view: viewParam } = useParams<{ view?: string }>()
  const view: ClockView = VALID_VIEWS.includes(viewParam as ClockView) ? (viewParam as ClockView) : 'alarms'

  const {
    alarms,
    countdownTimers,
    loading,
    now,
    createAlarm,
    updateAlarm,
    removeAlarm,
    setAlarmEnabled,
    createCountdownTimer,
    removeCountdownTimer,
    startCountdownTimer,
    pauseCountdownTimer,
    restartCountdownTimer
  } = useClockContext()

  const [showCreateAlarm, setShowCreateAlarm] = useState(false)
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null)
  const [deletingAlarmId, setDeletingAlarmId] = useState<string | null>(null)
  const [showCreateTimer, setShowCreateTimer] = useState(false)
  const [deletingTimerId, setDeletingTimerId] = useState<string | null>(null)

  // Deep link from the overlay (a card-body click): scroll to the countdown timer
  // and flash it. location.key changes on every navigate(), so re-tapping repeats.
  const location = useLocation()
  const deepLinkTimerId = (location.state as { openTimerId?: string } | null)?.openTimerId ?? null
  const [highlightId, setHighlightId] = useState<string | null>(null)
  useEffect(() => {
    if (!deepLinkTimerId || view !== 'timers') return
    setHighlightId(deepLinkTimerId)
    const el = document.getElementById(`countdown-${deepLinkTimerId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const t = setTimeout(() => setHighlightId(null), 1800)
    return () => clearTimeout(t)
  }, [location.key, deepLinkTimerId, view])

  const sortedAlarms = [...alarms].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
  const editingAlarm = alarms.find((a) => a.id === editingAlarmId) ?? null

  return (
    <>
      <PageHeader
        title="Alarms & Timers"
        subtitle="Set alarms and countdown timers, just like your phone's clock app."
        actions={
          <Button variant="primary" onClick={() => (view === 'alarms' ? setShowCreateAlarm(true) : setShowCreateTimer(true))}>
            <PlusIcon size={15} />
            {view === 'alarms' ? 'New Alarm' : 'New Timer'}
          </Button>
        }
      />

      {view === 'alarms' && (
        <>
          {!loading && sortedAlarms.length === 0 ? (
            <EmptyState
              title="No alarms yet"
              description="Create an alarm to get pinged at a specific time."
              action={
                <Button variant="secondary" onClick={() => setShowCreateAlarm(true)}>
                  <PlusIcon size={15} />
                  New Alarm
                </Button>
              }
            />
          ) : (
            <div className="clock-page__list">
              {sortedAlarms.map((alarm) => (
                <AlarmRow
                  key={alarm.id}
                  alarm={alarm}
                  now={now}
                  onToggle={(enabled) => setAlarmEnabled(alarm, enabled)}
                  onEdit={() => setEditingAlarmId(alarm.id)}
                  onDelete={() => setDeletingAlarmId(alarm.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {view === 'timers' && (
        <>
          {!loading && countdownTimers.length === 0 ? (
            <EmptyState
              title="No timers yet"
              description="Create a countdown timer — it'll notify you (and make some noise) when it hits zero."
              action={
                <Button variant="secondary" onClick={() => setShowCreateTimer(true)}>
                  <PlusIcon size={15} />
                  New Timer
                </Button>
              }
            />
          ) : (
            <div className="clock-page__timer-grid">
              {countdownTimers.map((timer) => (
                <CountdownTimerCard
                  key={timer.id}
                  timer={timer}
                  now={now}
                  onPlay={() => startCountdownTimer(timer.id)}
                  onPause={() => pauseCountdownTimer(timer.id)}
                  onRestart={() => restartCountdownTimer(timer.id)}
                  onDelete={() => setDeletingTimerId(timer.id)}
                  highlight={highlightId === timer.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showCreateAlarm && (
        <AlarmFormModal onClose={() => setShowCreateAlarm(false)} onSubmit={async (values) => void (await createAlarm(values))} />
      )}

      {editingAlarm && (
        <AlarmFormModal
          initial={editingAlarm}
          onClose={() => setEditingAlarmId(null)}
          onSubmit={async (values) => void (await updateAlarm(editingAlarm.id, values))}
          onDelete={() => {
            setEditingAlarmId(null)
            setDeletingAlarmId(editingAlarm.id)
          }}
        />
      )}

      {showCreateTimer && (
        <CountdownTimerFormModal
          onClose={() => setShowCreateTimer(false)}
          onSubmit={async (values) => void (await createCountdownTimer(values))}
        />
      )}

      {deletingAlarmId && (
        <ConfirmDialog
          title="Delete this alarm?"
          description="This can't be undone."
          confirmLabel="Delete"
          onConfirm={async () => {
            await removeAlarm(deletingAlarmId)
            setDeletingAlarmId(null)
          }}
          onCancel={() => setDeletingAlarmId(null)}
        />
      )}

      {deletingTimerId && (
        <ConfirmDialog
          title="Delete this timer?"
          description="This can't be undone."
          confirmLabel="Delete"
          onConfirm={async () => {
            await removeCountdownTimer(deletingTimerId)
            setDeletingTimerId(null)
          }}
          onCancel={() => setDeletingTimerId(null)}
        />
      )}
    </>
  )
}
