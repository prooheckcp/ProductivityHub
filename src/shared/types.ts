export type Timer = {
  id: string
  name: string
  description: string
  imagePath: string | null
  createdAt: number
  updatedAt: number
  accumulatedMs: number
  runningSince: number | null
  lastResetAt: number | null
}

export type TimerSession = {
  id: string
  timerId: string
  timerName: string
  startedAt: number
  endedAt: number
  durationMs: number
}

export type AppUsageSession = {
  id: string
  appName: string
  appPath: string | null
  startedAt: number
  endedAt: number
  durationMs: number
}

export type TimerFormInput = {
  name: string
  description: string
  imagePath: string | null
}

export type StatsRangeKey = '1d' | '7d' | '30d' | 'all'

export type StatsEntry = {
  key: string
  label: string
  ms: number
  appPath?: string | null
}

export type StatsResult = {
  range: StatsRangeKey
  timers: StatsEntry[]
  apps: StatsEntry[]
  appsAllTime: StatsEntry[]
  categories: StatsEntry[]
  categorySupport: boolean
}

// ---- Settings ----

export type FontChoice = 'system' | 'serif' | 'rounded' | 'mono'

export type AppSettings = {
  backgroundGradient: string
  buttonGradient: string
  font: FontChoice
}

// ---- To-Do ----

export type Project = {
  id: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
}

export type ProjectFormInput = {
  name: string
  description: string
}

export type Category = {
  id: string
  projectId: string
  name: string
  order: number
  createdAt: number
  updatedAt: number
}

export type CategoryFormInput = {
  name: string
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type Task = {
  id: string
  categoryId: string
  parentTaskId: string | null
  name: string
  description: string
  images: string[]
  priority: TaskPriority
  deadline: number | null
  estimatedMs: number | null
  accumulatedMs: number
  runningSince: number | null
  completed: boolean
  completedAt: number | null
  deadlineNotifiedAt: number | null
  order: number
  createdAt: number
  updatedAt: number
}

export type TaskFormInput = {
  name: string
  description: string
  images: string[]
  priority: TaskPriority
  deadline: number | null
  estimatedMs: number | null
}

// ---- Achievements ----

export type AchievementCategory = 'timers' | 'tasks'

export type AchievementDef = {
  id: string
  category: AchievementCategory
  threshold: number
  title: string
  description: string
}

export type AchievementProgress = {
  timersCreated: number
  tasksCompleted: number
  unlocked: Record<string, number>
}

// ---- Home ----

export type RecentProjectLink = {
  projectId: string
  projectName: string
  taskName: string
  completedAt: number
}

export type HomeSummary = {
  timerMsToday: number
  appMsToday: number
  tasksCompletedToday: number
  recentTimers: Timer[]
  recentProject: RecentProjectLink | null
}

// ---- Export/Import ----

export type DataBundle = {
  exportedAt: number
  settings: AppSettings
  timers: Timer[]
  timerSessions: TimerSession[]
  appUsageSessions: AppUsageSession[]
  projects: Project[]
  categories: Category[]
  tasks: Task[]
  achievements: AchievementProgress
}
