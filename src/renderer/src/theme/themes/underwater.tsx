import { useMemo } from 'react'
import type { CSSProperties, JSX } from 'react'
import { BubbleIcon } from '../../components/icons'
import { makeParticles } from './particles'
import type { DecorationProps, Gradient } from './types'

function UnderwaterDecoration({ tint }: DecorationProps): JSX.Element {
  const bubbles = useMemo(() => makeParticles(16, [7, 22], [6, 13]), [])

  return (
    <div className="decoration-overlay" aria-hidden="true" style={{ color: tint }}>
      {bubbles.map((p) => (
        <span
          key={p.id}
          className="decoration-overlay__item decoration-overlay__item--pop"
          style={
            {
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`
            } as CSSProperties
          }
        >
          <BubbleIcon size={p.size} />
        </span>
      ))}
    </div>
  )
}

export const underwater: Gradient = {
  id: 'underwater',
  name: 'Underwater 🐠',
  stops: ['#a5f3fc', '#0e7490'],
  contrast: '#ffffff',
  kind: 'effect',
  decoration: 'underwater',
  unlockedBy: null,
  cardTint: '#bceef4',
  Decoration: UnderwaterDecoration
}
