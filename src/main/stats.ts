import type { CodeStatsEntry, CodeStatsResult, StatsEntry, StatsQuery, StatsResult, TodoStatsResult } from '../shared/types'
import { currentAppUsage } from './appTracker'
import { CATEGORY_AUTO_DETECT_SUPPORTED, getAppCategory } from './appCategory'
import { currentCodingSession } from './codeTracker'
import { listAppUsageSessions } from './store/appUsage'
import { listCodingSessions } from './store/codeSessions'
import { listTimers, listTimerSessions } from './store/timers'
import { listCategories, listProjects, listTasks } from './store/todo'

const RANGE_MS: Record<string, number | null> = {
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  all: null
}

type Interval = {
  key: string
  label: string
  startedAt: number
  endedAt: number
  appName?: string
  appPath?: string | null
}

function overlapMs(interval: Interval, rangeStart: number, rangeEnd: number): number {
  const clampedStart = Math.max(interval.startedAt, rangeStart)
  const clampedEnd = Math.min(interval.endedAt, rangeEnd)
  return Math.max(0, clampedEnd - clampedStart)
}

function sumByKey(intervals: Interval[], rangeStart: number, rangeEnd: number): StatsEntry[] {
  const totals = new Map<string, { label: string; ms: number; appPath: string | null; appName?: string }>()
  for (const interval of intervals) {
    const ms = overlapMs(interval, rangeStart, rangeEnd)
    if (ms <= 0) continue
    const existing = totals.get(interval.key)
    if (existing) {
      existing.ms += ms
      if (!existing.appPath && interval.appPath) existing.appPath = interval.appPath
    } else {
      totals.set(interval.key, {
        label: interval.label,
        ms,
        appPath: interval.appPath ?? null,
        appName: interval.appName
      })
    }
  }
  return Array.from(totals.entries())
    .map(([key, v]) => ({ key, label: v.label, ms: v.ms, appPath: v.appPath }))
    .sort((a, b) => b.ms - a.ms)
}

function buildAppIntervals(): Interval[] {
  const now = Date.now()
  const intervals: Interval[] = listAppUsageSessions().map((session) => ({
    key: session.appName,
    label: session.appName,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    appName: session.appName,
    appPath: session.appPath
  }))
  const live = currentAppUsage()
  if (live) {
    intervals.push({
      key: live.appName,
      label: live.appName,
      startedAt: live.startedAt,
      endedAt: now,
      appName: live.appName,
      appPath: live.appPath
    })
  }
  return intervals
}

async function attachCategories(entries: StatsEntry[]): Promise<StatsEntry[]> {
  return Promise.all(
    entries.map(async (entry) => ({ ...entry, category: await getAppCategory(entry.label, entry.appPath ?? null) }))
  )
}

async function buildCategoryBreakdown(apps: StatsEntry[]): Promise<StatsEntry[]> {
  const totals = new Map<string, number>()
  for (const entry of apps) {
    const category = entry.category ?? 'Uncategorized'
    totals.set(category, (totals.get(category) ?? 0) + entry.ms)
  }
  return Array.from(totals.entries())
    .map(([key, ms]) => ({ key, label: key, ms }))
    .sort((a, b) => b.ms - a.ms)
}

function resolveRange(query: StatsQuery, now: number): { start: number; end: number } {
  if (query.range === 'custom') {
    return { start: query.startMs ?? 0, end: query.endMs ?? now }
  }
  const span = RANGE_MS[query.range]
  return { start: span === null ? -Infinity : now - span, end: now }
}

export async function getStats(query: StatsQuery): Promise<StatsResult> {
  const now = Date.now()
  const { start, end } = resolveRange(query, now)

  const timerIntervals: Interval[] = listTimerSessions().map((session) => ({
    key: session.timerId,
    label: session.timerName,
    startedAt: session.startedAt,
    endedAt: session.endedAt
  }))
  for (const timer of listTimers()) {
    if (timer.runningSince !== null) {
      timerIntervals.push({ key: timer.id, label: timer.name, startedAt: timer.runningSince, endedAt: now })
    }
  }

  const appIntervals = buildAppIntervals()
  const apps = await attachCategories(sumByKey(appIntervals, start, end))
  const appsAllTime = await attachCategories(sumByKey(appIntervals, -Infinity, now))
  const categories = await buildCategoryBreakdown(apps)

  const availableCategories = Array.from(
    new Set(appsAllTime.map((entry) => entry.category ?? 'Uncategorized'))
  ).sort()

  const categoryFilter = query.category ?? null
  const filteredApps = categoryFilter ? apps.filter((entry) => (entry.category ?? 'Uncategorized') === categoryFilter) : apps
  const filteredAppsAllTime = categoryFilter
    ? appsAllTime.filter((entry) => (entry.category ?? 'Uncategorized') === categoryFilter)
    : appsAllTime

  return {
    range: query.range,
    timers: sumByKey(timerIntervals, start, end),
    apps: filteredApps,
    appsAllTime: filteredAppsAllTime,
    categories,
    categorySupport: CATEGORY_AUTO_DETECT_SUPPORTED,
    availableCategories
  }
}

export function getTodoStats(query: StatsQuery): TodoStatsResult {
  const now = Date.now()
  const { start, end } = resolveRange(query, now)

  const categoryToProject = new Map(listCategories().map((c) => [c.id, c.projectId]))
  const projectNames = new Map(listProjects().map((p) => [p.id, p.name]))

  const finishedInRange = listTasks().filter(
    (task) => task.status === 'finished' && task.statusChangedAt !== null && task.statusChangedAt >= start && task.statusChangedAt <= end
  )

  const counts = new Map<string, number>()
  for (const task of finishedInRange) {
    const projectId = categoryToProject.get(task.categoryId) ?? 'unknown'
    counts.set(projectId, (counts.get(projectId) ?? 0) + 1)
  }

  const byProject = Array.from(counts.entries())
    .map(([projectId, count]) => ({ key: projectId, label: projectNames.get(projectId) ?? 'Unknown project', count }))
    .sort((a, b) => b.count - a.count)

  return { totalCompleted: finishedInRange.length, byProject }
}

type CodeInterval = { startedAt: number; endedAt: number; language: string; projectName: string | null; filePath: string; fileName: string }

function sumCodeByKey(
  intervals: CodeInterval[],
  rangeStart: number,
  rangeEnd: number,
  keyOf: (i: CodeInterval) => string,
  labelOf: (i: CodeInterval) => string
): CodeStatsEntry[] {
  const totals = new Map<string, { label: string; ms: number }>()
  for (const interval of intervals) {
    const clampedStart = Math.max(interval.startedAt, rangeStart)
    const clampedEnd = Math.min(interval.endedAt, rangeEnd)
    const ms = Math.max(0, clampedEnd - clampedStart)
    if (ms <= 0) continue
    const key = keyOf(interval)
    const existing = totals.get(key)
    if (existing) existing.ms += ms
    else totals.set(key, { label: labelOf(interval), ms })
  }
  return Array.from(totals.entries())
    .map(([key, v]) => ({ key, label: v.label, ms: v.ms }))
    .sort((a, b) => b.ms - a.ms)
}

function sumCodeByProjectAndFile(
  intervals: CodeInterval[],
  rangeStart: number,
  rangeEnd: number
): Record<string, CodeStatsEntry[]> {
  const byProject = new Map<string, Map<string, { label: string; ms: number; language: string }>>()
  for (const interval of intervals) {
    const clampedStart = Math.max(interval.startedAt, rangeStart)
    const clampedEnd = Math.min(interval.endedAt, rangeEnd)
    const ms = Math.max(0, clampedEnd - clampedStart)
    if (ms <= 0) continue
    const projectKey = interval.projectName ?? 'No project'
    let files = byProject.get(projectKey)
    if (!files) {
      files = new Map()
      byProject.set(projectKey, files)
    }
    const existing = files.get(interval.filePath)
    if (existing) existing.ms += ms
    else files.set(interval.filePath, { label: interval.fileName, ms, language: interval.language })
  }

  const result: Record<string, CodeStatsEntry[]> = {}
  for (const [projectKey, files] of byProject.entries()) {
    result[projectKey] = Array.from(files.entries())
      .map(([key, v]) => ({ key, label: v.label, ms: v.ms, language: v.language }))
      .sort((a, b) => b.ms - a.ms)
  }
  return result
}

export function getCodeStats(query: StatsQuery): CodeStatsResult {
  const now = Date.now()
  const { start, end } = resolveRange(query, now)

  const intervals: CodeInterval[] = listCodingSessions().map((session) => ({
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    language: session.language,
    projectName: session.projectName,
    filePath: session.filePath,
    fileName: session.fileName
  }))
  const live = currentCodingSession()
  if (live) {
    intervals.push({
      startedAt: live.startedAt,
      endedAt: now,
      language: live.language,
      projectName: live.projectName,
      filePath: live.filePath,
      fileName: live.fileName
    })
  }

  const byLanguage = sumCodeByKey(intervals, start, end, (i) => i.language, (i) => i.language)
  const byProject = sumCodeByKey(intervals, start, end, (i) => i.projectName ?? 'No project', (i) => i.projectName ?? 'No project')
  const byProjectFile = sumCodeByProjectAndFile(intervals, start, end)
  const totalMs = byLanguage.reduce((sum, entry) => sum + entry.ms, 0)

  return { totalMs, byLanguage, byProject, byProjectFile }
}
