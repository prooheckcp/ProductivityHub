import { useMemo } from 'react'
import type { CSSProperties, JSX } from 'react'
import { BubbleIcon, PawIcon, SakuraFlowerIcon, SnowflakeIcon, SunIcon } from './icons'
import { useTheme } from '../theme/ThemeContext'
import type { Decoration } from '../theme/gradients'
import './DecorationOverlay.css'

type Particle = {
  id: number
  left: number
  size: number
  delay: number
  duration: number
  drift: number
}

function makeParticles(count: number, sizeRange: [number, number], durationRange: [number, number]): Particle[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    delay: -Math.random() * durationRange[1],
    duration: durationRange[0] + Math.random() * (durationRange[1] - durationRange[0]),
    drift: (Math.random() - 0.5) * 60
  }))
}

const DOGE_SPOTS = [
  { top: '6%', left: '10%', size: 32 },
  { top: '16%', left: '82%', size: 26 },
  { top: '48%', left: '4%', size: 30 },
  { top: '72%', left: '90%', size: 36 },
  { top: '84%', left: '20%', size: 24 },
  { top: '38%', left: '95%', size: 22 },
  { top: '60%', left: '46%', size: 20 },
  { top: '12%', left: '55%', size: 18 }
]

export default function DecorationOverlay(): JSX.Element | null {
  const { backgroundGradient } = useTheme()
  const decoration = backgroundGradient.decoration

  const falling = useMemo(() => makeParticles(16, [14, 26], [9, 17]), [decoration])
  const rising = useMemo(() => makeParticles(14, [8, 20], [7, 14]), [decoration])
  const dogeFades = useMemo(
    () => DOGE_SPOTS.map((spot, index) => ({ ...spot, delay: (index * 1.3) % 6 })),
    [decoration]
  )

  if (decoration === null) return null

  // Tint decorations with the theme's own darker stop, not the (independent)
  // button accent — Doge paws should read amber even if the buttons are blue.
  const overlayStyle: CSSProperties = { color: backgroundGradient.stops[1] }

  if (decoration === 'doge') {
    return (
      <div className="decoration-overlay" aria-hidden="true" style={overlayStyle}>
        {dogeFades.map((spot, index) => (
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

  if (decoration === 'sakura' || decoration === 'snow') {
    const Icon = decoration === 'sakura' ? SakuraFlowerIcon : SnowflakeIcon
    return (
      <div className="decoration-overlay" aria-hidden="true" style={overlayStyle}>
        {falling.map((p) => (
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
            <Icon size={p.size} />
          </span>
        ))}
      </div>
    )
  }

  if (decoration === 'underwater') {
    return (
      <div className="decoration-overlay" aria-hidden="true" style={overlayStyle}>
        {rising.map((p) => (
          <span
            key={p.id}
            className="decoration-overlay__item decoration-overlay__item--rise"
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

  if (decoration === 'summer') {
    return (
      <div className="decoration-overlay" aria-hidden="true" style={overlayStyle}>
        <span className="decoration-overlay__sun">
          <SunIcon size={40} />
        </span>
        <div className="decoration-overlay__sand" />
      </div>
    )
  }

  return null
}

export type { Decoration }
