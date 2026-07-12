import type { WebContents } from 'electron'

// Lightweight main→renderer push channel. The app is otherwise poll-based, but
// achievement unlocks originate deep in the store layer (store/achievements.ts)
// and need to reach the renderer to trigger the in-app popup. Rather than thread
// BrowserWindow references through every caller, windows register their
// webContents here and any module can broadcast to all of them.
//
// There can be more than one target: the main window and the always-on-top
// timer overlay (which also renders unlock popups so they're visible while the
// app is in the background).
const targets = new Set<WebContents>()

export function setBroadcastTarget(webContents: WebContents): void {
  targets.add(webContents)
  webContents.once('destroyed', () => targets.delete(webContents))
}

export function broadcast(channel: string, ...args: unknown[]): void {
  for (const target of targets) {
    if (target.isDestroyed()) targets.delete(target)
    else target.send(channel, ...args)
  }
}
