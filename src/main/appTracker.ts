import { randomUUID } from 'crypto'
import { spawn } from 'child_process'
import { platform } from 'process'
import { appendAppUsageSession } from './store/appUsage'

const POLL_INTERVAL_MS = 5000
const MIN_DURATION_MS = 1000
// Bounds crash data loss: a long-running session gets flushed to disk in
// chunks instead of staying in memory until the app switches or quits.
const CHECKPOINT_MS = 60 * 1000

type ActiveApp = { name: string; path: string | null }

let current: ActiveApp | null = null
let currentStart: number | null = null
let intervalHandle: NodeJS.Timeout | null = null

function runCommand(command: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    let output = ''
    let child
    try {
      child = spawn(command, args)
    } catch {
      resolve(null)
      return
    }
    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })
    child.on('error', () => resolve(null))
    child.on('close', (code) => {
      resolve(code === 0 ? output : null)
    })
  })
}

async function getActiveAppMac(): Promise<ActiveApp | null> {
  const script = `
tell application "System Events"
  set p to first application process whose frontmost is true
  set n to name of p
  set f to ""
  try
    set f to POSIX path of (file of p)
  end try
end tell
return n & "\\n" & f
`.trim()
  const output = await runCommand('osascript', ['-e', script])
  if (!output) return null
  const [name, path] = output.split('\n').map((s) => s.trim())
  if (!name) return null
  return { name, path: path || null }
}

const WINDOWS_SCRIPT = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class ShibaTrackerActiveWindow {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint procId);
}
"@
$hwnd = [ShibaTrackerActiveWindow]::GetForegroundWindow()
$procId = 0
[ShibaTrackerActiveWindow]::GetWindowThreadProcessId($hwnd, [ref]$procId) | Out-Null
try {
  $p = Get-Process -Id $procId
  $path = ""
  try { $path = $p.Path } catch {}
  Write-Output "$($p.ProcessName)"
  Write-Output "$path"
} catch { Write-Output "" }
`.trim()

async function getActiveAppWindows(): Promise<ActiveApp | null> {
  const output = await runCommand('powershell', ['-NoProfile', '-NonInteractive', '-Command', WINDOWS_SCRIPT])
  if (!output) return null
  const lines = output.split('\n').map((s) => s.trim())
  const name = lines[0]
  const path = lines[1]
  if (!name) return null
  return { name, path: path || null }
}

function getActiveApp(): Promise<ActiveApp | null> {
  if (platform === 'darwin') return getActiveAppMac()
  if (platform === 'win32') return getActiveAppWindows()
  return Promise.resolve(null)
}

function finalizeCurrentSession(now: number): void {
  if (current === null || currentStart === null) return
  const durationMs = now - currentStart
  if (durationMs >= MIN_DURATION_MS) {
    appendAppUsageSession({
      id: randomUUID(),
      appName: current.name,
      appPath: current.path,
      startedAt: currentStart,
      endedAt: now,
      durationMs
    })
  }
  current = null
  currentStart = null
}

async function poll(): Promise<void> {
  const active = await getActiveApp()
  const now = Date.now()
  if (!active) {
    finalizeCurrentSession(now)
    return
  }
  if (active.name !== current?.name) {
    finalizeCurrentSession(now)
    current = active
    currentStart = now
  } else if (currentStart !== null && now - currentStart >= CHECKPOINT_MS) {
    const stillActive = current
    finalizeCurrentSession(now)
    current = stillActive
    currentStart = now
  }
}

export function startAppTracker(): void {
  if (intervalHandle) return
  intervalHandle = setInterval(() => {
    poll().catch((error) => console.error('App tracker poll failed:', error))
  }, POLL_INTERVAL_MS)
}

export function stopAppTracker(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
  finalizeCurrentSession(Date.now())
}

export function currentAppUsage(): { appName: string; appPath: string | null; startedAt: number } | null {
  if (current === null || currentStart === null) return null
  return { appName: current.name, appPath: current.path, startedAt: currentStart }
}
