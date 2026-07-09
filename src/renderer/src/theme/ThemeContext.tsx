import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import { DEFAULT_THEME_ID, getTheme, THEMES, type Theme } from './themes'

const STORAGE_KEY = 'productivityhub:theme'

type ThemeContextValue = {
  theme: Theme
  themeId: string
  themes: Theme[]
  setThemeId: (id: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyThemeToDocument(theme: Theme): void {
  const root = document.documentElement
  root.style.setProperty('--accent', theme.gradient[0])
  root.style.setProperty('--accent-2', theme.gradient[1])
  root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`)
  root.style.setProperty('--accent-contrast', theme.contrast)
  root.setAttribute('data-theme-id', theme.id)
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_THEME_ID
  })

  const theme = useMemo(() => getTheme(themeId), [themeId])

  useEffect(() => {
    applyThemeToDocument(theme)
    localStorage.setItem(STORAGE_KEY, theme.id)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, themeId: theme.id, themes: THEMES, setThemeId }),
    [theme]
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
