import { useState } from 'react'
import type { JSX } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import type { CountdownTimerFormInput } from '@shared/types'
import './ClockForms.css'

type CountdownTimerFormModalProps = {
  onClose: () => void
  onSubmit: (values: CountdownTimerFormInput) => Promise<void>
}

export default function CountdownTimerFormModal({ onClose, onSubmit }: CountdownTimerFormModalProps): JSX.Element {
  const [name, setName] = useState('')
  const [hours, setHours] = useState('0')
  const [minutes, setMinutes] = useState('5')
  const [seconds, setSeconds] = useState('0')
  const [saving, setSaving] = useState(false)

  const totalMs = (Number(hours || 0) * 3600 + Number(minutes || 0) * 60 + Number(seconds || 0)) * 1000

  async function handleSubmit(): Promise<void> {
    if (!name.trim() || totalMs <= 0) return
    setSaving(true)
    try {
      await onSubmit({ name: name.trim(), durationMs: totalMs })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="New timer"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={handleSubmit} disabled={saving || !name.trim() || totalMs <= 0}>
            Create timer
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
            placeholder="e.g. Pasta"
            autoFocus
          />
        </label>

        <div className="form-field">
          <span>Duration</span>
          <div className="clock-form__duration-row">
            <label className="clock-form__duration-field">
              <input
                type="number"
                min={0}
                max={23}
                value={hours}
                onChange={(event) => setHours(event.target.value)}
              />
              <span>hours</span>
            </label>
            <label className="clock-form__duration-field">
              <input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
              />
              <span>min</span>
            </label>
            <label className="clock-form__duration-field">
              <input
                type="number"
                min={0}
                max={59}
                value={seconds}
                onChange={(event) => setSeconds(event.target.value)}
              />
              <span>sec</span>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  )
}
