import { useState } from 'react'
import type { JSX } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import { useTheme, FONT_LABELS } from '../theme/ThemeContext'
import { COLOR_GRADIENTS, EFFECT_GRADIENTS } from '../theme/gradients'
import type { FontChoice } from '@shared/types'
import GradientPicker from '../features/settings/GradientPicker'
import './Settings.css'

const FONT_CHOICES: FontChoice[] = ['system', 'serif', 'rounded', 'mono', 'comic', 'arial']

export default function Settings(): JSX.Element {
  const { settings, setBackgroundGradient, setButtonGradient, setFont, setTextColor } = useTheme()
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [confirmingImport, setConfirmingImport] = useState(false)
  const [importing, setImporting] = useState(false)

  async function handleExport(): Promise<void> {
    const result = await window.api.data.export()
    setExportStatus(result.canceled ? null : `Exported to ${result.path}`)
  }

  async function handleImportConfirmed(): Promise<void> {
    setConfirmingImport(false)
    setImporting(true)
    const result = await window.api.data.import()
    if (result.canceled) {
      setImporting(false)
      return
    }
    window.location.reload()
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Personalize the look of your workspace." />

      <Card className="settings__card">
        <h2 className="settings__section-title">Appearance</h2>
        <p className="settings__section-description">
          The background theme is applied directly — no dimming or dark overlay — so what you
          see below is what your workspace will look like.
        </p>

        <GradientPicker
          label="Background — static colors"
          value={settings.backgroundGradient}
          onChange={setBackgroundGradient}
          options={COLOR_GRADIENTS}
        />
        <GradientPicker
          label="Background — animated themes"
          value={settings.backgroundGradient}
          onChange={setBackgroundGradient}
          options={EFFECT_GRADIENTS}
        />
        <GradientPicker
          label="Button color"
          value={settings.buttonGradient}
          onChange={setButtonGradient}
          options={COLOR_GRADIENTS}
        />

        <p className="settings__label">Font</p>
        <div className="font-picker">
          {FONT_CHOICES.map((font) => (
            <button
              key={font}
              type="button"
              className={'font-picker__option' + (settings.font === font ? ' font-picker__option--active' : '')}
              onClick={() => setFont(font)}
            >
              {FONT_LABELS[font]}
            </button>
          ))}
        </div>

        <p className="settings__label">Text color</p>
        <div className="text-color-picker">
          <input
            type="color"
            className="text-color-picker__swatch"
            value={settings.textColor ?? '#17171a'}
            onChange={(event) => setTextColor(event.target.value)}
            aria-label="Text color"
          />
          <span className="text-color-picker__hint">
            {settings.textColor ? settings.textColor : 'Using theme default'}
          </span>
          {settings.textColor && (
            <Button variant="ghost" onClick={() => setTextColor(null)}>
              Reset
            </Button>
          )}
        </div>
      </Card>

      <Card className="settings__card">
        <h2 className="settings__section-title">Data</h2>
        <p className="settings__section-description">
          Export everything (timers, to-dos, stats, achievements, settings) to a JSON file you can
          move to another computer. Importing replaces all local data with the file's contents.
        </p>
        <div className="settings__data-actions">
          <Button variant="secondary" onClick={handleExport}>
            Export data
          </Button>
          <Button variant="secondary" onClick={() => setConfirmingImport(true)} disabled={importing}>
            {importing ? 'Importing…' : 'Import data'}
          </Button>
        </div>
        {exportStatus && <p className="settings__status">{exportStatus}</p>}
      </Card>

      {confirmingImport && (
        <ConfirmDialog
          title="Import data?"
          description="This overwrites all timers, to-dos, stats, and achievements currently on this computer with the contents of the file you pick. This can't be undone."
          confirmLabel="Choose file & import"
          onConfirm={handleImportConfirmed}
          onCancel={() => setConfirmingImport(false)}
        />
      )}
    </>
  )
}
