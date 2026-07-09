import type { JSX } from 'react'
import { CheckIcon } from '../../components/icons'
import { GRADIENTS } from '../../theme/gradients'
import './GradientPicker.css'

type GradientPickerProps = {
  label: string
  value: string
  onChange: (id: string) => void
}

export default function GradientPicker({ label, value, onChange }: GradientPickerProps): JSX.Element {
  return (
    <div className="gradient-picker">
      <p className="gradient-picker__label">{label}</p>
      <div className="gradient-picker__grid">
        {GRADIENTS.map((gradient) => {
          const isActive = gradient.id === value
          return (
            <button
              key={gradient.id}
              type="button"
              className={'gradient-swatch' + (isActive ? ' gradient-swatch--active' : '')}
              style={{ background: `linear-gradient(135deg, ${gradient.stops[0]}, ${gradient.stops[1]})` }}
              onClick={() => onChange(gradient.id)}
              aria-pressed={isActive}
            >
              {isActive && (
                <span className="gradient-swatch__check">
                  <CheckIcon size={12} />
                </span>
              )}
              <span className="gradient-swatch__label">{gradient.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
