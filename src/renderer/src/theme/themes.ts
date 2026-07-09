export type Theme = {
  id: string
  name: string
  /** Gradient stops, applied light-to-dark / start-to-end. */
  gradient: [string, string]
  /** Text color that reads well directly on top of the gradient. */
  contrast: string
}

// The single source of truth for available themes. Add a new theme by
// appending an entry here — nothing else needs to change to make it
// selectable in Settings and applied across the app.
export const THEMES: Theme[] = [
  { id: 'indigo', name: 'Indigo', gradient: ['#6366f1', '#8b5cf6'], contrast: '#ffffff' },
  { id: 'ocean', name: 'Ocean', gradient: ['#06b6d4', '#3b82f6'], contrast: '#ffffff' },
  { id: 'sunset', name: 'Sunset', gradient: ['#f97316', '#ec4899'], contrast: '#ffffff' },
  { id: 'forest', name: 'Forest', gradient: ['#22c55e', '#0ea5e9'], contrast: '#ffffff' },
  { id: 'grape', name: 'Grape', gradient: ['#a855f7', '#6366f1'], contrast: '#ffffff' },
  { id: 'rose', name: 'Rose', gradient: ['#f43f5e', '#f97316'], contrast: '#ffffff' },
  { id: 'gold', name: 'Gold', gradient: ['#f59e0b', '#ef4444'], contrast: '#ffffff' },
  { id: 'midnight', name: 'Midnight', gradient: ['#1e293b', '#4f46e5'], contrast: '#ffffff' }
]

export const DEFAULT_THEME_ID = THEMES[0].id

export function getTheme(id: string): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0]
}
