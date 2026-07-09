import { ACHIEVEMENT_DEFS } from '../../shared/achievements'
import type { AchievementProgress } from '../../shared/types'
import { dataFile } from './paths'
import { readJsonFile, writeJsonFile } from './jsonFile'

const progressFile = (): string => dataFile('achievements.json')

const DEFAULT_PROGRESS: AchievementProgress = {
  timersCreated: 0,
  tasksCompleted: 0,
  unlocked: {}
}

function loadProgress(): AchievementProgress {
  return { ...DEFAULT_PROGRESS, ...readJsonFile<Partial<AchievementProgress>>(progressFile(), {}) }
}

function saveProgress(progress: AchievementProgress): void {
  writeJsonFile(progressFile(), progress)
}

function unlockNewly(progress: AchievementProgress, category: 'timers' | 'tasks'): void {
  const count = category === 'timers' ? progress.timersCreated : progress.tasksCompleted
  for (const def of ACHIEVEMENT_DEFS) {
    if (def.category === category && count >= def.threshold && !(def.id in progress.unlocked)) {
      progress.unlocked[def.id] = Date.now()
    }
  }
}

export function getAchievementProgress(): AchievementProgress {
  return loadProgress()
}

export function recordTimerCreated(): AchievementProgress {
  const progress = loadProgress()
  progress.timersCreated += 1
  unlockNewly(progress, 'timers')
  saveProgress(progress)
  return progress
}

export function recordTaskCompleted(): AchievementProgress {
  const progress = loadProgress()
  progress.tasksCompleted += 1
  unlockNewly(progress, 'tasks')
  saveProgress(progress)
  return progress
}

/** A task was un-completed (checkbox toggled back off) — undo the lifetime count, but never revoke an unlocked achievement. */
export function recordTaskUncompleted(): AchievementProgress {
  const progress = loadProgress()
  progress.tasksCompleted = Math.max(0, progress.tasksCompleted - 1)
  saveProgress(progress)
  return progress
}

export function restoreAchievementProgress(progress: AchievementProgress): void {
  saveProgress({ ...DEFAULT_PROGRESS, ...progress })
}
