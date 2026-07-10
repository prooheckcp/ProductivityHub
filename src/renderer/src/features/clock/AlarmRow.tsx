import type { JSX } from 'react'
import type { Alarm } from '@shared/types'
import { formatAlarmTime, formatNextFire, WEEKDAY_LABELS } from './alarmMath'
import './AlarmRow.css'

type AlarmRowProps = {
  alarm: Alarm
  now: number
  onToggle: (enabled: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

export default function AlarmRow({ alarm, now, onToggle, onEdit, onDelete }: AlarmRowProps): JSX.Element {
  return (
    <div className={'alarm-row' + (alarm.enabled ? '' : ' alarm-row--off')}>
      <button type="button" className="alarm-row__body" onClick={onEdit}>
        <span className="alarm-row__time">{formatAlarmTime(alarm.hour, alarm.minute)}</span>
        <span className="alarm-row__meta">
          <span className="alarm-row__name">{alarm.name}</span>
          <span className="alarm-row__detail">
            {alarm.repeat === 'weekly'
              ? alarm.daysOfWeek.length > 0
                ? alarm.daysOfWeek.map((d) => WEEKDAY_LABELS[d]).join(', ')
                : 'Weekly'
              : formatNextFire(alarm, new Date(now))}
          </span>
        </span>
      </button>

      <button type="button" className="alarm-row__delete" onClick={onDelete} aria-label="Delete alarm">
        ×
      </button>

      <button
        type="button"
        className={'alarm-row__toggle' + (alarm.enabled ? ' alarm-row__toggle--on' : '')}
        onClick={() => onToggle(!alarm.enabled)}
        aria-pressed={alarm.enabled}
        aria-label={alarm.enabled ? 'Disable alarm' : 'Enable alarm'}
      >
        <span className="alarm-row__switch">
          <span className="alarm-row__knob" />
        </span>
      </button>
    </div>
  )
}
