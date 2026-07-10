import { useState } from 'react'
import type { JSX } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import type { Alarm, AlarmFormInput, AlarmRepeat } from '@shared/types'
import { WEEKDAY_LABELS } from './alarmMath'
import './ClockForms.css'

type AlarmFormModalProps = {
  initial?: Alarm
  onClose: () => void
  onSubmit: (values: AlarmFormInput) => Promise<void>
  onDelete?: () => void
}

function toTimeInputValue(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export default function AlarmFormModal({ initial, onClose, onSubmit, onDelete }: AlarmFormModalProps): JSX.Element {
  const [name, setName] = useState(initial?.name ?? '')
  const [time, setTime] = useState(toTimeInputValue(initial?.hour ?? 8, initial?.minute ?? 0))
  const [repeat, setRepeat] = useState<AlarmRepeat>(initial?.repeat ?? 'once')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initial?.daysOfWeek ?? [])
  const [saving, setSaving] = useState(false)

  function toggleDay(day: number): void {
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()))
  }

  async function handleSubmit(): Promise<void> {
    if (!name.trim()) return
    const [hourStr, minuteStr] = time.split(':')
    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        hour: Number(hourStr),
        minute: Number(minuteStr),
        repeat,
        daysOfWeek,
        enabled: initial?.enabled ?? true
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={initial ? 'Edit alarm' : 'New alarm'}
      onClose={onClose}
      footer={
        <>
          {initial && onDelete && (
            <Button variant="ghost" type="button" onClick={onDelete} style={{ marginRight: 'auto', color: 'var(--danger)' }}>
              Delete
            </Button>
          )}
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={handleSubmit} disabled={saving || !name.trim()}>
            {initial ? 'Save changes' : 'Create alarm'}
          </Button>
        </>
      }
    >
      <div className="form-fields">
        <label className="form-field">
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Wake up"
            autoFocus
          />
        </label>

        <label className="form-field">
          <span>Time</span>
          <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </label>

        <div className="form-field">
          <span>Repeat</span>
          <div className="clock-form__toggle-row">
            <button
              type="button"
              className={'clock-form__toggle' + (repeat === 'once' ? ' clock-form__toggle--active' : '')}
              onClick={() => setRepeat('once')}
            >
              Once
            </button>
            <button
              type="button"
              className={'clock-form__toggle' + (repeat === 'weekly' ? ' clock-form__toggle--active' : '')}
              onClick={() => setRepeat('weekly')}
            >
              Weekly
            </button>
          </div>
        </div>

        <div className="form-field">
          <span>{repeat === 'weekly' ? 'Repeats on' : 'Day (optional — leave blank for the next occurrence)'}</span>
          <div className="clock-form__day-row">
            {WEEKDAY_LABELS.map((label, day) => (
              <button
                key={day}
                type="button"
                className={'clock-form__day' + (daysOfWeek.includes(day) ? ' clock-form__day--active' : '')}
                onClick={() => toggleDay(day)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
