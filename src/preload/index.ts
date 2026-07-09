import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { StatsRangeKey, TimerFormInput } from '../shared/types'

const api = {
  timers: {
    list: () => ipcRenderer.invoke('timers:list'),
    create: (input: TimerFormInput) => ipcRenderer.invoke('timers:create', input),
    update: (id: string, patch: TimerFormInput) => ipcRenderer.invoke('timers:update', id, patch),
    remove: (id: string) => ipcRenderer.invoke('timers:delete', id),
    start: (id: string) => ipcRenderer.invoke('timers:start', id),
    pause: (id: string) => ipcRenderer.invoke('timers:pause', id),
    reset: (id: string) => ipcRenderer.invoke('timers:reset', id),
    setManualTime: (id: string, ms: number) => ipcRenderer.invoke('timers:setManualTime', id, ms)
  },
  images: {
    saveTimerImage: (fileName: string, data: Uint8Array) =>
      ipcRenderer.invoke('images:saveTimerImage', fileName, data),
    deleteImage: (path: string) => ipcRenderer.invoke('images:deleteImage', path)
  },
  stats: {
    get: (range: StatsRangeKey) => ipcRenderer.invoke('stats:get', range)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
