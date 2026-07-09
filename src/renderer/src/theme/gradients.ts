export type Decoration = 'doge' | 'sakura' | null

export type Gradient = {
  id: string
  name: string
  /** Gradient stops, applied light-to-dark / start-to-end. */
  stops: [string, string]
  /** Text color that reads well directly on top of the gradient. */
  contrast: string
  decoration: Decoration
}

// The single source of truth for available gradients. Add one by appending an
// entry here — it becomes selectable for both Background and Button slots in
// Settings, nothing else needs to change.
export const GRADIENTS: Gradient[] = [
  { id: 'indigo', name: 'Indigo', stops: ['#6366f1', '#8b5cf6'], contrast: '#ffffff', decoration: null },
  { id: 'ocean', name: 'Ocean', stops: ['#06b6d4', '#3b82f6'], contrast: '#ffffff', decoration: null },
  { id: 'sunset', name: 'Sunset', stops: ['#f97316', '#ec4899'], contrast: '#ffffff', decoration: null },
  { id: 'forest', name: 'Forest', stops: ['#22c55e', '#0ea5e9'], contrast: '#ffffff', decoration: null },
  { id: 'grape', name: 'Grape', stops: ['#a855f7', '#6366f1'], contrast: '#ffffff', decoration: null },
  { id: 'rose', name: 'Rose', stops: ['#f43f5e', '#f97316'], contrast: '#ffffff', decoration: null },
  { id: 'gold', name: 'Gold', stops: ['#f59e0b', '#ef4444'], contrast: '#ffffff', decoration: null },
  { id: 'midnight', name: 'Midnight', stops: ['#1e293b', '#4f46e5'], contrast: '#ffffff', decoration: null },
  { id: 'doge', name: 'Doge', stops: ['#fbbf24', '#f59e0b'], contrast: '#3f2d00', decoration: 'doge' },
  { id: 'sakura', name: 'Sakura', stops: ['#fbcfe8', '#f472b6'], contrast: '#5b1a3d', decoration: 'sakura' }
]

export const DEFAULT_GRADIENT_ID = 'indigo'

export function getGradient(id: string): Gradient {
  return GRADIENTS.find((gradient) => gradient.id === id) ?? GRADIENTS[0]
}
