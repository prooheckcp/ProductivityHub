import type { CodingSession } from '../../shared/types'
import { dataFile } from './paths'
import { readJsonFile, writeJsonFile } from './jsonFile'
import { recordCodingUsage } from './achievements'

const sessionsFile = (): string => dataFile('coding-sessions.json')

export function listCodingSessions(): CodingSession[] {
  return readJsonFile<CodingSession[]>(sessionsFile(), [])
}

export function appendCodingSession(session: CodingSession): void {
  const sessions = listCodingSessions()
  sessions.push(session)
  writeJsonFile(sessionsFile(), sessions)
  recordCodingUsage(session.durationMs)
}

export function restoreCodingSessions(sessions: CodingSession[]): void {
  writeJsonFile(sessionsFile(), sessions)
}

export function resetCodingSessions(): void {
  writeJsonFile(sessionsFile(), [])
}
