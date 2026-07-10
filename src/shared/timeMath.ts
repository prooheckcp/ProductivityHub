export function currentElapsedMs(
  timer: { accumulatedMs: number; runningSince: number | null },
  now: number
): number {
  return timer.accumulatedMs + (timer.runningSince !== null ? Math.max(0, now - timer.runningSince) : 0)
}

export function currentRemainingMs(
  timer: { remainingMs: number; endsAt: number | null; status: string },
  now: number
): number {
  if (timer.status === 'running' && timer.endsAt !== null) {
    return Math.max(0, timer.endsAt - now)
  }
  return timer.remainingMs
}
