import type { JSX } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { CheckIcon } from '../components/icons'
import { useTheme } from '../theme/ThemeContext'
import './Settings.css'

export default function Settings(): JSX.Element {
  const { themes, themeId, setThemeId } = useTheme()

  return (
    <>
      <PageHeader title="Settings" subtitle="Personalize the look of your workspace." />

      <Card>
        <h2 className="settings__section-title">Theme</h2>
        <p className="settings__section-description">
          Pick an accent gradient. It's used for buttons, highlights, and the sidebar mark
          throughout the app.
        </p>

        <div className="theme-grid">
          {themes.map((theme) => {
            const isActive = theme.id === themeId
            return (
              <button
                key={theme.id}
                type="button"
                className={'theme-swatch' + (isActive ? ' theme-swatch--active' : '')}
                style={{
                  background: `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`
                }}
                onClick={() => setThemeId(theme.id)}
                aria-pressed={isActive}
              >
                {isActive && (
                  <span className="theme-swatch__check">
                    <CheckIcon size={13} />
                  </span>
                )}
                <span className="theme-swatch__label">{theme.name}</span>
              </button>
            )
          })}
        </div>
      </Card>
    </>
  )
}
