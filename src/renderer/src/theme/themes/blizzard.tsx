import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import type { DecorationProps, Gradient } from './types'

// --- Storm tuning ------------------------------------------------------------
const BASE_WIND = 5 // steady horizontal push (positive = blowing right)
const WIND_SWAY = 2.2 // slow oscillation on top of the base wind
const GUST_MAX = 10 // how hard a violent gust can spike
const GUST_EASE = 0.015 // how quickly the wind chases a new gust target
const FALL_MIN = 90 // px/s downward for the most distant flakes
const FALL_SPAN = 240 // extra px/s for the nearest flakes
const STREAK = 0.045 // seconds of motion drawn as a flake's motion-blur streak
// A soft icy blue-white rather than pure white — keeps the storm visible
// without washing out page content sitting in front of the overlay.
const SNOW_RGB = '206, 222, 244'

type Flake = {
  x: number
  y: number
  depth: number // 0 (far, small, slow) → 1 (near, big, fast)
  wobblePhase: number
  wobbleSpeed: number
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function BlizzardDecoration(_props: DecorationProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = 0
    let height = 0
    let frame = 0
    let startTime = performance.now()
    let lastTime = startTime

    let flakes: Flake[] = []
    // Snow piled along the bottom — a bumpy profile that slowly grows as the
    // storm "deposits" snow, capped so it never climbs into page content.
    let drift: number[] = []
    let driftMax = 0

    // wind state — a base sway plus a gust that chases a randomized target so
    // the storm surges and eases unpredictably instead of blowing evenly.
    let gust = 0
    let gustTarget = 0
    let gustCountdown = 0

    function makeFlake(spawnAnywhere: boolean): Flake {
      const depth = Math.pow(Math.random(), 1.5) // bias toward distant flakes
      return {
        x: rand(-40, width),
        y: spawnAnywhere ? rand(0, height) : rand(-height * 0.3, -10),
        depth,
        wobblePhase: rand(0, Math.PI * 2),
        wobbleSpeed: rand(1.5, 4)
      }
    }

    function build(): void {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.max(140, Math.min(420, Math.round((width * height) / 3200)))
      flakes = Array.from({ length: count }, () => makeFlake(true))

      // seed the drift with gentle random bumps; grows toward driftMax over time
      const cols = Math.max(12, Math.round(width / 60))
      driftMax = Math.min(70, height * 0.09)
      drift = Array.from({ length: cols + 1 }, () => rand(6, 16))
    }

    function drawDrift(elapsed: number, dt: number): void {
      if (!drift.length) return
      const step = width / (drift.length - 1)
      ctx!.beginPath()
      ctx!.moveTo(0, height)
      for (let i = 0; i < drift.length; i++) {
        // slowly accumulate toward the cap, with a lazy sway on the surface
        if (drift[i] < driftMax) drift[i] += dt * rand(0.5, 1.6)
        const sway = Math.sin(elapsed * 0.6 + i * 0.7) * 3
        const x = i * step
        const y = height - drift[i] - sway
        if (i === 0) ctx!.lineTo(x, y)
        else {
          // smooth the crest between bumps
          const px = (i - 1) * step
          ctx!.quadraticCurveTo((px + x) / 2, y, x, y)
        }
      }
      ctx!.lineTo(width, height)
      ctx!.closePath()
      const grad = ctx!.createLinearGradient(0, height - driftMax, 0, height)
      grad.addColorStop(0, `rgba(${SNOW_RGB}, 0.42)`)
      grad.addColorStop(1, `rgba(${SNOW_RGB}, 0.62)`)
      ctx!.fillStyle = grad
      ctx!.fill()
    }

    function tick(now: number): void {
      const elapsed = (now - startTime) / 1000
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now

      // pick a fresh gust target every so often, then ease toward it
      gustCountdown -= dt
      if (gustCountdown <= 0) {
        gustTarget = rand(-2, GUST_MAX)
        gustCountdown = rand(0.4, 2.2)
      }
      gust += (gustTarget - gust) * GUST_EASE
      const wind = BASE_WIND + Math.sin(elapsed * 0.6) * WIND_SWAY + gust
      const gustNorm = Math.max(0, Math.min(1, gust / GUST_MAX))

      ctx!.clearRect(0, 0, width, height)

      // faint haze that thickens only slightly during the strongest gusts —
      // kept low so it reads as blowing snow, not a screen-dimming fog
      ctx!.fillStyle = `rgba(${SNOW_RGB}, ${0.008 + gustNorm * 0.03})`
      ctx!.fillRect(0, 0, width, height)

      ctx!.lineCap = 'round'
      for (const p of flakes) {
        const fall = FALL_MIN + p.depth * FALL_SPAN
        p.wobblePhase += dt * p.wobbleSpeed
        const wobble = Math.sin(p.wobblePhase) * 26 * p.depth
        const drift = wind * (35 + p.depth * 95)

        const vx = drift + wobble
        p.x += vx * dt
        p.y += fall * dt

        // wrap around: exit right/bottom, re-enter left/top
        if (p.y > height + 12) {
          p.y = rand(-40, -10)
          p.x = rand(-40, width)
        }
        if (p.x > width + 20) p.x = -20
        else if (p.x < -40) p.x = width + 10

        const alpha = 0.18 + p.depth * 0.34
        ctx!.strokeStyle = `rgba(${SNOW_RGB}, ${alpha})`
        ctx!.lineWidth = 0.6 + p.depth * 2
        ctx!.beginPath()
        ctx!.moveTo(p.x, p.y)
        ctx!.lineTo(p.x - vx * STREAK, p.y - fall * STREAK)
        ctx!.stroke()
      }

      drawDrift(elapsed, dt)

      frame = requestAnimationFrame(tick)
    }

    build()
    startTime = performance.now()
    lastTime = startTime
    window.addEventListener('resize', build)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', build)
    }
  }, [])

  return (
    <div className="decoration-overlay" aria-hidden="true">
      <canvas ref={canvasRef} className="decoration-overlay__canvas" />
    </div>
  )
}

export const blizzard: Gradient = {
  id: 'blizzard',
  name: 'Blizzard 🌨️',
  stops: ['#0a1730', '#33517f'],
  contrast: '#ffffff',
  kind: 'effect',
  decoration: 'blizzard',
  unlockedBy: null,
  cardTint: '#e8eef8',
  Decoration: BlizzardDecoration
}
