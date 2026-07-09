export type Decoration = 'doge' | 'sakura' | 'underwater' | 'snow' | 'summer' | null

export type GradientKind = 'color' | 'effect'

export type Gradient = {
  id: string
  name: string
  /** Gradient stops, applied light-to-dark / start-to-end. */
  stops: [string, string]
  /** Text color that reads well directly on top of the gradient. */
  contrast: string
  kind: GradientKind
  decoration: Decoration
  /** Achievement id required to select this theme, or null if it's free. */
  unlockedBy: string | null
}

// "color" themes are plain, calm accents — safe to use anywhere (buttons,
// active states, background wash). "effect" themes add motion/decoration and
// are meant for the background only, so a punchy theme like Sakura never
// ends up painting every button dark pink.
export const GRADIENTS: Gradient[] = [
  { id: 'indigo', name: 'Indigo 💜', stops: ['#6366f1', '#8b5cf6'], contrast: '#ffffff', kind: 'color', decoration: null, unlockedBy: null },
  { id: 'ocean', name: 'Ocean 🌊', stops: ['#06b6d4', '#3b82f6'], contrast: '#ffffff', kind: 'color', decoration: null, unlockedBy: null },
  { id: 'sunset', name: 'Sunset 🌅', stops: ['#f97316', '#ec4899'], contrast: '#ffffff', kind: 'color', decoration: null, unlockedBy: null },
  { id: 'forest', name: 'Forest 🌲', stops: ['#22c55e', '#0ea5e9'], contrast: '#ffffff', kind: 'color', decoration: null, unlockedBy: null },
  { id: 'grape', name: 'Grape 🍇', stops: ['#a855f7', '#6366f1'], contrast: '#ffffff', kind: 'color', decoration: null, unlockedBy: null },
  { id: 'rose', name: 'Rose 🌹', stops: ['#f43f5e', '#f97316'], contrast: '#ffffff', kind: 'color', decoration: null, unlockedBy: null },
  { id: 'gold', name: 'Gold ✨', stops: ['#f59e0b', '#ef4444'], contrast: '#ffffff', kind: 'color', decoration: null, unlockedBy: null },
  { id: 'midnight', name: 'Midnight 🌙', stops: ['#1e293b', '#4f46e5'], contrast: '#ffffff', kind: 'color', decoration: null, unlockedBy: null },
  {
    id: 'doge',
    name: 'Doge 🐕',
    stops: ['#fde68a', '#fbbf24'],
    contrast: '#5b3d00',
    kind: 'effect',
    decoration: 'doge',
    unlockedBy: null
  },
  {
    id: 'sakura',
    name: 'Sakura 🌸',
    stops: ['#fde2ef', '#fbb6d3'],
    contrast: '#7a2350',
    kind: 'effect',
    decoration: 'sakura',
    unlockedBy: null
  },
  {
    id: 'underwater',
    name: 'Underwater 🐠',
    stops: ['#a5f3fc', '#0e7490'],
    contrast: '#ffffff',
    kind: 'effect',
    decoration: 'underwater',
    unlockedBy: null
  },
  {
    id: 'snow',
    name: 'Snow ❄️',
    stops: ['#f0f9ff', '#93c5fd'],
    contrast: '#0c2f52',
    kind: 'effect',
    decoration: 'snow',
    unlockedBy: null
  },
  {
    id: 'summer',
    name: 'Summer 🏖️',
    stops: ['#fef3c7', '#fca5a5'],
    contrast: '#7a2e0e',
    kind: 'effect',
    decoration: 'summer',
    unlockedBy: null
  }
]

export const COLOR_GRADIENTS = GRADIENTS.filter((g) => g.kind === 'color')
export const EFFECT_GRADIENTS = GRADIENTS.filter((g) => g.kind === 'effect')

export function isGradientUnlocked(gradient: Gradient, unlockedAchievementIds: ReadonlySet<string>): boolean {
  return gradient.unlockedBy === null || unlockedAchievementIds.has(gradient.unlockedBy)
}

export const DEFAULT_GRADIENT_ID = 'indigo'

export function getGradient(id: string): Gradient {
  return GRADIENTS.find((gradient) => gradient.id === id) ?? GRADIENTS[0]
}
