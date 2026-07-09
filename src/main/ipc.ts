import { ipcMain } from 'electron'
import type { AppSettings, CategoryFormInput, ProjectFormInput, StatsRangeKey, TaskFormInput, TimerFormInput } from '../shared/types'
import { getAppIconDataUrl } from './appIcons'
import { exportData, importData } from './dataTransfer'
import { getHomeSummary } from './homeSummary'
import { deleteImageIfExists, saveImage } from './images'
import { getStats } from './stats'
import { getAchievementProgress, recordTaskCompleted, recordTaskUncompleted, recordTimerCreated } from './store/achievements'
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
  setTaskCompleted,
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

  // ---- Stats ----
  ipcMain.handle('stats:get', (_event, range: StatsRangeKey) => getStats(range))
  ipcMain.handle('apps:getIcon', (_event, path: string | null) => getAppIconDataUrl(path))

  // ---- Settings ----
  ipcMain.handle('settings:get', () => getSettings())
  ipcMain.handle('settings:update', (_event, patch: Partial<AppSettings>) => updateSettings(patch))

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
  ipcMain.handle('todo:tasks:setCompleted', (_event, id: string, completed: boolean) => {
    const { task, changed } = setTaskCompleted(id, completed)
    if (changed) {
      if (completed) recordTaskCompleted()
      else recordTaskUncompleted()
    }
    return task
  })
  ipcMain.handle('todo:tasks:start', (_event, id: string) => startTask(id))
  ipcMain.handle('todo:tasks:pause', (_event, id: string) => pauseTask(id))

  // ---- Data export/import ----
  ipcMain.handle('data:export', () => exportData())
  ipcMain.handle('data:import', () => importData())
}
