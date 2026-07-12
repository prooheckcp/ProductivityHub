import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  AchievementDef,
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

const api = {
  overlay: {
    // Toggle the floating overlay window's click-through. Passing false while a
    // button is hovered lets the click land; true restores pass-through.
    setMouseIgnore: (ignore: boolean) => ipcRenderer.send('overlay:set-mouse-ignore', ignore)
  },
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
    delete: (path: string) => ipcRenderer.invoke('images:delete', path),
    copy: (path: string) => ipcRenderer.invoke('images:copy', path)
  },
  attachments: {
    save: (fileName: string, data: Uint8Array) => ipcRenderer.invoke('attachments:save', fileName, data),
    delete: (path: string) => ipcRenderer.invoke('attachments:delete', path),
    open: (path: string) => ipcRenderer.invoke('attachments:open', path),
    copy: (path: string) => ipcRenderer.invoke('attachments:copy', path)
  },
  stats: {
    get: (query: StatsQuery) => ipcRenderer.invoke('stats:get', query),
    getTodo: (query: StatsQuery) => ipcRenderer.invoke('stats:getTodo', query),
    getCode: (query: StatsQuery) => ipcRenderer.invoke('stats:getCode', query),
    getAppDetail: (appName: string) => ipcRenderer.invoke('stats:getAppDetail', appName)
  },
  code: {
    getStatus: () => ipcRenderer.invoke('code:getStatus'),
    resetStats: () => ipcRenderer.invoke('code:resetStats')
  },
  apps: {
    getIcon: (path: string | null) => ipcRenderer.invoke('apps:getIcon', path)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (patch: Partial<AppSettings>) => ipcRenderer.invoke('settings:update', patch)
  },
  achievements: {
    get: () => ipcRenderer.invoke('achievements:get'),
    onUnlocked: (callback: (defs: AchievementDef[]) => void) => {
      const listener = (_event: IpcRendererEvent, defs: AchievementDef[]): void => callback(defs)
      ipcRenderer.on('achievements:unlocked', listener)
      return () => ipcRenderer.removeListener('achievements:unlocked', listener)
    }
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
      setStatus: (id: string, status: TaskStatus) => ipcRenderer.invoke('todo:tasks:setStatus', id, status),
      start: (id: string) => ipcRenderer.invoke('todo:tasks:start', id),
      pause: (id: string) => ipcRenderer.invoke('todo:tasks:pause', id)
    }
  },
  clock: {
    alarms: {
      list: () => ipcRenderer.invoke('clock:alarms:list'),
      create: (input: AlarmFormInput) => ipcRenderer.invoke('clock:alarms:create', input),
      update: (id: string, patch: AlarmFormInput) => ipcRenderer.invoke('clock:alarms:update', id, patch),
      remove: (id: string) => ipcRenderer.invoke('clock:alarms:delete', id)
    },
    timers: {
      list: () => ipcRenderer.invoke('clock:timers:list'),
      create: (input: CountdownTimerFormInput) => ipcRenderer.invoke('clock:timers:create', input),
      remove: (id: string) => ipcRenderer.invoke('clock:timers:delete', id),
      start: (id: string) => ipcRenderer.invoke('clock:timers:start', id),
      pause: (id: string) => ipcRenderer.invoke('clock:timers:pause', id),
      restart: (id: string) => ipcRenderer.invoke('clock:timers:restart', id)
    }
  },
  data: {
    export: () => ipcRenderer.invoke('data:export'),
    import: () => ipcRenderer.invoke('data:import')
  },
  notes: {
    list: () => ipcRenderer.invoke('notes:list'),
    create: (input: NoteFormInput) => ipcRenderer.invoke('notes:create', input),
    update: (id: string, patch: NoteFormInput) => ipcRenderer.invoke('notes:update', id, patch),
    remove: (id: string) => ipcRenderer.invoke('notes:delete', id),
    move: (id: string, groupId: string | null, order: number) =>
      ipcRenderer.invoke('notes:move', id, groupId, order),
    groups: {
      list: () => ipcRenderer.invoke('notes:groups:list'),
      create: (input: NoteGroupFormInput) => ipcRenderer.invoke('notes:groups:create', input),
      update: (id: string, patch: NoteGroupFormInput) => ipcRenderer.invoke('notes:groups:update', id, patch),
      remove: (id: string) => ipcRenderer.invoke('notes:groups:delete', id)
    },
    files: {
      list: () => ipcRenderer.invoke('notes:files:list'),
      create: (input: NoteFileFormInput) => ipcRenderer.invoke('notes:files:create', input),
      update: (id: string, patch: { name: string }) => ipcRenderer.invoke('notes:files:update', id, patch),
      remove: (id: string) => ipcRenderer.invoke('notes:files:delete', id),
      move: (id: string, target: { groupId: string | null; parentNoteId: string | null }, order: number) =>
        ipcRenderer.invoke('notes:files:move', id, target, order),
      detach: (id: string) => ipcRenderer.invoke('notes:files:detach', id)
    }
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
