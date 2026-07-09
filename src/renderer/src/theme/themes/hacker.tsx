import { useMemo } from 'react'
import type { CSSProperties, JSX } from 'react'
import { makeParticles } from './particles'
import type { DecorationProps, Gradient } from './types'

const GLYPHS = ['0', '1', '$', '#', '/', '<', '>', '{', '}']

function HackerDecoration({ tint }: DecorationProps): JSX.Element {
  const glyphs = useMemo(() => {
    const particles = makeParticles(28, [12, 22], [7, 15])
    return particles.map((p) => ({ ...p, char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)] }))
  }, [])

  return (
    <div className="decoration-overlay" aria-hidden="true" style={{ color: tint }}>
      {glyphs.map((p) => (
        <span
          key={p.id}
          className="decoration-overlay__item decoration-overlay__item--fall decoration-overlay__item--glyph"
          style={
            {
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`
            } as CSSProperties
          }
        >
          {p.char}
        </span>
      ))}
    </div>
  )
}

export const hacker: Gradient = {
  id: 'hacker',
  name: 'Hacker Mode 💻',
  stops: ['#020604', '#0c2a17'],
  contrast: '#39ff88',
  kind: 'effect',
  decoration: 'hacker',
  // Unlocked by the 250-hour developer-tools achievement (src/shared/achievements.ts).
  unlockedBy: 'devtools-250h',
  cardTint: '#b8f0cd',
  Decoration: HackerDecoration
}
