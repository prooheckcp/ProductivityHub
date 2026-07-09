import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import type { AppSettings, FontChoice } from '@shared/types'
import { DEFAULT_GRADIENT_ID, getGradient, GRADIENTS, type Gradient } from './gradients'

export const FONT_STACKS: Record<FontChoice, string> = {
  system: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif`,
  serif: `Georgia, 'Times New Roman', Times, serif`,
  rounded: `ui-rounded, 'SF Pro Rounded', 'Segoe UI', system-ui, sans-serif`,
  mono: `ui-monospace, 'SF Mono', 'Cascadia Code', 'Segoe UI Mono', monospace`
}

export const FONT_LABELS: Record<FontChoice, string> = {
  system: 'System default',
  serif: 'Serif',
  rounded: 'Rounded',
  mono: 'Monospace'
}

const DEFAULT_SETTINGS: AppSettings = {
  backgroundGradient: DEFAULT_GRADIENT_ID,
  buttonGradient: DEFAULT_GRADIENT_ID,
  font: 'system'
}

type ThemeContextValue = {
  settings: AppSettings
  gradients: Gradient[]
  backgroundGradient: Gradient
  buttonGradient: Gradient
  loaded: boolean
  setBackgroundGradient: (id: string) => void
  setButtonGradient: (id: string) => void
  setFont: (font: FontChoice) => void
  reloadSettings: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyToDocument(settings: AppSettings): void {
  const root = document.documentElement
  const button = getGradient(settings.buttonGradient)
  const background = getGradient(settings.backgroundGradient)

  root.style.setProperty('--accent', button.stops[0])
  root.style.setProperty('--accent-2', button.stops[1])
  root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${button.stops[0]}, ${button.stops[1]})`)
  root.style.setProperty('--accent-contrast', button.contrast)

  root.style.setProperty(
    '--bg-gradient',
    `linear-gradient(160deg, ${background.stops[0]}22, ${background.stops[1]}11)`
  )
  root.style.setProperty('--font-family', FONT_STACKS[settings.font])
  root.setAttribute('data-decoration', background.decoration ?? 'none')
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)

  function load(): void {
    window.api.settings.get().then((loadedSettings) => {
      setSettings(loadedSettings)
      setLoaded(true)
    })
  }

  useEffect(load, [])

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
      buttonGradient: getGradient(settings.buttonGradient),
      loaded,
      setBackgroundGradient: (id) => updateSetting({ backgroundGradient: id }),
      setButtonGradient: (id) => updateSetting({ buttonGradient: id }),
      setFont: (font) => updateSetting({ font }),
      reloadSettings: load
    }),
    [settings, loaded]
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
