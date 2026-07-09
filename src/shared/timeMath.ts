export function currentElapsedMs(
  timer: { accumulatedMs: number; runningSince: number | null },
  now: number
): number {
  return timer.accumulatedMs + (timer.runningSince !== null ? Math.max(0, now - timer.runningSince) : 0)
}
