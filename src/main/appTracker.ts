import { randomUUID } from 'crypto'
import { spawn } from 'child_process'
import { platform } from 'process'
import { appendAppUsageSession } from './store/appUsage'

const POLL_INTERVAL_MS = 5000
const MIN_DURATION_MS = 1000

let currentApp: string | null = null
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
      resolve(code === 0 ? output.trim() || null : null)
    })
  })
}

function getActiveAppNameMac(): Promise<string | null> {
  const script =
    'tell application "System Events" to get name of first application process whose frontmost is true'
  return runCommand('osascript', ['-e', script])
}

const WINDOWS_SCRIPT = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class ProductivityHubActiveWindow {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint procId);
}
"@
$hwnd = [ProductivityHubActiveWindow]::GetForegroundWindow()
$procId = 0
[ProductivityHubActiveWindow]::GetWindowThreadProcessId($hwnd, [ref]$procId) | Out-Null
try { (Get-Process -Id $procId).ProcessName } catch { "" }
`.trim()

function getActiveAppNameWindows(): Promise<string | null> {
  return runCommand('powershell', ['-NoProfile', '-NonInteractive', '-Command', WINDOWS_SCRIPT])
}

function getActiveAppName(): Promise<string | null> {
  if (platform === 'darwin') return getActiveAppNameMac()
  if (platform === 'win32') return getActiveAppNameWindows()
  return Promise.resolve(null)
}

function finalizeCurrentSession(now: number): void {
  if (currentApp === null || currentStart === null) return
  const durationMs = now - currentStart
  if (durationMs >= MIN_DURATION_MS) {
    appendAppUsageSession({
      id: randomUUID(),
      appName: currentApp,
      startedAt: currentStart,
      endedAt: now,
      durationMs
    })
  }
  currentApp = null
  currentStart = null
}

async function poll(): Promise<void> {
  const name = await getActiveAppName()
  const now = Date.now()
  if (!name) {
    finalizeCurrentSession(now)
    return
  }
  if (name !== currentApp) {
    finalizeCurrentSession(now)
    currentApp = name
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

export function currentAppUsage(): { appName: string; startedAt: number } | null {
  if (currentApp === null || currentStart === null) return null
  return { appName: currentApp, startedAt: currentStart }
}
