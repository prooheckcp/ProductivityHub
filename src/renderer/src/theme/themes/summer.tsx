import { useMemo } from 'react'
import type { JSX } from 'react'
import { BeachBallIcon, SunIcon } from '../../components/icons'
import type { DecorationProps, Gradient } from './types'

const BACKGROUND_CSS = `linear-gradient(180deg,
  #bae6fd 0%,
  #7dd3fc 28%,
  #38bdf8 46%,
  #0ea5e9 60%,
  #0369a1 78%,
  #fde68a 80%,
  #fcd34d 100%)`

const BALL_SPOTS = [
  { top: '14%', left: '18%', size: 30 },
  { top: '30%', left: '78%', size: 24 },
  { top: '52%', left: '10%', size: 20 },
  { top: '46%', left: '58%', size: 26 }
]

function SummerDecoration(_props: DecorationProps): JSX.Element {
  const balls = useMemo(
    () => BALL_SPOTS.map((spot, index) => ({ ...spot, delay: index * 0.8, duration: 4 + (index % 3) })),
    []
  )

  return (
    <div className="decoration-overlay" aria-hidden="true">
      <span className="decoration-overlay__sun" style={{ color: '#fef08a' }}>
        <SunIcon size={40} />
      </span>

      {balls.map((ball, index) => (
        <span
          key={index}
          className="decoration-overlay__item decoration-overlay__item--float"
          style={{ top: ball.top, left: ball.left, animationDelay: `${ball.delay}s`, animationDuration: `${ball.duration}s` }}
        >
          <BeachBallIcon size={ball.size} />
        </span>
      ))}

      <div className="decoration-overlay__wave">
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none">
          <path
            d="M0,70 C180,120 360,20 540,60 C720,100 900,10 1080,55 C1260,100 1350,60 1440,75 L1440,220 L0,220 Z"
            fill="#fcd34d"
          />
          <path
            d="M0,100 C220,140 420,60 640,95 C860,130 1060,55 1260,90 C1340,105 1400,95 1440,100 L1440,220 L0,220 Z"
            fill="#fbbf24"
            opacity="0.7"
          />
        </svg>
      </div>
    </div>
  )
}

export const summer: Gradient = {
  id: 'summer',
  name: 'Summer 🏖️',
  // Used only for the Settings swatch preview — the real background uses
  // backgroundCss below for the full sky/ocean/sand scene.
  stops: ['#7dd3fc', '#fcd34d'],
  contrast: '#7a2e0e',
  kind: 'effect',
  decoration: 'summer',
  unlockedBy: 'timerusage-1h',
  backgroundCss: BACKGROUND_CSS,
  cardTint: '#fbe4ae',
  Decoration: SummerDecoration
}
