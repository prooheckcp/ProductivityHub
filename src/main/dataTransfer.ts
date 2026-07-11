import { dialog } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import type { DataBundle } from '../shared/types'
import { getAchievementProgress, restoreAchievementProgress } from './store/achievements'
import { listAppUsageSessions, restoreAppUsageSessions } from './store/appUsage'
import { listAlarms, listCountdownTimers, restoreAlarms, restoreCountdownTimers } from './store/clock'
import { listCodingSessions, restoreCodingSessions } from './store/codeSessions'
import { listNoteFiles, listNoteGroups, listNotes, restoreNotesData } from './store/notes'
import { getSettings, setSettings } from './store/settings'
import { listCategories, listProjects, listTasks, restoreTodoData } from './store/todo'
import { listTimers, listTimerSessions, restoreTimersData } from './store/timers'

function buildBundle(): DataBundle {
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

  if (bundle.settings) setSettings(bundle.settings)
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

  return { canceled: false }
}
