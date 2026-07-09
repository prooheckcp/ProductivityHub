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
  cardTint: '#f3f9ff',
  Decoration: SnowDecoration
}
