import type { JSX } from 'react'
import { CheckIcon, LockIcon } from '../../components/icons'
import { useTheme } from '../../theme/ThemeContext'
import { GRADIENTS, isGradientUnlocked, type Gradient } from '../../theme/gradients'
import { ACHIEVEMENT_DEFS } from '@shared/achievements'
import './GradientPicker.css'

type GradientPickerProps = {
  label: string
  value: string
  onChange: (id: string) => void
  options?: Gradient[]
}

function unlockHint(gradient: Gradient): string {
  const def = ACHIEVEMENT_DEFS.find((d) => d.id === gradient.unlockedBy)
  return def ? `Unlock by earning "${def.title}"` : 'Locked'
}

export default function GradientPicker({ label, value, onChange, options = GRADIENTS }: GradientPickerProps): JSX.Element {
  const { unlockedAchievementIds } = useTheme()

  return (
    <div className="gradient-picker">
      <p className="gradient-picker__label">{label}</p>
      <div className="gradient-picker__grid">
        {options.map((gradient) => {
          const isActive = gradient.id === value
          const unlocked = isGradientUnlocked(gradient, unlockedAchievementIds)
          return (
            <button
              key={gradient.id}
              type="button"
              className={
                'gradient-swatch' +
                (isActive ? ' gradient-swatch--active' : '') +
                (unlocked ? '' : ' gradient-swatch--locked')
              }
              style={{ background: `linear-gradient(135deg, ${gradient.stops[0]}, ${gradient.stops[1]})` }}
              onClick={() => unlocked && onChange(gradient.id)}
              disabled={!unlocked}
              aria-pressed={isActive}
              title={unlocked ? undefined : unlockHint(gradient)}
            >
              {isActive && (
                <span className="gradient-swatch__check">
                  <CheckIcon size={12} />
                </span>
              )}
              {!unlocked && (
                <span className="gradient-swatch__lock">
                  <LockIcon size={16} />
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
