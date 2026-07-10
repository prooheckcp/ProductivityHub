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

// ---- Coding activity (VS Code extension) ----

export type CodingSession = {
  id: string
  filePath: string
  fileName: string
  projectName: string | null
  language: string
  startedAt: number
  endedAt: number
  durationMs: number
}

export type CodeStatsEntry = {
  key: string
  label: string
  ms: number
}

export type CodeStatsResult = {
  totalMs: number
  byLanguage: CodeStatsEntry[]
  byProject: CodeStatsEntry[]
  byFile: CodeStatsEntry[]
}

export type CodeTrackerStatus = {
  port: number
  current: { fileName: string; language: string; startedAt: number } | null
  lastHeartbeatAt: number | null
}

export type TimerFormInput = {
  name: string
  description: string
  imagePath: string | null
}

export type StatsRangeKey = '1d' | '7d' | '30d' | 'all' | 'custom'

export type StatsEntry = {
  key: string
  label: string
  ms: number
  appPath?: string | null
  category?: string | null
}

export type StatsQuery = {
  range: StatsRangeKey
  startMs?: number
  endMs?: number
  category?: string | null
}

export type StatsResult = {
  range: StatsRangeKey
  timers: StatsEntry[]
  apps: StatsEntry[]
  appsAllTime: StatsEntry[]
  categories: StatsEntry[]
  categorySupport: boolean
  availableCategories: string[]
}

// ---- Per-app detail (weekday / month / daily-average breakdown) ----

export type AppDetailQuery = {
  appName: string
}

// ---- To-Do stats (completed tasks over a range) ----

export type TodoStatsEntry = {
  key: string
  label: string
  count: number
}

export type TodoStatsResult = {
  totalCompleted: number
  byProject: TodoStatsEntry[]
}

export type AppDetailBucket = {
  key: string
  label: string
  ms: number
}

export type AppDetailResult = {
  appName: string
  appPath: string | null
  totalMs: number
  averagePerDayMs: number
  byWeekday: AppDetailBucket[]
  byMonth: AppDetailBucket[]
}

// ---- Settings ----

export type FontChoice = 'system' | 'serif' | 'rounded' | 'mono' | 'comic' | 'arial'

export type AppSettings = {
  backgroundGradient: string
  font: FontChoice
  textColor: string | null
  launchAtLogin: boolean
}

// ---- To-Do ----

export type Project = {
  id: string
  name: string
  description: string
  imagePath: string | null
  sprintSizeDays: number | null
  sprintStartDate: number | null
  createdAt: number
  updatedAt: number
}

export type ProjectFormInput = {
  name: string
  description: string
  imagePath: string | null
  sprintSizeDays: number | null
  sprintStartDate: number | null
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

export type TaskStatus = 'todo' | 'in_progress' | 'under_review' | 'finished'

export type Task = {
  id: string
  categoryId: string
  parentTaskId: string | null
  name: string
  description: string
  images: string[]
  priority: TaskPriority
  status: TaskStatus
  statusChangedAt: number | null
  deadline: number | null
  estimatedMs: number | null
  accumulatedMs: number
  runningSince: number | null
  deadlineNotifiedAt: number | null
  sprintNumber: number | null
  linkedTimerId: string | null
  timerTargetMs: number | null
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
  sprintNumber: number | null
  linkedTimerId: string | null
  timerTargetMs: number | null
}

// ---- Alarms & Countdown Timers ----

export type AlarmRepeat = 'once' | 'weekly'

export type Alarm = {
  id: string
  name: string
  hour: number
  minute: number
  repeat: AlarmRepeat
  /** 0 = Sunday .. 6 = Saturday. For 'weekly', the days it repeats on. For
   *  'once', an optional target day (empty = next occurrence of this time). */
  daysOfWeek: number[]
  enabled: boolean
  lastTriggeredAt: number | null
  createdAt: number
  updatedAt: number
}

export type AlarmFormInput = {
  name: string
  hour: number
  minute: number
  repeat: AlarmRepeat
  daysOfWeek: number[]
  enabled: boolean
}

export type CountdownTimerStatus = 'idle' | 'running' | 'paused' | 'finished'

export type CountdownTimer = {
  id: string
  name: string
  durationMs: number
  remainingMs: number
  status: CountdownTimerStatus
  endsAt: number | null
  createdAt: number
  updatedAt: number
}

export type CountdownTimerFormInput = {
  name: string
  durationMs: number
}

// ---- Achievements ----

export type AchievementCategory = 'timers' | 'tasks' | 'devtools' | 'timerUsage' | 'coding'

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
  devToolsMs: number
  timerUsageMs: number
  codingMs: number
  unlocked: Record<string, number>
}

export type AchievementSummary = {
  id: string
  title: string
  description: string
  category: AchievementCategory
  threshold: number
  current: number
  progress: number
  unlockedAt: number | null
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
  recentAchievements: AchievementSummary[]
  closeAchievements: AchievementSummary[]
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
  alarms: Alarm[]
  countdownTimers: CountdownTimer[]
  codingSessions: CodingSession[]
}
