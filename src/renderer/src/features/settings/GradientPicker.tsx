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

// Every effect theme's name ends in a motif emoji (e.g. "Summer 🏖️") — pull it
// out to show a big recognizable icon on the swatch instead of a flat gradient.
function themeEmoji(name: string): string | null {
  const last = name.trim().split(/\s+/).pop() ?? ''
  return /\p{Extended_Pictographic}/u.test(last) ? last : null
}

function swatchBackground(gradient: Gradient): string {
  return gradient.backgroundCss ?? `linear-gradient(135deg, ${gradient.stops[0]}, ${gradient.stops[1]})`
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
          const isEffect = gradient.kind === 'effect'
          const emoji = isEffect ? themeEmoji(gradient.name) : null
          return (
            <div key={gradient.id} className="gradient-swatch-wrap">
              <button
                type="button"
                className={
                  'gradient-swatch' +
                  (isActive ? ' gradient-swatch--active' : '') +
                  (isEffect ? ' gradient-swatch--effect' : '') +
                  (unlocked ? '' : ' gradient-swatch--locked')
                }
                style={{ background: swatchBackground(gradient) }}
                onClick={() => unlocked && onChange(gradient.id)}
                aria-disabled={!unlocked}
                aria-pressed={isActive}
              >
                {/* Animated themes get a moving sheen + a motif emoji + tag so
                    they're identifiable at a glance, not just a flat gradient. */}
                {isEffect && unlocked && <span className="gradient-swatch__shine" />}
                {emoji && <span className="gradient-swatch__motif">{emoji}</span>}
                {isEffect && (
                  <span className="gradient-swatch__live">
                    <span className="gradient-swatch__live-dot" />
                    Animated
                  </span>
                )}
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
              {/* Rendered outside the button: the button has overflow:hidden
                  (to clip its gradient background to the rounded corners),
                  which was silently clipping this tooltip when it lived inside. */}
              {!unlocked && <span className="gradient-swatch__tooltip">{unlockHint(gradient)}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
