import { app, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { setBroadcastTarget } from './broadcast'

let overlayWindow: BrowserWindow | null = null
let ready = false
let enabled = true
// Whether the main app window currently has focus. The overlay is only shown
// when the app is NOT focused (minimized or the user switched to another app).
let mainFocused = true
// The app icon, re-applied whenever we restore the Dock (see ensureDockVisible).
let dockIconPath: string | null = null

const WIDTH = 260
const HEIGHT = 460

// A frameless/transparent + always-visible-on-all-workspaces window makes macOS
// treat the app as an "accessory" and drops its Dock icon. Re-assert the Dock
// (and the regular activation policy) so the main app keeps its Dock/⌘-Tab
// presence — this is the taskbar-disappearing fix.
function ensureDockVisible(): void {
  if (process.platform !== 'darwin' || !app.dock) return
  // Only touch focus/activation policy when the Dock actually got dropped.
  if (!app.dock.isVisible()) {
    app.setActivationPolicy?.('regular')
    void app.dock.show()
  }
  // Re-creating the Dock tile resets it to the default icon, so always reassert
  // the app logo (setIcon is idempotent and never steals focus). Without this
  // the taskbar/Dock shows a blank/default icon instead of the app logo.
  if (dockIconPath) app.dock.setIcon(dockIconPath)
}

function build(): void {
  const work = screen.getPrimaryDisplay().workArea
  ready = false
  overlayWindow = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    x: work.x + work.width - WIDTH,
    y: work.y + work.height - HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  overlayWindow.setIgnoreMouseEvents(true, { forward: true })
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  if (process.platform === 'darwin') {
    // skipTransformProcessType keeps the app a regular (Dock-visible) app.
    // Without it, setVisibleOnAllWorkspaces transforms the process to an
    // accessory, which drops the app's Dock icon and blanks the taskbar logo.
    overlayWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true
    })
    ensureDockVisible() // safety net: reassert the Dock + logo if anything dropped them
  }

  // Also receive main→renderer pushes (achievement-unlock popups) so unlocks
  // are visible on the overlay while the app is in the background.
  setBroadcastTarget(overlayWindow.webContents)

  overlayWindow.on('ready-to-show', () => {
    ready = true
    apply()
  })
  overlayWindow.on('closed', () => {
    overlayWindow = null
    ready = false
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    overlayWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/overlay.html`)
  } else {
    overlayWindow.loadFile(join(__dirname, '../renderer/overlay.html'))
  }

  const reposition = (): void => {
    if (!overlayWindow) return
    const area = screen.getPrimaryDisplay().workArea
    overlayWindow.setBounds({ x: area.x + area.width - WIDTH, y: area.y + area.height - HEIGHT, width: WIDTH, height: HEIGHT })
  }
  screen.on('display-metrics-changed', reposition)
  screen.on('display-added', reposition)
  screen.on('display-removed', reposition)
}

// Reconcile the window's visibility with the current enabled + focus state.
// showInactive() so the overlay never steals focus from whatever the user is in.
function apply(): void {
  if (!enabled) {
    if (overlayWindow?.isVisible()) overlayWindow.hide()
    return
  }
  if (!overlayWindow) {
    build()
    return // ready-to-show will call apply() again
  }
  if (!ready) return
  const shouldShow = !mainFocused
  if (shouldShow && !overlayWindow.isVisible()) overlayWindow.showInactive()
  else if (!shouldShow && overlayWindow.isVisible()) overlayWindow.hide()
}

/** Called once at startup with the persisted setting and the app icon path. */
export function initOverlay(isEnabled: boolean, iconPath: string): void {
  enabled = isEnabled
  dockIconPath = iconPath
  if (enabled) build()
}

/** Settings toggle changed. */
export function setOverlayEnabled(isEnabled: boolean): void {
  if (enabled === isEnabled) return
  enabled = isEnabled
  if (!enabled) {
    destroyOverlayWindow()
    return
  }
  if (!overlayWindow) build()
  else apply()
}

/** Main window gained/lost focus (or was shown/hidden). */
export function setMainFocused(focused: boolean): void {
  mainFocused = focused
  apply()
}

export function destroyOverlayWindow(): void {
  if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.destroy()
  overlayWindow = null
  ready = false
}
