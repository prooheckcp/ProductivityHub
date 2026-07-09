import { useMemo } from 'react'
import type { CSSProperties, JSX } from 'react'
import { LeafIcon, TreeIcon } from '../../components/icons'
import { makeParticles } from './particles'
import type { DecorationProps, Gradient } from './types'

// Two depth layers so this reads as an actual treeline instead of a few
// isolated icons — a muted, smaller layer further back, and big, richly
// colored trees up front that anchor the bottom edge.
const BACK_TREES = [
  { left: '-2%', size: 90 },
  { left: '9%', size: 120 },
  { left: '19%', size: 80 },
  { left: '30%', size: 130 },
  { left: '41%', size: 95 },
  { left: '52%', size: 115 },
  { left: '63%', size: 85 },
  { left: '74%', size: 125 },
  { left: '85%', size: 95 },
  { left: '95%', size: 110 }
]

const FRONT_TREES = [
  { left: '-4%', size: 190 },
  { left: '9%', size: 240 },
  { left: '23%', size: 170 },
  { left: '38%', size: 260 },
  { left: '54%', size: 185 },
  { left: '69%', size: 235 },
  { left: '84%', size: 175 },
  { left: '96%', size: 220 }
]

function ForestDecoration(_props: DecorationProps): JSX.Element {
  const leaves = useMemo(() => makeParticles(18, [12, 24], [8, 16]), [])

  return (
    <div className="decoration-overlay" aria-hidden="true">
      <div className="decoration-overlay__ground" />

      {BACK_TREES.map((spot, index) => (
        <span
          key={index}
          className="decoration-overlay__tree decoration-overlay__tree--back"
          style={{ left: spot.left, color: '#3f7a52' }}
        >
          <TreeIcon size={spot.size} />
        </span>
      ))}

      {FRONT_TREES.map((spot, index) => (
        <span
          key={index}
          className="decoration-overlay__tree decoration-overlay__tree--front"
          style={{ left: spot.left, color: '#134a28' }}
        >
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
  cardTint: '#cdf0d9',
  Decoration: ForestDecoration
}
