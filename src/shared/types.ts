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
}

export type StatsResult = {
  range: StatsRangeKey
  timers: StatsEntry[]
  apps: StatsEntry[]
}
