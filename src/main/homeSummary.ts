import { describeAchievements } from '../shared/achievements'
import type { HomeSummary } from '../shared/types'
import { currentAppUsage } from './appTracker'
import { listAppUsageSessions } from './store/appUsage'
import { getAchievementProgress } from './store/achievements'
import { listCategories, listProjects, listTasks } from './store/todo'
import { listTimers, listTimerSessions } from './store/timers'

function overlapMs(start: number, end: number, rangeStart: number, rangeEnd: number): number {
  return Math.max(0, Math.min(end, rangeEnd) - Math.max(start, rangeStart))
}

function startOfDay(now: number): number {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function getHomeSummary(): HomeSummary {
  const now = Date.now()
  const dayStart = startOfDay(now)

  let timerMsToday = 0
  for (const session of listTimerSessions()) {
    timerMsToday += overlapMs(session.startedAt, session.endedAt, dayStart, now)
  }
  for (const timer of listTimers()) {
    if (timer.runningSince !== null) {
      timerMsToday += overlapMs(timer.runningSince, now, dayStart, now)
    }
  }

  let appMsToday = 0
  for (const session of listAppUsageSessions()) {
    appMsToday += overlapMs(session.startedAt, session.endedAt, dayStart, now)
  }
  const liveApp = currentAppUsage()
  if (liveApp) {
    appMsToday += overlapMs(liveApp.startedAt, now, dayStart, now)
  }

  const tasksCompletedToday = listTasks().filter(
    (task) => task.status === 'finished' && task.statusChangedAt !== null && task.statusChangedAt >= dayStart
  ).length

  const recentTimers = [...listTimers()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3)

  const lastCompletedTask = [...listTasks()]
    .filter((task) => task.status === 'finished' && task.statusChangedAt !== null)
    .sort((a, b) => (b.statusChangedAt ?? 0) - (a.statusChangedAt ?? 0))[0]

  let recentProject: HomeSummary['recentProject'] = null
  if (lastCompletedTask) {
    const category = listCategories().find((c) => c.id === lastCompletedTask.categoryId)
    const project = category ? listProjects().find((p) => p.id === category.projectId) : undefined
    if (project) {
      recentProject = {
        projectId: project.id,
        projectName: project.name,
        taskName: lastCompletedTask.name,
        completedAt: lastCompletedTask.statusChangedAt ?? 0
      }
    }
  }

  const achievements = describeAchievements(getAchievementProgress())
  const recentAchievements = achievements
    .filter((a) => a.unlockedAt !== null)
    .sort((a, b) => (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0))
    .slice(0, 3)
  const closeAchievements = achievements
    .filter((a) => a.unlockedAt === null)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3)

  return {
    timerMsToday,
    appMsToday,
    tasksCompletedToday,
    recentTimers,
    recentProject,
    recentAchievements,
    closeAchievements
  }
}
