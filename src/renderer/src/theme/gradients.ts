// Public API for the rest of the app — the actual theme definitions live one
// file per theme under ./themes/.
import { THEMES } from './themes'

export type { Decoration, DecorationProps, Gradient, GradientKind } from './themes'

export const GRADIENTS = THEMES
export const COLOR_GRADIENTS = GRADIENTS.filter((g) => g.kind === 'color')
export const EFFECT_GRADIENTS = GRADIENTS.filter((g) => g.kind === 'effect')

export const DEFAULT_GRADIENT_ID = 'indigo'

export function getGradient(id: string) {
  return GRADIENTS.find((gradient) => gradient.id === id) ?? GRADIENTS[0]
}

export function isGradientUnlocked(
  gradient: (typeof GRADIENTS)[number],
  unlockedAchievementIds: ReadonlySet<string>
): boolean {
  return gradient.unlockedBy === null || unlockedAchievementIds.has(gradient.unlockedBy)
}
