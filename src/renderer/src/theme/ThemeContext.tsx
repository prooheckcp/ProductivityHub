import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import type { AppSettings, FontChoice } from '@shared/types'
import { DEFAULT_GRADIENT_ID, getGradient, GRADIENTS, type Gradient } from './gradients'

export const FONT_STACKS: Record<FontChoice, string> = {
  system: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif`,
  serif: `Georgia, 'Times New Roman', Times, serif`,
  rounded: `ui-rounded, 'SF Pro Rounded', 'Segoe UI', system-ui, sans-serif`,
  mono: `ui-monospace, 'SF Mono', 'Cascadia Code', 'Segoe UI Mono', monospace`,
  comic: `'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', cursive`,
  arial: `Arial, 'Helvetica Neue', Helvetica, sans-serif`
}

export const FONT_LABELS: Record<FontChoice, string> = {
  system: 'System default',
  serif: 'Serif',
  rounded: 'Rounded',
  mono: 'Monospace',
  comic: 'Comic Sans',
  arial: 'Arial'
}

const DEFAULT_SETTINGS: AppSettings = {
  backgroundGradient: DEFAULT_GRADIENT_ID,
  font: 'system',
  textColor: null,
  launchAtLogin: false,
  showTimerOverlay: true
}

type ThemeContextValue = {
  settings: AppSettings
  gradients: Gradient[]
  backgroundGradient: Gradient
  loaded: boolean
  unlockedAchievementIds: Set<string>
  setBackgroundGradient: (id: string) => void
  setFont: (font: FontChoice) => void
  setTextColor: (color: string | null) => void
  setLaunchAtLogin: (enabled: boolean) => void
  setShowTimerOverlay: (enabled: boolean) => void
  reloadSettings: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

// Every theme we offer (Indigo, Sakura, Underwater...) is a light, colorful
// look — none of them are a "dark mode". Pinning the chrome to these light
// values regardless of the OS color scheme keeps that promise: the old
// dark-mode `:root` block left --bg/--surface near-black, so any background
// gradient wash still rendered as "dark with a faint tint" no matter which
// theme was picked.
const LIGHT_CHROME = {
  '--border': '#e5e5e8',
  '--text-secondary': '#4b4b54',
  '--text-tertiary': '#75757e',
  '--shadow-sm': '0 1px 2px rgba(15, 15, 20, 0.05)',
  '--shadow-md': '0 6px 20px rgba(15, 15, 20, 0.08)'
}

function applyToDocument(settings: AppSettings): void {
  const root = document.documentElement
  const background = getGradient(settings.backgroundGradient)

  for (const [prop, value] of Object.entries(LIGHT_CHROME)) {
    root.style.setProperty(prop, value)
  }

  // Buttons/accents take their color straight from the selected background
  // theme — no separate "button color" choice to keep in sync with it.
  root.style.setProperty('--accent', background.stops[0])
  root.style.setProperty('--accent-2', background.stops[1])
  root.style.setProperty(
    '--accent-gradient',
    `linear-gradient(135deg, ${background.stops[0]}, ${background.stops[1]})`
  )
  root.style.setProperty('--accent-contrast', background.contrast)

  // The page background IS the theme's own gradient (or, for scenes like
  // Summer's sky/ocean/sand, its own hand-authored backgroundCss) — no
  // dark/white overlay diluting it, so what you pick in Settings is what you
  // actually see. The sidebar reuses the same background and gets a dark
  // scrim layered on top (see Sidebar.css) so its fixed light nav text stays
  // readable no matter how pale the theme is.
  const gradientCss = background.backgroundCss ?? `linear-gradient(135deg, ${background.stops[0]}, ${background.stops[1]})`
  // A very slight (8%) darkening so cards — which got noticeably more
  // colorful — still read as sitting on top of the background instead of
  // blending into it. The sidebar keeps the undarkened gradient; it already
  // layers its own separate scrim on top for nav-text contrast.
  root.style.setProperty('--bg-gradient', `linear-gradient(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.08)), ${gradientCss}`)
  root.style.setProperty('--bg', `color-mix(in srgb, ${background.stops[1]} 92%, black)`)
  root.style.setProperty('--sidebar-bg', gradientCss)

  // Cards stay light (so text inside them can stay a fixed dark color), but
  // are tinted per-theme instead of flat white — `cardTint` is hand-picked
  // per theme file to actually match its personality rather than a generic
  // formula. Hover/active/sunken states are derived from it.
  root.style.setProperty('--surface', background.cardTint)
  root.style.setProperty('--surface-sunken', `color-mix(in srgb, ${background.cardTint} 97%, black)`)
  root.style.setProperty('--surface-hover', `color-mix(in srgb, ${background.cardTint} 94%, black)`)
  root.style.setProperty('--surface-active', `color-mix(in srgb, ${background.cardTint} 90%, black)`)

  root.style.setProperty('--font-family', FONT_STACKS[settings.font])

  root.style.setProperty('--text-primary', settings.textColor ?? '#17171a')
  // For the few spots that render straight on the themed background instead
  // of a card — page titles, the sidebar — dark text can disappear on a dark
  // theme like Midnight. `background.contrast` is authored per-theme
  // specifically to read well against its own stops.
  root.style.setProperty('--on-bg-text', settings.textColor ?? background.contrast)
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<Set<string>>(new Set())

  function load(): void {
    window.api.settings.get().then((loadedSettings) => {
      setSettings(loadedSettings)
      setLoaded(true)
    })
  }

  useEffect(load, [])

  // After a login switches the active data dir in-place (no full reload), the
  // account's theme lives in a different settings file — re-read it.
  useEffect(() => {
    const onReloaded = (): void => {
      load()
      window.api.achievements.get().then((progress) => {
        setUnlockedAchievementIds(new Set(Object.keys(progress.unlocked)))
      })
    }
    window.addEventListener('app:data-reloaded', onReloaded)
    return () => window.removeEventListener('app:data-reloaded', onReloaded)
  }, [])

  useEffect(() => {
    window.api.achievements.get().then((progress) => {
      setUnlockedAchievementIds(new Set(Object.keys(progress.unlocked)))
    })
  }, [])

  useEffect(() => {
    applyToDocument(settings)
  }, [settings])

  async function updateSetting(patch: Partial<AppSettings>): Promise<void> {
    const updated = await window.api.settings.update(patch)
    setSettings(updated)
  }

  const value = useMemo<ThemeContextValue>(
    () => ({
      settings,
      gradients: GRADIENTS,
      backgroundGradient: getGradient(settings.backgroundGradient),
      loaded,
      unlockedAchievementIds,
      setBackgroundGradient: (id) => updateSetting({ backgroundGradient: id }),
      setFont: (font) => updateSetting({ font }),
      setTextColor: (color) => updateSetting({ textColor: color }),
      setLaunchAtLogin: (enabled) => updateSetting({ launchAtLogin: enabled }),
      setShowTimerOverlay: (enabled) => updateSetting({ showTimerOverlay: enabled }),
      reloadSettings: load
    }),
    [settings, loaded, unlockedAchievementIds]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
