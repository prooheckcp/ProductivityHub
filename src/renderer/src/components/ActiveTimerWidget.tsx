import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { PauseIcon } from './icons'
import { useTimersContext } from '../features/timers/TimersContext'
import defaultCover from '../assets/shiba-clock.png'
import { toFileUrl } from '../utils/fileUrl'
import { formatClock } from '../utils/format'
import { currentElapsedMs } from '@shared/timeMath'
import './ActiveTimerWidget.css'

export default function ActiveTimerWidget(): JSX.Element | null {
  const { timers, now, pauseTimer } = useTimersContext()
  const navigate = useNavigate()

  const runningTimer = timers.find((t) => t.runningSince !== null) ?? null

  if (!runningTimer) return null

  const clock = formatClock(currentElapsedMs(runningTimer, now))

  return (
    <button
      type="button"
      className="active-timer-widget"
      onClick={() => navigate('/time-tracker', { state: { openTimerId: runningTimer.id } })}
    >
      <span className="active-timer-widget__cover">
        <img
          src={runningTimer.imagePath ? toFileUrl(runningTimer.imagePath) : defaultCover}
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = defaultCover
          }}
          alt=""
        />
      </span>
      <span className="active-timer-widget__info">
        <span className="active-timer-widget__name">{runningTimer.name}</span>
        <span className="active-timer-widget__clock">
          <span className="active-timer-widget__dot" />
          {clock.hh}:{clock.mm}:{clock.ss}
        </span>
      </span>
      <span
        className="active-timer-widget__pause"
        role="button"
        aria-label="Pause timer"
        onClick={(event) => {
          event.stopPropagation()
          pauseTimer(runningTimer.id)
        }}
      >
        <PauseIcon size={16} />
      </span>
    </button>
  )
}
