import type { AchievementDef } from './types'

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
  { id: 'tasks-1000', category: 'tasks', threshold: 1000, title: 'Legendary', description: 'Complete 1000 tasks.' }
]
