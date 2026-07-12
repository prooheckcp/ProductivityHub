import { ipcMain, shell } from 'electron'
import type {
  AlarmFormInput,
  AppSettings,
  CategoryFormInput,
  CountdownTimerFormInput,
  NoteFileFormInput,
  NoteFormInput,
  NoteGroupFormInput,
  ProjectFormInput,
  StatsQuery,
  TaskFormInput,
  TaskStatus,
  TimerFormInput
} from '../shared/types'
import { getAppIconDataUrl } from './appIcons'
import { getAppDetail } from './appDetailStats'
import { copyAttachment, deleteAttachmentIfExists, saveAttachment } from './attachments'
import { getCodeTrackerStatus, resetCodeTracking } from './codeTracker'
import { exportData, importData } from './dataTransfer'
import { getHomeSummary } from './homeSummary'
import { copyImage, deleteImageIfExists, saveImage } from './images'
import { applyLoginItemSetting } from './loginItem'
import { getCodeStats, getStats, getTodoStats } from './stats'
import {
  getAchievementProgress,
  recordCellsCreated,
  recordNoteCreated,
  recordTaskCompleted,
  recordTaskUncompleted,
  recordTimerCreated,
  resetCodingProgress
} from './store/achievements'
import { resetCodingSessions } from './store/codeSessions'
import {
  createAlarm,
  createCountdownTimer,
  deleteAlarm,
  deleteCountdownTimer,
  listAlarms,
  listCountdownTimers,
  pauseCountdownTimer,
  restartCountdownTimer,
  startCountdownTimer,
  updateAlarm
} from './store/clock'
import { getSettings, updateSettings } from './store/settings'
import {
  createCategory,
  createProject,
  createTask,
  deleteCategory,
  deleteProject,
  deleteTask,
  listCategories,
  listProjects,
  listTasks,
  pauseTask,
  setTaskStatus,
  startTask,
  updateCategory,
  updateProject,
  updateTask
} from './store/todo'
import {
  createTimer,
  deleteTimer,
  listTimers,
  pauseTimer,
  resetTimer,
  setManualTime,
  startTimer,
  updateTimer
} from './store/timers'
import {
  createNote,
  createNoteFile,
  createNoteGroup,
  deleteNote,
  deleteNoteFile,
  deleteNoteGroup,
  detachNoteFile,
  listNoteFiles,
  listNoteGroups,
  listNotes,
  moveNote,
  moveNoteFile,
  noteFilePaths,
  updateNote,
  updateNoteFile,
  updateNoteGroup
} from './store/notes'

export function registerIpcHandlers(): void {
  // ---- Timers ----
  ipcMain.handle('timers:list', () => listTimers())

  ipcMain.handle('timers:create', (_event, input: TimerFormInput) => {
    const timer = createTimer(input)
    recordTimerCreated()
    return timer
  })

  ipcMain.handle('timers:update', (_event, id: string, patch: TimerFormInput) => {
    const existing = listTimers().find((t) => t.id === id)
    const updated = updateTimer(id, patch)
    if (existing?.imagePath && existing.imagePath !== patch.imagePath) {
      deleteImageIfExists(existing.imagePath)
    }
    return updated
  })

  ipcMain.handle('timers:delete', (_event, id: string) => {
    const timer = listTimers().find((t) => t.id === id)
    deleteTimer(id)
    if (timer) deleteImageIfExists(timer.imagePath)
  })

  ipcMain.handle('timers:start', (_event, id: string) => startTimer(id))
  ipcMain.handle('timers:pause', (_event, id: string) => pauseTimer(id))
  ipcMain.handle('timers:reset', (_event, id: string) => resetTimer(id))
  ipcMain.handle('timers:setManualTime', (_event, id: string, ms: number) => setManualTime(id, ms))

  // ---- Images ----
  ipcMain.handle('images:save', (_event, fileName: string, data: Uint8Array) => saveImage(fileName, data))
  ipcMain.handle('images:delete', (_event, path: string) => deleteImageIfExists(path))

  // ---- Attachments (e.g. PDFs) ----
  ipcMain.handle('attachments:save', (_event, fileName: string, data: Uint8Array) => saveAttachment(fileName, data))
  ipcMain.handle('attachments:delete', (_event, path: string) => deleteAttachmentIfExists(path))
  ipcMain.handle('attachments:open', (_event, path: string) => shell.openPath(path))
  ipcMain.handle('attachments:copy', (_event, path: string) => copyAttachment(path))
  ipcMain.handle('images:copy', (_event, path: string) => copyImage(path))

  // ---- Stats ----
  ipcMain.handle('stats:get', (_event, query: StatsQuery) => getStats(query))
  ipcMain.handle('stats:getTodo', (_event, query: StatsQuery) => getTodoStats(query))
  ipcMain.handle('stats:getCode', (_event, query: StatsQuery) => getCodeStats(query))
  ipcMain.handle('stats:getAppDetail', (_event, appName: string) => getAppDetail(appName))
  ipcMain.handle('code:getStatus', () => getCodeTrackerStatus())
  ipcMain.handle('code:resetStats', () => {
    resetCodingSessions()
    resetCodingProgress()
    resetCodeTracking()
  })
  ipcMain.handle('apps:getIcon', (_event, path: string | null) => getAppIconDataUrl(path))

  // ---- Settings ----
  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:update', (_event, patch: Partial<AppSettings>) => {
    const updated = updateSettings(patch)
    if (patch.launchAtLogin !== undefined) applyLoginItemSetting(updated.launchAtLogin)
    return updated
  })

  // ---- Achievements ----
  ipcMain.handle('achievements:get', () => getAchievementProgress())

  // ---- Home ----
  ipcMain.handle('home:getSummary', () => getHomeSummary())

  // ---- To-Do: projects ----
  ipcMain.handle('todo:projects:list', () => listProjects())
  ipcMain.handle('todo:projects:create', (_event, input: ProjectFormInput) => createProject(input))
  ipcMain.handle('todo:projects:update', (_event, id: string, patch: ProjectFormInput) => updateProject(id, patch))
  ipcMain.handle('todo:projects:delete', (_event, id: string) => deleteProject(id))

  // ---- To-Do: categories ----
  ipcMain.handle('todo:categories:list', () => listCategories())
  ipcMain.handle('todo:categories:create', (_event, projectId: string, input: CategoryFormInput) =>
    createCategory(projectId, input)
  )
  ipcMain.handle('todo:categories:update', (_event, id: string, patch: CategoryFormInput) =>
    updateCategory(id, patch)
  )
  ipcMain.handle('todo:categories:delete', (_event, id: string) => deleteCategory(id))

  // ---- To-Do: tasks ----
  ipcMain.handle('todo:tasks:list', () => listTasks())
  ipcMain.handle(
    'todo:tasks:create',
    (_event, categoryId: string, parentTaskId: string | null, input: TaskFormInput) =>
      createTask(categoryId, parentTaskId, input)
  )
  ipcMain.handle('todo:tasks:update', (_event, id: string, patch: TaskFormInput) => {
    const existing = listTasks().find((t) => t.id === id)
    const updated = updateTask(id, patch)
    const removedImages = (existing?.images ?? []).filter((path) => !patch.images.includes(path))
    removedImages.forEach(deleteImageIfExists)
    return updated
  })
  ipcMain.handle('todo:tasks:delete', (_event, id: string) => {
    const task = listTasks().find((t) => t.id === id)
    deleteTask(id)
    task?.images.forEach(deleteImageIfExists)
  })
  ipcMain.handle('todo:tasks:setStatus', (_event, id: string, status: TaskStatus) => {
    const { task, changed } = setTaskStatus(id, status)
    if (changed) {
      if (status === 'finished') recordTaskCompleted()
      else recordTaskUncompleted()
    }
    return task
  })
  ipcMain.handle('todo:tasks:start', (_event, id: string) => startTask(id))
  ipcMain.handle('todo:tasks:pause', (_event, id: string) => pauseTask(id))

  // ---- Clock: alarms ----
  ipcMain.handle('clock:alarms:list', () => listAlarms())
  ipcMain.handle('clock:alarms:create', (_event, input: AlarmFormInput) => createAlarm(input))
  ipcMain.handle('clock:alarms:update', (_event, id: string, patch: AlarmFormInput) => updateAlarm(id, patch))
  ipcMain.handle('clock:alarms:delete', (_event, id: string) => deleteAlarm(id))

  // ---- Clock: countdown timers ----
  ipcMain.handle('clock:timers:list', () => listCountdownTimers())
  ipcMain.handle('clock:timers:create', (_event, input: CountdownTimerFormInput) => createCountdownTimer(input))
  ipcMain.handle('clock:timers:delete', (_event, id: string) => deleteCountdownTimer(id))
  ipcMain.handle('clock:timers:start', (_event, id: string) => startCountdownTimer(id))
  ipcMain.handle('clock:timers:pause', (_event, id: string) => pauseCountdownTimer(id))
  ipcMain.handle('clock:timers:restart', (_event, id: string) => restartCountdownTimer(id))

  // ---- Notes ----
  ipcMain.handle('notes:list', () => listNotes())
  ipcMain.handle('notes:create', (_event, input: NoteFormInput) => {
    const note = createNote(input)
    recordNoteCreated()
    recordCellsCreated(note.blocks.length)
    return note
  })
  ipcMain.handle('notes:update', (_event, id: string, patch: NoteFormInput) => {
    const existing = listNotes().find((n) => n.id === id)
    const updated = updateNote(id, patch)
    // Count any net-new cells (blocks) toward the note-cell achievements.
    recordCellsCreated(updated.blocks.length - (existing?.blocks.length ?? 0))
    // Delete files whose blocks were removed. Route each removed path to the
    // right deleter based on the block type it came from.
    const nextPaths = new Set(noteFilePaths(updated))
    for (const block of existing?.blocks ?? []) {
      if (block.type === 'image' && !nextPaths.has(block.path)) deleteImageIfExists(block.path)
      if (block.type === 'pdf' && !nextPaths.has(block.path)) deleteAttachmentIfExists(block.path)
    }
    return updated
  })
  ipcMain.handle('notes:delete', (_event, id: string) => {
    const note = listNotes().find((n) => n.id === id)
    // deleteNote also removes files nested under the note, returning their paths.
    const childFilePaths = deleteNote(id)
    for (const block of note?.blocks ?? []) {
      if (block.type === 'image') deleteImageIfExists(block.path)
      if (block.type === 'pdf') deleteAttachmentIfExists(block.path)
    }
    // Child files may be images or PDFs/other. Both deleters are existence-checked
    // and target different dirs, so trying both per path is safe.
    for (const path of childFilePaths) {
      deleteImageIfExists(path)
      deleteAttachmentIfExists(path)
    }
  })
  ipcMain.handle('notes:move', (_event, id: string, groupId: string | null, order: number) =>
    moveNote(id, groupId, order)
  )

  // ---- Note groups ----
  ipcMain.handle('notes:groups:list', () => listNoteGroups())
  ipcMain.handle('notes:groups:create', (_event, input: NoteGroupFormInput) => createNoteGroup(input))
  ipcMain.handle('notes:groups:update', (_event, id: string, patch: NoteGroupFormInput) =>
    updateNoteGroup(id, patch)
  )
  ipcMain.handle('notes:groups:delete', (_event, id: string) => deleteNoteGroup(id))

  // ---- Note files (tree attachments) ----
  ipcMain.handle('notes:files:list', () => listNoteFiles())
  ipcMain.handle('notes:files:create', (_event, input: NoteFileFormInput) => createNoteFile(input))
  ipcMain.handle('notes:files:update', (_event, id: string, patch: { name: string }) => updateNoteFile(id, patch))
  ipcMain.handle('notes:files:delete', (_event, id: string) => {
    const removed = deleteNoteFile(id)
    if (removed) {
      if (removed.kind === 'image') deleteImageIfExists(removed.path)
      else deleteAttachmentIfExists(removed.path)
    }
  })
  ipcMain.handle(
    'notes:files:move',
    (_event, id: string, target: { groupId: string | null; parentNoteId: string | null }, order: number) =>
      moveNoteFile(id, target, order)
  )
  ipcMain.handle('notes:files:detach', (_event, id: string) => detachNoteFile(id))

  // ---- Data export/import ----
  ipcMain.handle('data:export', () => exportData())
  ipcMain.handle('data:import', () => importData())
}
