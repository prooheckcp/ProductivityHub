import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  AchievementProgress,
  Alarm,
  AlarmFormInput,
  AppDetailResult,
  AppSettings,
  Category,
  CategoryFormInput,
  CodeStatsResult,
  CodeTrackerStatus,
  CountdownTimer,
  CountdownTimerFormInput,
  HomeSummary,
  Note,
  NoteFormInput,
  Project,
  ProjectFormInput,
  StatsQuery,
  StatsResult,
  Task,
  TaskFormInput,
  TaskStatus,
  Timer,
  TimerFormInput,
  TodoStatsResult
} from '../shared/types'

export type Api = {
  timers: {
    list: () => Promise<Timer[]>
    create: (input: TimerFormInput) => Promise<Timer>
    update: (id: string, patch: TimerFormInput) => Promise<Timer>
    remove: (id: string) => Promise<void>
    start: (id: string) => Promise<Timer>
    pause: (id: string) => Promise<Timer>
    reset: (id: string) => Promise<Timer>
    setManualTime: (id: string, ms: number) => Promise<Timer>
  }
  images: {
    save: (fileName: string, data: Uint8Array) => Promise<string>
    delete: (path: string) => Promise<void>
  }
  attachments: {
    save: (fileName: string, data: Uint8Array) => Promise<string>
    delete: (path: string) => Promise<void>
    open: (path: string) => Promise<string>
  }
  stats: {
    get: (query: StatsQuery) => Promise<StatsResult>
    getTodo: (query: StatsQuery) => Promise<TodoStatsResult>
    getCode: (query: StatsQuery) => Promise<CodeStatsResult>
    getAppDetail: (appName: string) => Promise<AppDetailResult>
  }
  code: {
    getStatus: () => Promise<CodeTrackerStatus>
    resetStats: () => Promise<void>
  }
  apps: {
    getIcon: (path: string | null) => Promise<string | null>
  }
  settings: {
    get: () => Promise<AppSettings>
    update: (patch: Partial<AppSettings>) => Promise<AppSettings>
  }
  achievements: {
    get: () => Promise<AchievementProgress>
  }
  home: {
    getSummary: () => Promise<HomeSummary>
  }
  todo: {
    projects: {
      list: () => Promise<Project[]>
      create: (input: ProjectFormInput) => Promise<Project>
      update: (id: string, patch: ProjectFormInput) => Promise<Project>
      remove: (id: string) => Promise<void>
    }
    categories: {
      list: () => Promise<Category[]>
      create: (projectId: string, input: CategoryFormInput) => Promise<Category>
      update: (id: string, patch: CategoryFormInput) => Promise<Category>
      remove: (id: string) => Promise<void>
    }
    tasks: {
      list: () => Promise<Task[]>
      create: (categoryId: string, parentTaskId: string | null, input: TaskFormInput) => Promise<Task>
      update: (id: string, patch: TaskFormInput) => Promise<Task>
      remove: (id: string) => Promise<void>
      setStatus: (id: string, status: TaskStatus) => Promise<Task>
      start: (id: string) => Promise<Task>
      pause: (id: string) => Promise<Task>
    }
  }
  clock: {
    alarms: {
      list: () => Promise<Alarm[]>
      create: (input: AlarmFormInput) => Promise<Alarm>
      update: (id: string, patch: AlarmFormInput) => Promise<Alarm>
      remove: (id: string) => Promise<void>
    }
    timers: {
      list: () => Promise<CountdownTimer[]>
      create: (input: CountdownTimerFormInput) => Promise<CountdownTimer>
      remove: (id: string) => Promise<void>
      start: (id: string) => Promise<CountdownTimer>
      pause: (id: string) => Promise<CountdownTimer>
      restart: (id: string) => Promise<CountdownTimer>
    }
  }
  data: {
    export: () => Promise<{ canceled: boolean; path?: string }>
    import: () => Promise<{ canceled: boolean }>
  }
  notes: {
    list: () => Promise<Note[]>
    create: (input: NoteFormInput) => Promise<Note>
    update: (id: string, patch: NoteFormInput) => Promise<Note>
    remove: (id: string) => Promise<void>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
