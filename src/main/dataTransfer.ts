import { dialog } from 'electron'
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { DataBundle } from '../shared/types'
import { getDataDir } from './store/paths'
import { identityRoot } from './store/identity'
import { getAchievementProgress, restoreAchievementProgress } from './store/achievements'
import { listAppUsageSessions, restoreAppUsageSessions } from './store/appUsage'
import { listAlarms, listCountdownTimers, restoreAlarms, restoreCountdownTimers } from './store/clock'
import { listCodingSessions, restoreCodingSessions } from './store/codeSessions'
import { listNoteFiles, listNoteGroups, listNotes, restoreNotesData } from './store/notes'
import { getSettings, setSettings } from './store/settings'
import { listCategories, listProjects, listTasks, restoreTodoData } from './store/todo'
import { listTimers, listTimerSessions, restoreTimersData } from './store/timers'

// The full serializable snapshot of the current identity's local data. Reused by
// file export/import AND by cloud sync (see main/ipc.ts auth:* handlers).
export function buildBundle(): DataBundle {
  return {
    exportedAt: Date.now(),
    settings: getSettings(),
    timers: listTimers(),
    timerSessions: listTimerSessions(),
    appUsageSessions: listAppUsageSessions(),
    projects: listProjects(),
    categories: listCategories(),
    tasks: listTasks(),
    achievements: getAchievementProgress(),
    alarms: listAlarms(),
    countdownTimers: listCountdownTimers(),
    codingSessions: listCodingSessions(),
    notes: listNotes(),
    noteGroups: listNoteGroups(),
    noteFiles: listNoteFiles()
  }
}

// Write a bundle into the current identity's local stores. `skipSettings` lets
// cloud sync preserve machine-specific settings (launchAtLogin, showTimerOverlay)
// while still restoring the rest — the theme fields are merged separately.
export function restoreBundle(bundle: Partial<DataBundle>, options: { skipSettings?: boolean } = {}): void {
  if (bundle.settings && !options.skipSettings) setSettings(bundle.settings)
  restoreTimersData(bundle.timers ?? [], bundle.timerSessions ?? [])
  restoreAppUsageSessions(bundle.appUsageSessions ?? [])
  restoreTodoData({
    projects: bundle.projects ?? [],
    categories: bundle.categories ?? [],
    tasks: bundle.tasks ?? []
  })
  if (bundle.achievements) restoreAchievementProgress(bundle.achievements)
  if (bundle.alarms) restoreAlarms(bundle.alarms)
  if (bundle.countdownTimers) restoreCountdownTimers(bundle.countdownTimers)
  if (bundle.codingSessions) restoreCodingSessions(bundle.codingSessions)
  if (bundle.notes || bundle.noteGroups || bundle.noteFiles)
    restoreNotesData(bundle.notes ?? [], bundle.noteGroups ?? [], bundle.noteFiles ?? [])
}

// Snapshot the current identity's data dir before anything overwrites it. This
// is a safety net: even if a restore replaces the live data, the previous state
// is recoverable under <identityRoot>/backups/<timestamp>/. Keeps the 10 newest.
export function backupCurrentData(reason: string): void {
  try {
    const dataDir = getDataDir()
    if (!existsSync(dataDir)) return
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupsRoot = join(identityRoot(), 'backups')
    cpSync(dataDir, join(backupsRoot, `${stamp}_${reason}`), { recursive: true })

    // Prune to the 10 most recent backups.
    const entries = readdirSync(backupsRoot).sort()
    for (const old of entries.slice(0, Math.max(0, entries.length - 10))) {
      rmSync(join(backupsRoot, old), { recursive: true, force: true })
    }
  } catch (error) {
    console.error('Failed to back up data dir:', error)
  }
}

export async function exportData(): Promise<{ canceled: boolean; path?: string }> {
  const defaultName = `shiba-tracker-export-${new Date().toISOString().slice(0, 10)}.json`
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export Shiba Tracker data',
    defaultPath: defaultName,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (canceled || !filePath) return { canceled: true }
  writeFileSync(filePath, JSON.stringify(buildBundle(), null, 2), 'utf-8')
  return { canceled: false, path: filePath }
}

export async function importData(): Promise<{ canceled: boolean }> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Import Shiba Tracker data',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  })
  if (canceled || filePaths.length === 0) return { canceled: true }

  const raw = readFileSync(filePaths[0], 'utf-8')
  const bundle = JSON.parse(raw) as Partial<DataBundle>
  restoreBundle(bundle)
  return { canceled: false }
}
