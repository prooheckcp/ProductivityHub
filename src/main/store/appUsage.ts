import { isDevToolsApp } from '../../shared/appCategories'
import type { AppUsageSession } from '../../shared/types'
import { recordDevToolsUsage } from './achievements'
import { dataFile } from './paths'
import { readJsonFile, writeJsonFile } from './jsonFile'

const sessionsFile = (): string => dataFile('app-usage-sessions.json')

export function listAppUsageSessions(): AppUsageSession[] {
  return readJsonFile<AppUsageSession[]>(sessionsFile(), [])
}

export function appendAppUsageSession(session: AppUsageSession): void {
  const sessions = listAppUsageSessions()
  sessions.push(session)
  writeJsonFile(sessionsFile(), sessions)
  if (isDevToolsApp(session.appName)) recordDevToolsUsage(session.durationMs)
}

export function restoreAppUsageSessions(sessions: AppUsageSession[]): void {
  writeJsonFile(sessionsFile(), sessions)
}
