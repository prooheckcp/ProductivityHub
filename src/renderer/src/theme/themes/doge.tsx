import { useMemo } from 'react'
import type { JSX } from 'react'
import { PawIcon } from '../../components/icons'
import type { DecorationProps, Gradient } from './types'

const SPOTS = [
  { top: '6%', left: '10%', size: 32 },
  { top: '16%', left: '82%', size: 26 },
  { top: '48%', left: '4%', size: 30 },
  { top: '72%', left: '90%', size: 36 },
  { top: '84%', left: '20%', size: 24 },
  { top: '38%', left: '95%', size: 22 },
  { top: '60%', left: '46%', size: 20 },
  { top: '12%', left: '55%', size: 18 }
]

function DogeDecoration({ tint }: DecorationProps): JSX.Element {
  const spots = useMemo(() => SPOTS.map((spot, index) => ({ ...spot, delay: (index * 1.3) % 6 })), [])

  return (
    <div className="decoration-overlay" aria-hidden="true" style={{ color: tint }}>
      {spots.map((spot, index) => (
        <span
          key={index}
          className="decoration-overlay__item decoration-overlay__item--fade"
          style={{ top: spot.top, left: spot.left, animationDelay: `${spot.delay}s` }}
        >
          <PawIcon size={spot.size} />
        </span>
      ))}
    </div>
  )
}

export const doge: Gradient = {
  id: 'doge',
  name: 'Doge 🐕',
  stops: ['#fde68a', '#fbbf24'],
  // Dark brown, chosen specifically to contrast against the gold/amber
  // stops — the paws used to inherit the (light amber) background stop
  // itself and all but disappeared.
  contrast: '#4a2e00',
  kind: 'effect',
  decoration: 'doge',
  unlockedBy: null,
  cardTint: '#fff8e6',
  Decoration: DogeDecoration
}
