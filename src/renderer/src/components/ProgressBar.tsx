import type { JSX } from 'react'
import './ProgressBar.css'

type ProgressBarProps = {
  percent: number
  label?: string
}

export default function ProgressBar({ percent, label }: ProgressBarProps): JSX.Element {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className="progress-bar">
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ width: `${clamped}%` }} />
      </div>
      <span className="progress-bar__label">{label ?? `${Math.round(clamped)}%`}</span>
    </div>
  )
}
