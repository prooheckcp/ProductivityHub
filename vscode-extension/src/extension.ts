import * as http from 'http'
import * as vscode from 'vscode'

const DEFAULT_PORT = 51820
// Sent immediately on a file switch, but throttled while continuously typing
// in the same file — the app-side idle timeout (5 minutes of no heartbeats)
// is what actually decides when a coding session ends, so this just needs to
// be frequent enough to keep a session "alive" without spamming a request per
// keystroke.
const HEARTBEAT_THROTTLE_MS = 30_000

let statusBarItem: vscode.StatusBarItem
let lastSentAt = 0
let lastFilePath: string | null = null
let lastHeartbeatOk = false

function config(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration('shibaTrack')
}

function updateStatusBar(): void {
  statusBarItem.text = lastHeartbeatOk ? '$(check) Shiba Track' : '$(circle-slash) Shiba Track'
  statusBarItem.tooltip = lastHeartbeatOk
    ? 'Connected to Shiba Track — tracking coding time'
    : "Shiba Track desktop app not reachable — make sure it's running"
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

  context.subscriptions.push(
    statusBarItem,
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.contentChanges.length === 0) return
      sendHeartbeat(event.document)
    })
  )
}

export function deactivate(): void {}
