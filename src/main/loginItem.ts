import { app } from 'electron'

const HIDDEN_ARG = '--hidden'

/** Registers (or unregisters) this app as a login item. Linux has no
 * consistent equivalent across desktop environments, so it's a no-op there. */
export function applyLoginItemSetting(enabled: boolean): void {
  if (process.platform === 'linux') return
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: process.platform === 'darwin' ? enabled : false,
    args: process.platform === 'win32' && enabled ? [HIDDEN_ARG] : []
  })
}

/** Whether this launch was triggered by the login item (not a manual open) —
 * used to start minimized in the tray instead of popping the window. */
export function wasLaunchedHidden(): boolean {
  if (process.platform === 'darwin') return app.getLoginItemSettings().wasOpenedAsHidden
  if (process.platform === 'win32') return process.argv.includes(HIDDEN_ARG)
  return false
}
