import type { JSX } from 'react'

export type Decoration = 'doge' | 'sakura' | 'underwater' | 'snow' | 'summer' | 'hacker' | 'forest' | null

export type GradientKind = 'color' | 'effect'

export type DecorationProps = {
  /** The theme's own contrast color — picked per-theme to read clearly against its stops. */
  tint: string
}

export type Gradient = {
  id: string
  name: string
  /** Gradient stops, applied light-to-dark / start-to-end. Also used for the swatch preview. */
  stops: [string, string]
  /** Text/icon color that reads well directly on top of the gradient. */
  contrast: string
  kind: GradientKind
  decoration: Decoration
  /** Achievement id required to select this theme, or null if it's free. */
  unlockedBy: string | null
  /**
   * Full CSS `background` value to use instead of the generic
   * `linear-gradient(135deg, stops[0], stops[1])` — for scenes that need more
   * than a two-stop diagonal (e.g. Summer's sky/ocean/sand bands).
   */
  backgroundCss?: string
  /** Light, theme-matched card surface color — cards stay light/readable, just tinted per theme. */
  cardTint: string
  /** Animated overlay rendered behind page content, for "effect" themes only. */
  Decoration?: (props: DecorationProps) => JSX.Element | null
}
