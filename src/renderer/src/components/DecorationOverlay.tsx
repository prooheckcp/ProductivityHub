import type { JSX } from 'react'
import { PawIcon, SakuraFlowerIcon } from './icons'
import { useTheme } from '../theme/ThemeContext'
import './DecorationOverlay.css'

const DOGE_SPOTS = [
  { top: '6%', left: '10%', size: 34, rotate: -18 },
  { top: '16%', left: '82%', size: 26, rotate: 12 },
  { top: '48%', left: '4%', size: 30, rotate: 24 },
  { top: '72%', left: '90%', size: 38, rotate: -10 },
  { top: '84%', left: '20%', size: 24, rotate: 30 },
  { top: '38%', left: '95%', size: 22, rotate: -25 }
]

const SAKURA_SPOTS = [
  { top: '8%', left: '88%', size: 30, rotate: 10 },
  { top: '22%', left: '6%', size: 24, rotate: -15 },
  { top: '55%', left: '92%', size: 34, rotate: 30 },
  { top: '68%', left: '8%', size: 28, rotate: -8 },
  { top: '88%', left: '78%', size: 22, rotate: 20 },
  { top: '40%', left: '2%', size: 20, rotate: 5 }
]

export default function DecorationOverlay(): JSX.Element | null {
  const { backgroundGradient } = useTheme()

  if (backgroundGradient.decoration === 'doge') {
    return (
      <div className="decoration-overlay" aria-hidden="true">
        {DOGE_SPOTS.map((spot, index) => (
          <span
            key={index}
            className="decoration-overlay__item"
            style={{ top: spot.top, left: spot.left, transform: `rotate(${spot.rotate}deg)` }}
          >
            <PawIcon size={spot.size} />
          </span>
        ))}
      </div>
    )
  }

  if (backgroundGradient.decoration === 'sakura') {
    return (
      <div className="decoration-overlay" aria-hidden="true">
        {SAKURA_SPOTS.map((spot, index) => (
          <span
            key={index}
            className="decoration-overlay__item"
            style={{ top: spot.top, left: spot.left, transform: `rotate(${spot.rotate}deg)` }}
          >
            <SakuraFlowerIcon size={spot.size} />
          </span>
        ))}
      </div>
    )
  }

  return null
}
