import { useMemo } from 'react'
import type { CSSProperties, JSX } from 'react'
import { SnowflakeIcon } from '../../components/icons'
import { makeParticles } from './particles'
import type { DecorationProps, Gradient } from './types'

function SnowDecoration({ tint }: DecorationProps): JSX.Element {
  const flakes = useMemo(() => makeParticles(16, [12, 26], [9, 17]), [])

  return (
    <div className="decoration-overlay" aria-hidden="true" style={{ color: tint }}>
      {flakes.map((p) => (
        <span
          key={p.id}
          className="decoration-overlay__item decoration-overlay__item--fall"
          style={
            {
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`
            } as CSSProperties
          }
        >
          <SnowflakeIcon size={p.size} />
        </span>
      ))}

      <div className="decoration-overlay__wave">
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none">
          <path
            d="M0,80 C180,130 360,30 540,70 C720,110 900,20 1080,65 C1260,110 1350,70 1440,85 L1440,220 L0,220 Z"
            fill="#ffffff"
          />
          <path
            d="M0,110 C220,150 420,70 640,105 C860,140 1060,65 1260,100 C1340,115 1400,105 1440,110 L1440,220 L0,220 Z"
            fill="#eaf4ff"
            opacity="0.8"
          />
        </svg>
      </div>
    </div>
  )
}

export const snow: Gradient = {
  id: 'snow',
  name: 'Snow ❄️',
  stops: ['#f0f9ff', '#93c5fd'],
  contrast: '#0c2f52',
  kind: 'effect',
  decoration: 'snow',
  unlockedBy: null,
  cardTint: '#d5eaff',
  Decoration: SnowDecoration
}
