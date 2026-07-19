import { app, type BrowserWindow } from 'electron'
import { resolve } from 'path'
import { broadcast } from './broadcast'

export const AUTH_PROTOCOL = 'shibatrack'

let getMainWindow: () => BrowserWindow | null = () => null

// Forward an incoming `shibatrack://...` deep link (the OAuth callback) to the
// renderer, which exchanges the code for a session. Focuses the main window so
// the user lands back in the app after authorizing in their browser.
export function handleDeepLinkUrl(url: string): void {
  if (!url || !url.startsWith(`${AUTH_PROTOCOL}://`)) return
  const win = getMainWindow()
  if (win) {
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }
  broadcast('auth:deep-link', url)
}

// Register the custom protocol and the macOS `open-url` handler. On Windows/Linux
// the callback arrives as a `second-instance` argv (wired in index.ts).
export function registerAuthProtocol(mainWindowGetter: () => BrowserWindow | null): void {
  getMainWindow = mainWindowGetter

  if (process.defaultApp) {
    // Dev: the app runs under the Electron binary with a script path arg, so the
    // OS needs both to relaunch us for the protocol.
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(AUTH_PROTOCOL, process.execPath, [resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient(AUTH_PROTOCOL)
  }

  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleDeepLinkUrl(url)
  })
}
