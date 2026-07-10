import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { PauseIcon } from '../../components/icons'
import { currentRemainingMs } from '@shared/timeMath'
import { formatClock } from '../../utils/format'
import { useClockContext } from './ClockContext'
import { formatAlarmTime, formatCountdown, msUntilNextFire } from './alarmMath'
import './ClockWidgets.css'

const ONE_HOUR_MS = 60 * 60 * 1000

export default function ClockWidgets(): JSX.Element | null {
  const { alarms, countdownTimers, now, pauseCountdownTimer } = useClockContext()
  const navigate = useNavigate()

  const runningTimers = countdownTimers.filter((t) => t.status === 'running')
  const soonAlarms = alarms.filter((alarm) => {
    const ms = msUntilNextFire(alarm, new Date(now))
    return ms !== null && ms <= ONE_HOUR_MS
  })

  if (runningTimers.length === 0 && soonAlarms.length === 0) return null

  return (
    <>
      {runningTimers.map((timer) => {
        const clock = formatClock(currentRemainingMs(timer, now))
        return (
          <button key={timer.id} type="button" className="clock-widget" onClick={() => navigate('/clock')}>
            <span className="clock-widget__info">
              <span className="clock-widget__name">{timer.name}</span>
              <span className="clock-widget__value">
                <span className="clock-widget__dot" />
                {clock.hh}:{clock.mm}:{clock.ss}
              </span>
            </span>
            <span
              className="clock-widget__action"
              role="button"
              aria-label="Pause timer"
              onClick={(event) => {
                event.stopPropagation()
                pauseCountdownTimer(timer.id)
              }}
            >
              <PauseIcon size={16} />
            </span>
          </button>
        )
      })}

      {soonAlarms.map((alarm) => {
        const ms = msUntilNextFire(alarm, new Date(now)) ?? 0
        return (
          <button key={alarm.id} type="button" className="clock-widget clock-widget--alarm" onClick={() => navigate('/clock')}>
            <span className="clock-widget__info">
              <span className="clock-widget__name">{alarm.name}</span>
              <span className="clock-widget__value">
                {formatAlarmTime(alarm.hour, alarm.minute)} · {formatCountdown(ms)}
              </span>
            </span>
          </button>
        )
      })}
    </>
  )
}
