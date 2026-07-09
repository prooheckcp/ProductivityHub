// Shared helpers for building randomized floating/falling/rising particles —
// used by individual theme decoration components (sakura, snow, underwater,
// summer...). Kept generic so a new theme file can reuse it without
// reimplementing the random-scatter math.

export type Particle = {
  id: number
  left: number
  size: number
  delay: number
  duration: number
  drift: number
}

export function makeParticles(
  count: number,
  sizeRange: [number, number],
  durationRange: [number, number]
): Particle[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    delay: -Math.random() * durationRange[1],
    duration: durationRange[0] + Math.random() * (durationRange[1] - durationRange[0]),
    drift: (Math.random() - 0.5) * 60
  }))
}
