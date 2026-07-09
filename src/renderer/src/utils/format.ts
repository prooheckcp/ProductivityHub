export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${totalSeconds}s`
}

export type ClockParts = { hh: string; mm: string; ss: string }

export function formatClock(ms: number): ClockParts {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hh = Math.floor(totalSeconds / 3600)
  const mm = Math.floor((totalSeconds % 3600) / 60)
  const ss = totalSeconds % 60
  const pad = (n: number): string => String(n).padStart(2, '0')
  return { hh: pad(hh), mm: pad(mm), ss: pad(ss) }
}

export function clockToMs(hh: number, mm: number, ss: number): number {
  return ((Math.max(0, hh) * 60 + Math.max(0, mm)) * 60 + Math.max(0, ss)) * 1000
}

export type ClockPartsWithCentis = ClockParts & { cs: string }

export function formatClockWithCentis(ms: number): ClockPartsWithCentis {
  const clamped = Math.max(0, ms)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return { ...formatClock(clamped), cs: pad(Math.floor((clamped % 1000) / 10)) }
}
