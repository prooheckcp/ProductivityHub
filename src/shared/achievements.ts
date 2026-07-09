import type { AchievementDef, AchievementProgress, AchievementSummary } from './types'

const HOUR_MS = 60 * 60 * 1000

// Lifetime counters, independent of the current timers/tasks lists — deleting
// a timer or task later must not undo an already-earned achievement.
export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'timers-1', category: 'timers', threshold: 1, title: 'First Timer', description: 'Create your first timer.' },
  { id: 'timers-5', category: 'timers', threshold: 5, title: 'Timer Collector', description: 'Create 5 timers.' },
  { id: 'timers-15', category: 'timers', threshold: 15, title: 'Timer Hoarder', description: 'Create 15 timers.' },
  { id: 'timers-50', category: 'timers', threshold: 50, title: 'Timer Tycoon', description: 'Create 50 timers.' },
  { id: 'tasks-50', category: 'tasks', threshold: 50, title: 'Getting Things Done', description: 'Complete 50 tasks.' },
  { id: 'tasks-100', category: 'tasks', threshold: 100, title: 'Century', description: 'Complete 100 tasks.' },
  { id: 'tasks-500', category: 'tasks', threshold: 500, title: 'Task Machine', description: 'Complete 500 tasks.' },
  { id: 'tasks-1000', category: 'tasks', threshold: 1000, title: 'Legendary', description: 'Complete 1000 tasks.' },
  {
    id: 'devtools-10h',
    category: 'devtools',
    threshold: 10 * HOUR_MS,
    title: 'Into The Code',
    description: 'Spend 10 hours in developer tools.'
  },
  {
    id: 'devtools-50h',
    category: 'devtools',
    threshold: 50 * HOUR_MS,
    title: 'Keyboard Warrior',
    description: 'Spend 50 hours in developer tools.'
  },
  {
    id: 'devtools-100h',
    category: 'devtools',
    threshold: 100 * HOUR_MS,
    title: 'Compiler Whisperer',
    description: 'Spend 100 hours in developer tools.'
  },
  {
    id: 'devtools-250h',
    category: 'devtools',
    threshold: 250 * HOUR_MS,
    title: 'Living In The Terminal',
    description: 'Spend 250 hours in developer tools.'
  }
]

function currentFor(progress: AchievementProgress, category: AchievementDef['category']): number {
  if (category === 'timers') return progress.timersCreated
  if (category === 'tasks') return progress.tasksCompleted
  return progress.devToolsMs
}

export function describeAchievements(progress: AchievementProgress): AchievementSummary[] {
  return ACHIEVEMENT_DEFS.map((def) => {
    const current = currentFor(progress, def.category)
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      threshold: def.threshold,
      current,
      progress: Math.min(1, current / def.threshold),
      unlockedAt: progress.unlocked[def.id] ?? null
    }
  })
}
