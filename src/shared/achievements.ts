import type { AchievementDef, AchievementProgress, AchievementSummary } from './types'

const MIN_MS = 60 * 1000
const HOUR_MS = 60 * 60 * 1000

// Lifetime counters, independent of the current timers/tasks lists — deleting
// a timer or task later must not undo an already-earned achievement.
export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'timers-1', category: 'timers', threshold: 1, title: 'First Timer', description: 'Create your first timer.' },
  { id: 'timers-5', category: 'timers', threshold: 5, title: 'Timer Collector', description: 'Create 5 timers.' },
  { id: 'timers-15', category: 'timers', threshold: 15, title: 'Timer Hoarder', description: 'Create 15 timers.' },
  { id: 'timers-50', category: 'timers', threshold: 50, title: 'Timer Tycoon', description: 'Create 50 timers.' },
  {
    id: 'timerusage-10m',
    category: 'timerUsage',
    threshold: 10 * MIN_MS,
    title: 'Warming Up',
    description: 'Use a custom timer for 10 minutes.'
  },
  {
    id: 'timerusage-1h',
    category: 'timerUsage',
    threshold: HOUR_MS,
    title: 'Clocked In',
    description: 'Use a custom timer for 1 hour.'
  },
  {
    id: 'timerusage-10h',
    category: 'timerUsage',
    threshold: 10 * HOUR_MS,
    title: 'In The Zone',
    description: 'Use a custom timer for 10 hours.'
  },
  {
    id: 'timerusage-50h',
    category: 'timerUsage',
    threshold: 50 * HOUR_MS,
    title: 'Deep Work',
    description: 'Use a custom timer for 50 hours.'
  },
  {
    id: 'timerusage-100h',
    category: 'timerUsage',
    threshold: 100 * HOUR_MS,
    title: 'Time Lord',
    description: 'Use a custom timer for 100 hours.'
  },
  {
    id: 'timerusage-1000h',
    category: 'timerUsage',
    threshold: 1000 * HOUR_MS,
    title: 'Master Of Time',
    description: 'Use a custom timer for 1000 hours.'
  },
  { id: 'tasks-1', category: 'tasks', threshold: 1, title: 'First Step', description: 'Complete your first task.' },
  { id: 'tasks-5', category: 'tasks', threshold: 5, title: 'Warming Up', description: 'Complete 5 tasks.' },
  { id: 'tasks-10', category: 'tasks', threshold: 10, title: 'On A Roll', description: 'Complete 10 tasks.' },
  { id: 'tasks-25', category: 'tasks', threshold: 25, title: 'Task Crusher', description: 'Complete 25 tasks.' },
  { id: 'tasks-50', category: 'tasks', threshold: 50, title: 'Getting Things Done', description: 'Complete 50 tasks.' },
  { id: 'tasks-100', category: 'tasks', threshold: 100, title: 'Century', description: 'Complete 100 tasks.' },
  { id: 'tasks-200', category: 'tasks', threshold: 200, title: 'Unstoppable', description: 'Complete 200 tasks.' },
  { id: 'tasks-500', category: 'tasks', threshold: 500, title: 'Task Machine', description: 'Complete 500 tasks.' },
  { id: 'tasks-1000', category: 'tasks', threshold: 1000, title: 'Legendary', description: 'Complete 1000 tasks.' },
  { id: 'tasks-5000', category: 'tasks', threshold: 5000, title: 'Beyond Legendary', description: 'Complete 5000 tasks.' },
  {
    id: 'devtools-1h',
    category: 'devtools',
    threshold: HOUR_MS,
    title: 'Hello World',
    description: 'Spend 1 hour in developer tools.'
  },
  {
    id: 'devtools-5h',
    category: 'devtools',
    threshold: 5 * HOUR_MS,
    title: 'Debug Mode',
    description: 'Spend 5 hours in developer tools.'
  },
  {
    id: 'devtools-10h',
    category: 'devtools',
    threshold: 10 * HOUR_MS,
    title: 'Into The Code',
    description: 'Spend 10 hours in developer tools.'
  },
  {
    id: 'devtools-25h',
    category: 'devtools',
    threshold: 25 * HOUR_MS,
    title: 'Stack Overflow Regular',
    description: 'Spend 25 hours in developer tools.'
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
  },
  {
    id: 'devtools-500h',
    category: 'devtools',
    threshold: 500 * HOUR_MS,
    title: 'One With The Machine',
    description: 'Spend 500 hours in developer tools.'
  }
]

function currentFor(progress: AchievementProgress, category: AchievementDef['category']): number {
  if (category === 'timers') return progress.timersCreated
  if (category === 'tasks') return progress.tasksCompleted
  if (category === 'timerUsage') return progress.timerUsageMs
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
