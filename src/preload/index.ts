import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  AppSettings,
  CategoryFormInput,
  ProjectFormInput,
  StatsQuery,
  TaskFormInput,
  TimerFormInput
} from '../shared/types'

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
    save: (fileName: string, data: Uint8Array) => ipcRenderer.invoke('images:save', fileName, data),
    delete: (path: string) => ipcRenderer.invoke('images:delete', path)
  },
  stats: {
    get: (query: StatsQuery) => ipcRenderer.invoke('stats:get', query),
    getAppDetail: (appName: string) => ipcRenderer.invoke('stats:getAppDetail', appName)
  },
  apps: {
    getIcon: (path: string | null) => ipcRenderer.invoke('apps:getIcon', path)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (patch: Partial<AppSettings>) => ipcRenderer.invoke('settings:update', patch)
  },
  achievements: {
    get: () => ipcRenderer.invoke('achievements:get')
  },
  home: {
    getSummary: () => ipcRenderer.invoke('home:getSummary')
  },
  todo: {
    projects: {
      list: () => ipcRenderer.invoke('todo:projects:list'),
      create: (input: ProjectFormInput) => ipcRenderer.invoke('todo:projects:create', input),
      update: (id: string, patch: ProjectFormInput) => ipcRenderer.invoke('todo:projects:update', id, patch),
      remove: (id: string) => ipcRenderer.invoke('todo:projects:delete', id)
    },
    categories: {
      list: () => ipcRenderer.invoke('todo:categories:list'),
      create: (projectId: string, input: CategoryFormInput) =>
        ipcRenderer.invoke('todo:categories:create', projectId, input),
      update: (id: string, patch: CategoryFormInput) => ipcRenderer.invoke('todo:categories:update', id, patch),
      remove: (id: string) => ipcRenderer.invoke('todo:categories:delete', id)
    },
    tasks: {
      list: () => ipcRenderer.invoke('todo:tasks:list'),
      create: (categoryId: string, parentTaskId: string | null, input: TaskFormInput) =>
        ipcRenderer.invoke('todo:tasks:create', categoryId, parentTaskId, input),
      update: (id: string, patch: TaskFormInput) => ipcRenderer.invoke('todo:tasks:update', id, patch),
      remove: (id: string) => ipcRenderer.invoke('todo:tasks:delete', id),
      setCompleted: (id: string, completed: boolean) => ipcRenderer.invoke('todo:tasks:setCompleted', id, completed),
      start: (id: string) => ipcRenderer.invoke('todo:tasks:start', id),
      pause: (id: string) => ipcRenderer.invoke('todo:tasks:pause', id)
    }
  },
  data: {
    export: () => ipcRenderer.invoke('data:export'),
    import: () => ipcRenderer.invoke('data:import')
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
