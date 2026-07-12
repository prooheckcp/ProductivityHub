import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClockContext } from './ClockContext'
import { formatAlarmTime, formatCountdown, msUntilNextFire } from './alarmMath'
import './ClockWidgets.css'

const ONE_HOUR_MS = 60 * 60 * 1000

// Running countdown timers now render through CornerTimers (the unified
// pinned/running corner cards); this widget only surfaces upcoming alarms.
export default function ClockWidgets(): JSX.Element | null {
  const { alarms, now } = useClockContext()
  const navigate = useNavigate()

  const soonAlarms = alarms.filter((alarm) => {
    const ms = msUntilNextFire(alarm, new Date(now))
    return ms !== null && ms <= ONE_HOUR_MS
  })

  if (soonAlarms.length === 0) return null

  return (
    <>
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
