import { Notification } from 'electron'
import { is } from '@electron-toolkit/utils'
import { ACHIEVEMENT_DEFS } from '../../shared/achievements'
import type { AchievementDef, AchievementProgress } from '../../shared/types'
import { dataFile } from './paths'
import { readJsonFile, writeJsonFile } from './jsonFile'

const progressFile = (): string => dataFile('achievements.json')

// Testing convenience: in dev builds every achievement reads back as unlocked.
// Applied only at return time, never written to disk, so the real save file
// stays intact for production.
function applyDevUnlocks(progress: AchievementProgress): AchievementProgress {
  if (!is.dev) return progress
  const unlocked = { ...progress.unlocked }
  for (const def of ACHIEVEMENT_DEFS) {
    if (!(def.id in unlocked)) unlocked[def.id] = Date.now()
  }
  return { ...progress, unlocked }
}

const DEFAULT_PROGRESS: AchievementProgress = {
  timersCreated: 0,
  tasksCompleted: 0,
  devToolsMs: 0,
  timerUsageMs: 0,
  codingMs: 0,
  unlocked: {}
}

function loadProgress(): AchievementProgress {
  return { ...DEFAULT_PROGRESS, ...readJsonFile<Partial<AchievementProgress>>(progressFile(), {}) }
}

function saveProgress(progress: AchievementProgress): void {
  writeJsonFile(progressFile(), progress)
}

function notifyUnlocked(defs: AchievementDef[]): void {
  if (!Notification.isSupported()) return
  for (const def of defs) {
    new Notification({ title: 'Achievement unlocked', body: def.title }).show()
  }
}

function countFor(progress: AchievementProgress, category: AchievementDef['category']): number {
  if (category === 'timers') return progress.timersCreated
  if (category === 'tasks') return progress.tasksCompleted
  if (category === 'timerUsage') return progress.timerUsageMs
  if (category === 'coding') return progress.codingMs
  return progress.devToolsMs
}

function unlockNewly(progress: AchievementProgress, category: AchievementDef['category']): AchievementDef[] {
  const count = countFor(progress, category)
  const newlyUnlocked: AchievementDef[] = []
  for (const def of ACHIEVEMENT_DEFS) {
    if (def.category === category && count >= def.threshold && !(def.id in progress.unlocked)) {
      progress.unlocked[def.id] = Date.now()
      newlyUnlocked.push(def)
    }
  }
  return newlyUnlocked
}

export function getAchievementProgress(): AchievementProgress {
  return applyDevUnlocks(loadProgress())
}

export function recordTimerCreated(): AchievementProgress {
  const progress = loadProgress()
  progress.timersCreated += 1
  notifyUnlocked(unlockNewly(progress, 'timers'))
  saveProgress(progress)
  return applyDevUnlocks(progress)
}

export function recordTaskCompleted(): AchievementProgress {
  const progress = loadProgress()
  progress.tasksCompleted += 1
  notifyUnlocked(unlockNewly(progress, 'tasks'))
  saveProgress(progress)
  return applyDevUnlocks(progress)
}

/** A task was un-completed (checkbox toggled back off) — undo the lifetime count, but never revoke an unlocked achievement. */
export function recordTaskUncompleted(): AchievementProgress {
  const progress = loadProgress()
  progress.tasksCompleted = Math.max(0, progress.tasksCompleted - 1)
  saveProgress(progress)
  return applyDevUnlocks(progress)
}

export function recordDevToolsUsage(deltaMs: number): AchievementProgress {
  const progress = loadProgress()
  progress.devToolsMs += deltaMs
  notifyUnlocked(unlockNewly(progress, 'devtools'))
  saveProgress(progress)
  return applyDevUnlocks(progress)
}

export function recordTimerUsage(deltaMs: number): AchievementProgress {
  const progress = loadProgress()
  progress.timerUsageMs += deltaMs
  notifyUnlocked(unlockNewly(progress, 'timerUsage'))
  saveProgress(progress)
  return applyDevUnlocks(progress)
}

export function recordCodingUsage(deltaMs: number): AchievementProgress {
  const progress = loadProgress()
  progress.codingMs += deltaMs
  notifyUnlocked(unlockNewly(progress, 'coding'))
  saveProgress(progress)
  return applyDevUnlocks(progress)
}

export function restoreAchievementProgress(progress: AchievementProgress): void {
  saveProgress({ ...DEFAULT_PROGRESS, ...progress })
}

/** Zeroes the coding-time counter without revoking already-unlocked achievements. */
export function resetCodingProgress(): void {
  const progress = loadProgress()
  progress.codingMs = 0
  saveProgress(progress)
}
