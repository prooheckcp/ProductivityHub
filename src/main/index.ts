import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc'
import { startAppTracker, stopAppTracker } from './appTracker'
import { startDeadlineNotifier, stopDeadlineNotifier } from './deadlineNotifier'
import { startTimerTaskWatcher, stopTimerTaskWatcher } from './timerTaskWatcher'
import { applyLoginItemSetting, wasLaunchedHidden } from './loginItem'
import { createTray } from './tray'
import { getSettings } from './store/settings'

const APP_NAME = 'Shiba Track'

// Electron derives the default userData path from app.getName(), so renaming
// the app would otherwise fork all user data (timers, tasks, stats, etc.) into
// a brand-new folder. Pin it to the original folder name before changing the
// name, so existing installs keep reading/writing the same data — but only
// when the path wasn't already explicitly overridden (e.g. --user-data-dir,
// used to run an isolated instance for testing), or that override would be
// silently ignored and tests would hit the real user data folder instead.
if (!app.commandLine.hasSwitch('user-data-dir')) {
  app.setPath('userData', join(app.getPath('appData'), 'productivityhub'))
}

// Set the app name before whenReady so the macOS menu bar and notifications use
// it instead of the default "Electron" (productName in electron-builder only
// applies to packaged builds — this is what fixes the name while running/dev).
app.setName(APP_NAME)

const iconPath = app.isPackaged
  ? join(process.resourcesPath, 'icon.png')
  : join(__dirname, '../../resources/icon.png')

let mainWindow: BrowserWindow | null = null
let isQuitting = false

function createWindow(showImmediately: boolean): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 860,
    minHeight: 560,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    title: APP_NAME,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    if (showImmediately) mainWindow?.show()
  })

  // The app keeps running in the background (tracking other apps' usage) once
  // the window is closed — so a click on the close button hides it instead of
  // destroying it. Chromium automatically throttles/stops compositing hidden
  // windows, so this is much lighter than a visible-but-idle window. The only
  // way to actually quit is the tray menu (or the OS quit shortcut), which set
  // `isQuitting` first via the 'before-quit' handler below.
  mainWindow.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function showMainWindow(): void {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
  } else {
    createWindow(true)
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.shibatracker.app')

  // In dev the process runs under the stock Electron binary, so the dock shows
  // Electron's default icon. Packaged builds get the icon from electron-builder,
  // but setting it here makes dev match too.
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(iconPath)
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  startAppTracker()
  startDeadlineNotifier()
  startTimerTaskWatcher()
  applyLoginItemSetting(getSettings().launchAtLogin)
  createTray(iconPath, showMainWindow)

  createWindow(!wasLaunchedHidden())

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(true)
    else showMainWindow()
  })
})

app.on('before-quit', () => {
  isQuitting = true
  stopAppTracker()
  stopDeadlineNotifier()
  stopTimerTaskWatcher()
})
