import { ipcMain } from 'electron'
import type { StatsRangeKey, TimerFormInput } from '../shared/types'
import { deleteImageIfExists, saveTimerImage } from './images'
import { getStats } from './stats'
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
  ipcMain.handle('timers:list', () => listTimers())

  ipcMain.handle('timers:create', (_event, input: TimerFormInput) => createTimer(input))

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

  ipcMain.handle('images:saveTimerImage', (_event, fileName: string, data: Uint8Array) =>
    saveTimerImage(fileName, data)
  )

  ipcMain.handle('images:deleteImage', (_event, path: string) => deleteImageIfExists(path))

  ipcMain.handle('stats:get', (_event, range: StatsRangeKey) => getStats(range))
}
