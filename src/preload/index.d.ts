import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  AchievementProgress,
  AppDetailResult,
  AppSettings,
  Category,
  CategoryFormInput,
  HomeSummary,
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
  stats: {
    get: (query: StatsQuery) => Promise<StatsResult>
    getTodo: (query: StatsQuery) => Promise<TodoStatsResult>
    getAppDetail: (appName: string) => Promise<AppDetailResult>
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
  data: {
    export: () => Promise<{ canceled: boolean; path?: string }>
    import: () => Promise<{ canceled: boolean }>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
