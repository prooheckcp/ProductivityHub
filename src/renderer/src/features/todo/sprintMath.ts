import type { Project } from '@shared/types'

const DAY_MS = 24 * 60 * 60 * 1000

export function hasSprintConfig(project: Project): boolean {
  return project.sprintSizeDays !== null && project.sprintSizeDays > 0 && project.sprintStartDate !== null
}

/** 1-indexed sprint number "now" falls into, or null if sprints aren't configured or "now" is before the start date. */
export function currentSprintNumber(project: Project, now: number): number | null {
  if (!hasSprintConfig(project)) return null
  const sizeMs = project.sprintSizeDays! * DAY_MS
  const elapsed = now - project.sprintStartDate!
  if (elapsed < 0) return null
  return Math.floor(elapsed / sizeMs) + 1
}

export function sprintDateRange(project: Project, sprintNumber: number): { start: number; end: number } | null {
  if (!hasSprintConfig(project)) return null
  const sizeMs = project.sprintSizeDays! * DAY_MS
  const start = project.sprintStartDate! + (sprintNumber - 1) * sizeMs
  return { start, end: start + sizeMs }
}

export function formatSprintLabel(project: Project, sprintNumber: number): string {
  const range = sprintDateRange(project, sprintNumber)
  if (!range) return `Sprint ${sprintNumber}`
  const fmt = (ms: number): string => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `Sprint ${sprintNumber} (${fmt(range.start)} – ${fmt(range.end)})`
}
