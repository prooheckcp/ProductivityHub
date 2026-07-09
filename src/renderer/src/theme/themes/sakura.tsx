import { useMemo } from 'react'
import type { CSSProperties, JSX } from 'react'
import { SakuraFlowerIcon } from '../../components/icons'
import { makeParticles } from './particles'
import type { DecorationProps, Gradient } from './types'

function SakuraDecoration({ tint }: DecorationProps): JSX.Element {
  // Wide size range so petals read as a real mixed flurry, not a uniform grid.
  const petals = useMemo(() => makeParticles(18, [9, 36], [9, 18]), [])

  return (
    <div className="decoration-overlay" aria-hidden="true" style={{ color: tint }}>
      {petals.map((p) => (
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
          <SakuraFlowerIcon size={p.size} />
        </span>
      ))}
    </div>
  )
}

export const sakura: Gradient = {
  id: 'sakura',
  name: 'Sakura 🌸',
  stops: ['#fde2ef', '#fbb6d3'],
  // A deep rose, picked to pop against the pale pink background — the old
  // version tinted petals with the background's own pink stop, so they
  // nearly disappeared into it.
  contrast: '#c81d63',
  kind: 'effect',
  decoration: 'sakura',
  unlockedBy: null,
  cardTint: '#fff3f8',
  Decoration: SakuraDecoration
}
