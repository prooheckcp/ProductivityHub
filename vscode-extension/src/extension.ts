import * as http from 'http'
import * as vscode from 'vscode'

const DEFAULT_PORT = 51820
// Sent immediately on a file switch, but throttled while continuously typing
// in the same file — the app-side idle timeout (5 minutes of no heartbeats)
// is what actually decides when a coding session ends, so this just needs to
// be frequent enough to keep a session "alive" without spamming a request per
// keystroke.
const HEARTBEAT_THROTTLE_MS = 30_000
// How often the status bar re-fetches the last-24h total. Independent of the
// heartbeat throttle above — this just needs to feel live, not track typing.
const STATUS_POLL_MS = 15_000

let statusBarItem: vscode.StatusBarItem
let statusPollHandle: ReturnType<typeof setInterval> | undefined
let lastSentAt = 0
let lastFilePath: string | null = null
let lastHeartbeatOk = false
let lastKnownTotalMs: number | null = null

function config(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration('shibaTrack')
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return '<1m'
}

function updateStatusBar(): void {
  if (lastKnownTotalMs !== null) {
    statusBarItem.text = `🐕 $(clock) ${formatDuration(lastKnownTotalMs)}`
    statusBarItem.tooltip = lastHeartbeatOk
      ? `Shiba Track: ${formatDuration(lastKnownTotalMs)} coded in the last 24 hours`
      : "Shiba Track: showing the last known total — the desktop app isn't reachable right now"
    return
  }
  statusBarItem.text = lastHeartbeatOk ? '$(check) Shiba Track' : '$(circle-slash) Shiba Track'
  statusBarItem.tooltip = lastHeartbeatOk
    ? 'Connected to Shiba Track — tracking coding time'
    : "Shiba Track desktop app not reachable — make sure it's running"
}

function fetchLast24hTotal(): void {
  if (!config().get<boolean>('enabled', true)) return

  const req = http.request(
    {
      hostname: '127.0.0.1',
      port: config().get<number>('port', DEFAULT_PORT),
      path: '/stats/last24h',
      method: 'GET',
      timeout: 3000
    },
    (res) => {
      let body = ''
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body) as { totalMs: number }
          lastHeartbeatOk = (res.statusCode ?? 500) < 400
          lastKnownTotalMs = parsed.totalMs
        } catch {
          lastHeartbeatOk = false
        }
        updateStatusBar()
      })
    }
  )
  req.on('error', () => {
    lastHeartbeatOk = false
    updateStatusBar()
  })
  req.on('timeout', () => req.destroy())
  req.end()
}

function sendHeartbeat(document: vscode.TextDocument): void {
  if (!config().get<boolean>('enabled', true)) return
  // Real on-disk files only — skips untitled buffers, output panels, diff
  // views, the SCM commit-message box, settings UI, etc.
  if (document.uri.scheme !== 'file') return

  const now = Date.now()
  const sameFile = document.uri.fsPath === lastFilePath
  if (sameFile && now - lastSentAt < HEARTBEAT_THROTTLE_MS) return

  lastSentAt = now
  lastFilePath = document.uri.fsPath

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
  const payload = JSON.stringify({
    filePath: document.uri.fsPath,
    fileName: document.fileName.split(/[\\/]/).pop() ?? document.fileName,
    projectName: workspaceFolder?.name ?? null,
    language: document.languageId
  })

  const req = http.request(
    {
      hostname: '127.0.0.1',
      port: config().get<number>('port', DEFAULT_PORT),
      path: '/heartbeat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 3000
    },
    (res) => {
      lastHeartbeatOk = (res.statusCode ?? 500) < 400
      updateStatusBar()
      res.resume()
    }
  )
  req.on('error', () => {
    lastHeartbeatOk = false
    updateStatusBar()
  })
  req.on('timeout', () => req.destroy())
  req.write(payload)
  req.end()
}

export function activate(context: vscode.ExtensionContext): void {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  updateStatusBar()
  statusBarItem.show()

  fetchLast24hTotal()
  statusPollHandle = setInterval(fetchLast24hTotal, STATUS_POLL_MS)

  context.subscriptions.push(
    statusBarItem,
    { dispose: () => clearInterval(statusPollHandle) },
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.contentChanges.length === 0) return
      sendHeartbeat(event.document)
    })
  )
}

export function deactivate(): void {
  clearInterval(statusPollHandle)
}
