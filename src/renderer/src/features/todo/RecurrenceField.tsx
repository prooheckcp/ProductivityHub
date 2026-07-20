import type { JSX } from 'react'
import type { Recurrence, RecurrenceCalendarMode, RecurrenceMode } from '@shared/types'
import { emptyRecurrence } from '@shared/recurrence'
import { RepeatIcon } from '../../components/icons'
import './RecurrenceField.css'

type RecurrenceFieldProps = {
  value: Recurrence | null
  onChange: (recurrence: Recurrence | null) => void
  completionCount?: number
}

const MODE_OPTIONS: { mode: RecurrenceMode; label: string }[] = [
  { mode: 'daily', label: 'Daily' },
  { mode: 'weekly', label: 'Weekly' },
  { mode: 'biweekly', label: 'Every 2 weeks' },
  { mode: 'monthly', label: 'Monthly' },
  { mode: 'custom', label: 'Custom' }
]

const WEEKDAYS = [
  { day: 0, label: 'S' },
  { day: 1, label: 'M' },
  { day: 2, label: 'T' },
  { day: 3, label: 'W' },
  { day: 4, label: 'T' },
  { day: 5, label: 'F' },
  { day: 6, label: 'S' }
]

const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function toggle(list: number[], value: number): number[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function RecurrenceField({ value, onChange, completionCount = 0 }: RecurrenceFieldProps): JSX.Element {
  const enabled = value !== null
  const recurrence = value

  function setEnabled(on: boolean): void {
    onChange(on ? emptyRecurrence('daily') : null)
  }

  function setMode(mode: RecurrenceMode): void {
    if (!recurrence) return
    onChange({ ...recurrence, mode })
  }

  function setCalendarMode(calendarMode: RecurrenceCalendarMode): void {
    if (!recurrence) return
    onChange({ ...recurrence, calendarMode })
  }

  return (
    <div className="recurrence-field">
      <button
        type="button"
        className={'recurrence-field__toggle' + (enabled ? ' recurrence-field__toggle--on' : '')}
        onClick={() => setEnabled(!enabled)}
        aria-pressed={enabled}
      >
        <span className="recurrence-field__toggle-icon">
          <RepeatIcon size={14} />
        </span>
        <span className="recurrence-field__toggle-label">Repeats</span>
        {completionCount > 0 && (
          <span className="recurrence-field__count">completed {completionCount}×</span>
        )}
        <span className={'recurrence-field__switch' + (enabled ? ' recurrence-field__switch--on' : '')}>
          <span className="recurrence-field__knob" />
        </span>
      </button>

      {enabled && recurrence && (
        <div className="recurrence-field__body">
          <div className="recurrence-field__chips">
            {MODE_OPTIONS.map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                className={
                  'recurrence-field__chip' + (recurrence.mode === mode ? ' recurrence-field__chip--active' : '')
                }
                onClick={() => setMode(mode)}
              >
                {label}
              </button>
            ))}
          </div>

          {recurrence.mode === 'custom' && (
            <div className="recurrence-field__custom">
              <div className="recurrence-field__seg">
                <button
                  type="button"
                  className={
                    'recurrence-field__seg-btn' +
                    (recurrence.calendarMode === 'week' ? ' recurrence-field__seg-btn--active' : '')
                  }
                  onClick={() => setCalendarMode('week')}
                >
                  By week
                </button>
                <button
                  type="button"
                  className={
                    'recurrence-field__seg-btn' +
                    (recurrence.calendarMode === 'month' ? ' recurrence-field__seg-btn--active' : '')
                  }
                  onClick={() => setCalendarMode('month')}
                >
                  By month
                </button>
              </div>

              {recurrence.calendarMode === 'week' ? (
                <div className="recurrence-field__weekdays">
                  {WEEKDAYS.map(({ day, label }) => (
                    <button
                      key={day}
                      type="button"
                      className={
                        'recurrence-field__day' +
                        (recurrence.daysOfWeek.includes(day) ? ' recurrence-field__day--active' : '')
                      }
                      onClick={() => onChange({ ...recurrence, daysOfWeek: toggle(recurrence.daysOfWeek, day) })}
                      aria-pressed={recurrence.daysOfWeek.includes(day)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="recurrence-field__monthdays">
                  {MONTH_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className={
                        'recurrence-field__mday' +
                        (recurrence.daysOfMonth.includes(day) ? ' recurrence-field__mday--active' : '')
                      }
                      onClick={() => onChange({ ...recurrence, daysOfMonth: toggle(recurrence.daysOfMonth, day) })}
                      aria-pressed={recurrence.daysOfMonth.includes(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="recurrence-field__hint">
            Completing this task keeps it checked, then it automatically resets when it&apos;s due again (with a 4-hour
            tolerance) — you&apos;ll get a notification when it&apos;s time.
          </p>
        </div>
      )}
    </div>
  )
}
