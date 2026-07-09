import { useMemo } from 'react'
import type { CSSProperties, JSX } from 'react'
import { LeafIcon, TreeIcon } from '../../components/icons'
import { makeParticles } from './particles'
import type { DecorationProps, Gradient } from './types'

const TREE_SPOTS = [
  { left: '4%', size: 46 },
  { left: '15%', size: 32 },
  { left: '26%', size: 54 },
  { left: '62%', size: 36 },
  { left: '76%', size: 58 },
  { left: '90%', size: 40 }
]

function ForestDecoration(_props: DecorationProps): JSX.Element {
  const leaves = useMemo(() => makeParticles(16, [10, 20], [8, 16]), [])

  return (
    <div className="decoration-overlay" aria-hidden="true">
      {TREE_SPOTS.map((spot, index) => (
        <span key={index} className="decoration-overlay__tree" style={{ left: spot.left, color: '#1f6f3c' }}>
          <TreeIcon size={spot.size} />
        </span>
      ))}

      {leaves.map((p) => (
        <span
          key={p.id}
          className="decoration-overlay__item decoration-overlay__item--fall"
          style={
            {
              left: `${p.left}%`,
              color: '#d97706',
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`
            } as CSSProperties
          }
        >
          <LeafIcon size={p.size} />
        </span>
      ))}
    </div>
  )
}

export const forest: Gradient = {
  id: 'forest',
  name: 'Forest 🌲',
  stops: ['#22c55e', '#0ea5e9'],
  contrast: '#ffffff',
  kind: 'effect',
  decoration: 'forest',
  unlockedBy: null,
  cardTint: '#eef9f1',
  Decoration: ForestDecoration
}
