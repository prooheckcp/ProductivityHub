import { randomUUID } from 'crypto'
import { createServer } from 'http'
import type { IncomingMessage, Server, ServerResponse } from 'http'
import { DEFAULT_CODE_TRACKER_PORT } from '../shared/codeTrackerConfig'
import type { CodeTrackerStatus } from '../shared/types'
import { appendCodingSession } from './store/codeSessions'

// A file only keeps "accumulating time" while heartbeats keep arriving from
// the VS Code extension (which only sends one while the user is actively
// typing) — once they stop for this long, the session is closed even though
// the file may still be open on screen.
const IDLE_TIMEOUT_MS = 5 * 60 * 1000
// Bounds crash data loss for one long continuous typing streak, same reasoning
// as appTracker's CHECKPOINT_MS.
const CHECKPOINT_MS = 60 * 1000
const SWEEP_INTERVAL_MS = 30 * 1000

type HeartbeatPayload = {
  filePath: string
  fileName: string
  projectName: string | null
  language: string
}

type ActiveSession = HeartbeatPayload & { startedAt: number }

let current: ActiveSession | null = null
let lastHeartbeatAt: number | null = null
let server: Server | null = null
let sweepHandle: NodeJS.Timeout | null = null

function finalizeCurrent(endedAt: number): void {
  if (!current) return
  const durationMs = endedAt - current.startedAt
  if (durationMs >= 1000) {
    appendCodingSession({
      id: randomUUID(),
      filePath: current.filePath,
      fileName: current.fileName,
      projectName: current.projectName,
      language: current.language,
      startedAt: current.startedAt,
      endedAt,
      durationMs
    })
  }
  current = null
  lastHeartbeatAt = null
}

function handleHeartbeat(payload: HeartbeatPayload): void {
  const now = Date.now()
  const sameFile = current !== null && current.filePath === payload.filePath
  const idleTooLong = lastHeartbeatAt !== null && now - lastHeartbeatAt > IDLE_TIMEOUT_MS

  if (idleTooLong) {
    // The gap genuinely ended back when the last heartbeat arrived, not now —
    // "now" would otherwise count the idle gap itself as active time.
    finalizeCurrent(lastHeartbeatAt ?? now)
    current = { ...payload, startedAt: now }
  } else if (!sameFile) {
    // Switching files is an immediate action — the old file was in use right
    // up until now, unlike the idle case above.
    finalizeCurrent(now)
    current = { ...payload, startedAt: now }
  } else if (current && now - current.startedAt >= CHECKPOINT_MS) {
    finalizeCurrent(now)
    current = { ...payload, startedAt: now }
  } else if (current) {
    current.language = payload.language
    current.projectName = payload.projectName
    current.fileName = payload.fileName
  }
  lastHeartbeatAt = now
}

/** Closes out a session whose heartbeat stream just stopped entirely (editor closed, computer slept, etc.) — the check inside handleHeartbeat only fires on the *next* heartbeat, which may never come. */
function sweepIdle(): void {
  if (current && lastHeartbeatAt !== null && Date.now() - lastHeartbeatAt > IDLE_TIMEOUT_MS) {
    finalizeCurrent(lastHeartbeatAt)
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString()
      if (body.length > 1_000_000) {
        reject(new Error('Payload too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'POST' && req.url === '/heartbeat') {
    try {
      const body = await readBody(req)
      const payload = JSON.parse(body) as Partial<HeartbeatPayload>
      if (!payload.filePath || !payload.language) {
        res.writeHead(400).end('Missing filePath/language')
        return
      }
      handleHeartbeat({
        filePath: payload.filePath,
        fileName: payload.fileName || payload.filePath.split(/[\\/]/).pop() || payload.filePath,
        projectName: payload.projectName ?? null,
        language: payload.language
      })
      res.writeHead(204).end()
    } catch (error) {
      res.writeHead(400).end(String(error))
    }
    return
  }

  if (req.method === 'GET' && req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true }))
    return
  }

  res.writeHead(404).end()
}

export function startCodeTracker(port: number = DEFAULT_CODE_TRACKER_PORT): void {
  if (server) return
  server = createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      console.error('Code tracker request failed:', error)
      if (!res.headersSent) res.writeHead(500).end()
    })
  })
  server.on('error', (error) => console.error('Code tracker server error:', error))
  // Localhost-only — this never needs to be reachable from outside this machine.
  server.listen(port, '127.0.0.1')
  sweepHandle = setInterval(sweepIdle, SWEEP_INTERVAL_MS)
}

export function stopCodeTracker(): void {
  finalizeCurrent(lastHeartbeatAt ?? Date.now())
  if (sweepHandle) {
    clearInterval(sweepHandle)
    sweepHandle = null
  }
  if (server) {
    server.close()
    server = null
  }
}

/** Live in-progress session, so stats can include "right now" without waiting for it to finalize. */
export function currentCodingSession(): ActiveSession | null {
  return current ? { ...current } : null
}

export function getCodeTrackerStatus(port: number = DEFAULT_CODE_TRACKER_PORT): CodeTrackerStatus {
  return {
    port,
    current: current ? { fileName: current.fileName, language: current.language, startedAt: current.startedAt } : null,
    lastHeartbeatAt
  }
}
