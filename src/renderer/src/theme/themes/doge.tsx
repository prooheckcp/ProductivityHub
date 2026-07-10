import { useEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import { PawIcon } from '../../components/icons'
import dogeImg from '../../assets/doge.png'
import type { DecorationProps, Gradient } from './types'

// Scattered paw prints that gently pulse in and out behind everything.
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

// Classic doge-meme grammar: "such X", "much Y", "very Z", "so W", "wow".
const PHRASES = [
  'wow',
  'such app',
  'much tracking',
  'very productive',
  'so code',
  'much focus',
  'many hours',
  'such wow',
  'very timer',
  'much achievement',
  'so stats',
  'very coding',
  'much streak',
  'such grind',
  'many commits',
  'very focus',
  'so productive',
  'wow much work'
]

// The meme's signature multi-colour Comic Sans — bright, saturated hues chosen
// to pop against the gold/amber gradient (yellow would vanish, so it's out).
const COLORS = [
  '#e11d48', // rose red
  '#2563eb', // royal blue
  '#16a34a', // green
  '#db2777', // magenta
  '#7c3aed', // purple
  '#0891b2', // teal
  '#c2410c' // burnt orange
]

// Must match the .decoration-overlay__doge-text animation duration below so
// each phrase is unmounted exactly when its fade finishes.
const PHRASE_LIFETIME = 3600

type Phrase = {
  id: number
  text: string
  color: string
  top: number
  left: number
  size: number
  rotate: number
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function DogeDecoration({ tint }: DecorationProps): JSX.Element {
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const nextId = useRef(0)
  const spots = useMemo(() => SPOTS.map((spot, index) => ({ ...spot, delay: (index * 1.3) % 6 })), [])

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const removers: ReturnType<typeof setTimeout>[] = []

    const spawn = (): void => {
      const id = nextId.current++
      const phrase: Phrase = {
        id,
        text: pick(PHRASES),
        color: pick(COLORS),
        // keep clear of the very edges so wide phrases stay on screen
        top: 8 + Math.random() * 74,
        left: 6 + Math.random() * 68,
        size: 26 + Math.random() * 26,
        rotate: -12 + Math.random() * 24
      }
      setPhrases((prev) => [...prev, phrase])
      removers.push(
        setTimeout(() => {
          setPhrases((prev) => prev.filter((p) => p.id !== id))
        }, PHRASE_LIFETIME)
      )
      // stagger the next spawn so the screen never feels metronomic
      timeout = setTimeout(spawn, 700 + Math.random() * 1100)
    }

    // a short lead-in before the first "wow"
    timeout = setTimeout(spawn, 400)

    return () => {
      clearTimeout(timeout)
      removers.forEach(clearTimeout)
    }
  }, [])

  return (
    <div className="decoration-overlay" aria-hidden="true">
      <div style={{ color: tint }}>
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
      {phrases.map((p) => (
        <span
          key={p.id}
          className="decoration-overlay__doge-text"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            color: p.color,
            fontSize: `${p.size}px`,
            ['--doge-rotate' as string]: `${p.rotate}deg`
          }}
        >
          {p.text}
        </span>
      ))}
      <img className="decoration-overlay__doge" src={dogeImg} alt="" draggable={false} />
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
  unlockedBy: 'devtools-1h',
  cardTint: '#fbe6a8',
  Decoration: DogeDecoration
}
