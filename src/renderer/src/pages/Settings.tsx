import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import { useTheme, FONT_LABELS, FONT_STACKS } from '../theme/ThemeContext'
import { COLOR_GRADIENTS, EFFECT_GRADIENTS } from '../theme/gradients'
import type { CodeTrackerStatus, FontChoice } from '@shared/types'
import { CODE_TRACKER_CONNECTED_WINDOW_MS, CODE_TRACKER_MARKETPLACE_URL } from '@shared/codeTrackerConfig'
import GradientPicker from '../features/settings/GradientPicker'
import AccountSettings from '../features/settings/AccountSettings'
import shibaArtist from '../assets/shiba-artist.png'
import extensionIcon from '../assets/vscode-extension-icon.png'
import './Settings.css'

const FONT_CHOICES: FontChoice[] = ['system', 'serif', 'rounded', 'mono', 'comic', 'arial']
const STATUS_POLL_MS = 4000

export default function Settings(): JSX.Element {
  const { settings, setBackgroundGradient, setFont, setTextColor, setLaunchAtLogin, setShowTimerOverlay } =
    useTheme()
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [confirmingImport, setConfirmingImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [codeStatus, setCodeStatus] = useState<CodeTrackerStatus | null>(null)
  const [confirmingCodeReset, setConfirmingCodeReset] = useState(false)
  const [codeResetStatus, setCodeResetStatus] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    function poll(): void {
      window.api.code.getStatus().then((status) => {
        if (!cancelled) setCodeStatus(status)
      })
    }
    poll()
    const interval = setInterval(poll, STATUS_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  async function handleExport(): Promise<void> {
    const result = await window.api.data.export()
    setExportStatus(result.canceled ? null : `Exported to ${result.path}`)
  }

  const codeRecentlyConnected =
    codeStatus !== null &&
    codeStatus.lastHeartbeatAt !== null &&
    Date.now() - codeStatus.lastHeartbeatAt < CODE_TRACKER_CONNECTED_WINDOW_MS

  async function handleCodeResetConfirmed(): Promise<void> {
    setConfirmingCodeReset(false)
    await window.api.code.resetStats()
    setCodeResetStatus('Code stats cleared')
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

      <AccountSettings />

      <Card className="settings__card settings__card--appearance">
        <img className="settings__appearance-art" src={shibaArtist} alt="" />
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

        <p className="settings__label">Font</p>
        <div className="font-picker">
          {FONT_CHOICES.map((font) => (
            <button
              key={font}
              type="button"
              className={'font-picker__option' + (settings.font === font ? ' font-picker__option--active' : '')}
              style={{ fontFamily: FONT_STACKS[font] }}
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
        <h2 className="settings__section-title">Startup</h2>
        <p className="settings__section-description">
          When on, Shiba Track launches automatically when you log in and keeps tracking your app
          usage in the background — closing the window just hides it to the system tray/menu bar
          instead of quitting. Use the tray icon's "Quit" to actually exit.
        </p>
        <button
          type="button"
          className={'settings__toggle-row' + (settings.launchAtLogin ? ' settings__toggle-row--on' : '')}
          onClick={() => setLaunchAtLogin(!settings.launchAtLogin)}
          aria-pressed={settings.launchAtLogin}
        >
          <span className="settings__toggle-label">Launch at login</span>
          <span className="settings__toggle-switch">
            <span className="settings__toggle-knob" />
          </span>
        </button>
      </Card>

      <Card className="settings__card">
        <h2 className="settings__section-title">Floating timer overlay</h2>
        <p className="settings__section-description">
          Shows a small, translucent card in the bottom-right corner of your screen for any running
          timer (from Time Tracker and from Alarms &amp; Timers), so you can keep an eye on them —
          and pause them — while you're working in another app. It only appears when Shiba Track
          isn't the focused window, and stays click-through except over its buttons.
        </p>
        <button
          type="button"
          className={'settings__toggle-row' + (settings.showTimerOverlay ? ' settings__toggle-row--on' : '')}
          onClick={() => setShowTimerOverlay(!settings.showTimerOverlay)}
          aria-pressed={settings.showTimerOverlay}
        >
          <span className="settings__toggle-label">Show floating timer overlay</span>
          <span className="settings__toggle-switch">
            <span className="settings__toggle-knob" />
          </span>
        </button>
      </Card>

      <Card className="settings__card">
        <h2 className="settings__section-title">Coding tracker</h2>
        <p className="settings__section-description">
          Install the Shiba Track VS Code extension to track how long you spend coding, per project,
          file, and language — see it under Stats → Code. It only counts time you're actively typing.
        </p>
        {codeStatus && (
          <div
            className={'settings__toggle-row' + (codeRecentlyConnected ? ' settings__toggle-row--on' : '')}
            style={{ cursor: 'default' }}
          >
            <span className="settings__toggle-label">
              {codeStatus.lastHeartbeatAt === null
                ? `Listening on port ${codeStatus.port} — no connection from the extension yet`
                : codeRecentlyConnected
                  ? `Connected — currently tracking ${codeStatus.current?.fileName ?? 'idle'}`
                  : `Listening on port ${codeStatus.port} — last seen ${new Date(codeStatus.lastHeartbeatAt).toLocaleTimeString()}`}
            </span>
            <span className="settings__toggle-switch">
              <span className="settings__toggle-knob" />
            </span>
          </div>
        )}
        {!codeRecentlyConnected && (
          <div className="settings__extension-prompt">
            <img src={extensionIcon} alt="" className="settings__extension-prompt-icon" />
            <div>
              <p className="settings__extension-prompt-text">Don't have it yet?</p>
              <a
                href={CODE_TRACKER_MARKETPLACE_URL}
                target="_blank"
                rel="noreferrer"
                className="settings__extension-button"
              >
                Get the extension
              </a>
            </div>
          </div>
        )}
        <div className="settings__data-actions">
          <Button variant="secondary" onClick={() => setConfirmingCodeReset(true)}>
            Reset code stats
          </Button>
        </div>
        {codeResetStatus && <p className="settings__status">{codeResetStatus}</p>}
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

      {confirmingCodeReset && (
        <ConfirmDialog
          title="Reset code stats?"
          description="This clears all recorded coding time, per-language/project/file breakdowns, and coding achievement progress. This can't be undone."
          confirmLabel="Reset"
          onConfirm={handleCodeResetConfirmed}
          onCancel={() => setConfirmingCodeReset(false)}
        />
      )}

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
