import type { WebContents } from 'electron'

// Lightweight main→renderer push channel. The app is otherwise poll-based, but
// achievement unlocks originate deep in the store layer (store/achievements.ts)
// and need to reach the renderer to trigger the in-app popup. Rather than thread
// the BrowserWindow reference through every caller, index.ts registers the main
// window's webContents here once, and any module can broadcast to it.
let target: WebContents | null = null

export function setBroadcastTarget(webContents: WebContents): void {
  target = webContents
}

export function broadcast(channel: string, ...args: unknown[]): void {
  if (target && !target.isDestroyed()) {
    target.send(channel, ...args)
  }
}
