import { randomUUID } from 'crypto'
import { createServer } from 'http'
import type { IncomingMessage, Server, ServerResponse } from 'http'
import { DEFAULT_CODE_TRACKER_PORT } from '../shared/codeTrackerConfig'
import { languageForFile } from '../shared/languageExtensions'
import type { CodeTrackerStatus, CodingSession } from '../shared/types'
import { appendCodingSession, listCodingSessions } from './store/codeSessions'

// A file only keeps "accumulating time" while heartbeats keep arriving from
// the VS Code extension (which only sends one while the user is actively
// typing) — once they stop for this long, the session is closed even though
// the file may still be open on screen.
const IDLE_TIMEOUT_MS = 5 * 60 * 1000
// Bounds crash data loss for one long continuous typing streak, same reasoning
// as appTracker's CHECKPOINT_MS.
const CHECKPOINT_MS = 60 * 1000
// The extension throttles heartbeats to one per 30s per file while typing
// continuously, so a real gap between two heartbeats for the "current"
// stretch should never be much more than that. Anyone hitting this HTTP
// endpoint directly (bypassing the extension) could otherwise send two
// heartbeats minutes apart and have the entire gap between them credited as
// active coding time — this caps how much any single gap can contribute,
// independent of how long the actual gap was, so credited time can never
// run ahead of what could plausibly have happened.
const MAX_HEARTBEAT_GAP_MS = 60 * 1000
const SWEEP_INTERVAL_MS = 30 * 1000
const LAST_24H_MS = 24 * 60 * 60 * 1000

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

function handleHeartbeat(rawPayload: HeartbeatPayload): void {
  const now = Date.now()
  // Resolve the display language from the file extension rather than
  // trusting the editor's languageId verbatim — obscure/newer languages
  // (e.g. Luau) often come through as 'plaintext' otherwise.
  const payload: HeartbeatPayload = {
    ...rawPayload,
    language: languageForFile(rawPayload.fileName, rawPayload.language)
  }

  if (current && lastHeartbeatAt !== null) {
    const gap = now - lastHeartbeatAt
    const sameFile = current.filePath === payload.filePath
    if (gap > IDLE_TIMEOUT_MS) {
      // Genuinely away — close out crediting nothing for the idle gap itself.
      finalizeCurrent(lastHeartbeatAt)
    } else if (!sameFile || gap > MAX_HEARTBEAT_GAP_MS || now - current.startedAt >= CHECKPOINT_MS) {
      // Whatever the reason for finalizing (file switch, an oversized gap, or
      // a routine durability checkpoint), never credit more than
      // MAX_HEARTBEAT_GAP_MS past the last heartbeat we actually saw — this
      // is what bounds any single gap's contribution to real elapsed time.
      finalizeCurrent(Math.min(now, lastHeartbeatAt + MAX_HEARTBEAT_GAP_MS))
    }
  }

  if (!current) {
    current = { ...payload, startedAt: now }
  } else {
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

function sumMsInWindow(sessions: CodingSession[], windowStart: number, windowEnd: number): number {
  let total = 0
  for (const session of sessions) {
    const start = Math.max(session.startedAt, windowStart)
    const end = Math.min(session.endedAt, windowEnd)
    if (end > start) total += end - start
  }
  return total
}

/** Total coding time in the last 24 hours, including the live in-progress session. */
function getLast24hCodingMs(): number {
  const now = Date.now()
  const windowStart = now - LAST_24H_MS
  let total = sumMsInWindow(listCodingSessions(), windowStart, now)
  if (current) {
    const start = Math.max(current.startedAt, windowStart)
    if (now > start) total += now - start
  }
  return total
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

  if (req.method === 'GET' && req.url === '/stats/last24h') {
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ totalMs: getLast24hCodingMs() }))
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

/** Drops the in-progress session without persisting it — used when the user resets their code stats. */
export function resetCodeTracking(): void {
  current = null
  lastHeartbeatAt = null
}

export function getCodeTrackerStatus(port: number = DEFAULT_CODE_TRACKER_PORT): CodeTrackerStatus {
  return {
    port,
    current: current ? { fileName: current.fileName, language: current.language, startedAt: current.startedAt } : null,
    lastHeartbeatAt
  }
}
