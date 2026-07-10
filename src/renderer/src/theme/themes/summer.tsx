import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import type { DecorationProps, Gradient } from './types'

// Fallback background (Settings swatch + anything behind the canvas). The live
// scene is painted on the canvas below.
const BACKGROUND_CSS = `linear-gradient(180deg,
  #bae6fd 0%,
  #7dd3fc 30%,
  #38bdf8 44%,
  #0ea5e9 62%,
  #0369a1 74%,
  #f2d08a 76%,
  #f7dd9e 100%)`

// Horizontal fractions of the viewport used to lay the scene out.
const HORIZON = 0.42 // sky meets sea
const SHORE = 0.76 // sea meets sand
const SUN_X = 0.72

const BALL_COLORS = ['#ff5a5f', '#ffd23f', '#3ea7ff', '#37d67a', '#ff8f3f', '#a66bff']

// Ball physics
const GRAVITY = 0.45 // pull while airborne, above the water surface
const BUOYANCY = 0.06 // spring that floats a submerged ball back to the surface
const WATER_DAMP = 0.86 // heavy drag while in the water (splashy settle)
const AIR_DAMP = 0.99

type Ball = {
  // fx/fy are the resting spot as fractions of the scene, kept so a resize can
  // re-place the ball; x/y/vx/vy are the live pixel-space physics state.
  fx: number
  fy: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  phase: number
  angle: number
  av: number // angular velocity
}

function SummerDecoration(_props: DecorationProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = 0
    let height = 0
    let horizonY = 0
    let shoreY = 0
    let sunX = 0
    let sunY = 0
    let frame = 0
    const startTime = performance.now()

    // Beach balls bobbing on the water; x/y/vx/vy are filled in by build().
    const balls: Ball[] = [
      { fx: 0.2, fy: 0.66, size: 22, phase: 0, x: 0, y: 0, vx: 0, vy: 0, angle: 0, av: 0.01 },
      { fx: 0.52, fy: 0.7, size: 17, phase: 1.6, x: 0, y: 0, vx: 0, vy: 0, angle: 0, av: -0.008 },
      { fx: 0.84, fy: 0.64, size: 19, phase: 3.1, x: 0, y: 0, vx: 0, vy: 0, angle: 0, av: 0.006 }
    ]

    function build(): void {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      horizonY = height * HORIZON
      shoreY = height * SHORE
      sunX = width * SUN_X
      sunY = horizonY * 0.5
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      // (re)seat each ball at its resting fraction of the new viewport
      for (const b of balls) {
        b.x = b.fx * width
        b.y = b.fy * height
        b.vx = 0
        b.vy = 0
      }
    }

    function drawSky(): void {
      const grad = ctx!.createLinearGradient(0, 0, 0, horizonY)
      grad.addColorStop(0, '#8fd4f5')
      grad.addColorStop(0.7, '#c7ecff')
      grad.addColorStop(1, '#eafaff')
      ctx!.fillStyle = grad
      ctx!.fillRect(0, 0, width, horizonY)
    }

    function drawSun(elapsed: number): void {
      // soft glow
      const pulse = 1 + Math.sin(elapsed * 0.8) * 0.03
      const glow = ctx!.createRadialGradient(sunX, sunY, 6, sunX, sunY, 120 * pulse)
      glow.addColorStop(0, 'rgba(255, 244, 190, 0.95)')
      glow.addColorStop(0.35, 'rgba(255, 232, 154, 0.5)')
      glow.addColorStop(1, 'rgba(255, 232, 154, 0)')
      ctx!.fillStyle = glow
      ctx!.beginPath()
      ctx!.arc(sunX, sunY, 120 * pulse, 0, Math.PI * 2)
      ctx!.fill()
      // disk
      ctx!.fillStyle = '#fff4c2'
      ctx!.beginPath()
      ctx!.arc(sunX, sunY, 30, 0, Math.PI * 2)
      ctx!.fill()
    }

    function drawSea(): void {
      const grad = ctx!.createLinearGradient(0, horizonY, 0, height)
      grad.addColorStop(0, '#67cdf0')
      grad.addColorStop(0.5, '#1f95cf')
      grad.addColorStop(1, '#0a6ba6')
      ctx!.fillStyle = grad
      ctx!.fillRect(0, horizonY, width, height - horizonY)
    }

    // Rippling wave lines across the sea. Rows near the shore are larger,
    // longer and brighter than the compressed ones near the horizon.
    function drawSeaWaves(elapsed: number): void {
      const rows = 18
      for (let i = 0; i < rows; i++) {
        const t = i / (rows - 1)
        const y = horizonY + (shoreY - horizonY + 24) * t
        const amp = 0.5 + t * t * 5
        const wl = 60 + t * 170
        const speed = 0.3 + t * 0.9
        const dir = i % 2 === 0 ? 1 : -1
        ctx!.beginPath()
        for (let x = 0; x <= width; x += 16) {
          const yy = y + Math.sin(x / wl + elapsed * speed * dir + i) * amp
          if (x === 0) ctx!.moveTo(x, yy)
          else ctx!.lineTo(x, yy)
        }
        ctx!.strokeStyle = `rgba(255,255,255,${0.05 + t * 0.14})`
        ctx!.lineWidth = 1 + t * 1.4
        ctx!.stroke()
      }
    }

    // Shimmering reflection of the sun stretching down the water.
    function drawGlitter(elapsed: number): void {
      for (let y = horizonY + 8; y < shoreY; y += 9) {
        const t = (y - horizonY) / (shoreY - horizonY)
        const spread = 8 + t * 46
        for (let k = -2; k <= 2; k++) {
          const flick = 0.15 + 0.35 * Math.abs(Math.sin(elapsed * 3 + y * 0.4 + k))
          const dx = k * (spread * 0.4) + Math.sin(elapsed * 2 + y + k) * 5
          ctx!.fillStyle = `rgba(255, 245, 205, ${flick * (0.5 - 0.28 * t)})`
          ctx!.fillRect(sunX + dx - spread * 0.12, y, spread * 0.24, 2)
        }
      }
    }

    // The water surface the ball floats on, gently rising and falling with the
    // swell — its equilibrium line for buoyancy.
    function ballRestY(b: Ball, elapsed: number): number {
      return b.fy * height + Math.sin(elapsed * 1.5 + b.phase) * 5
    }

    function updateBall(b: Ball, elapsed: number): void {
      const rest = ballRestY(b, elapsed)
      if (b.y < rest) {
        // airborne — a kicked ball arcs up and falls back
        b.vy += GRAVITY
      } else {
        // submerged — buoyant spring pushes it back up, water drags it calm
        const submersion = b.y - rest
        b.vy -= submersion * BUOYANCY
        b.vy *= WATER_DAMP
        b.vx *= WATER_DAMP
      }
      b.vx *= AIR_DAMP
      b.x += b.vx
      b.y += b.vy

      // bounce off the side walls
      const r = b.size
      if (b.x < r) {
        b.x = r
        b.vx = Math.abs(b.vx) * 0.7
      } else if (b.x > width - r) {
        b.x = width - r
        b.vx = -Math.abs(b.vx) * 0.7
      }
      // never let it sink below the shoreline
      if (b.y > shoreY) {
        b.y = shoreY
        b.vy = Math.min(b.vy, 0)
      }

      b.angle += b.av
      b.av *= 0.985
    }

    function drawBall(b: Ball): void {
      const cx = b.x
      const cy = b.y
      const r = b.size
      ctx!.save()
      ctx!.translate(cx, cy)
      // reflection blob on the water below
      ctx!.globalAlpha = 0.18
      ctx!.fillStyle = '#ffffff'
      ctx!.beginPath()
      ctx!.ellipse(0, r * 0.95, r * 0.9, r * 0.28, 0, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.globalAlpha = 1

      ctx!.rotate(b.angle)
      const wedges = BALL_COLORS.length
      for (let i = 0; i < wedges; i++) {
        ctx!.beginPath()
        ctx!.moveTo(0, 0)
        ctx!.arc(0, 0, r, (i / wedges) * Math.PI * 2, ((i + 1) / wedges) * Math.PI * 2)
        ctx!.closePath()
        ctx!.fillStyle = BALL_COLORS[i]
        ctx!.fill()
      }
      // white hub + rim
      ctx!.fillStyle = '#ffffff'
      ctx!.beginPath()
      ctx!.arc(0, 0, r * 0.24, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx!.lineWidth = 1.5
      ctx!.beginPath()
      ctx!.arc(0, 0, r, 0, Math.PI * 2)
      ctx!.stroke()
      // glossy highlight
      ctx!.fillStyle = 'rgba(255,255,255,0.4)'
      ctx!.beginPath()
      ctx!.arc(-r * 0.35, -r * 0.35, r * 0.22, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.restore()
    }

    // Sand + the foamy waterline washing over it. The whole edge slowly
    // advances and recedes like a tide.
    function drawShore(elapsed: number): void {
      const advance = Math.sin(elapsed * 0.5) * height * 0.02
      const baseY = shoreY + advance
      const edgeY = (x: number): number =>
        baseY + Math.sin(x / 190 + elapsed * 0.8) * 9 + Math.sin(x / 55 - elapsed * 1.3) * 3

      // wet + dry sand
      ctx!.beginPath()
      ctx!.moveTo(0, height)
      ctx!.lineTo(0, edgeY(0))
      for (let x = 0; x <= width; x += 12) ctx!.lineTo(x, edgeY(x))
      ctx!.lineTo(width, height)
      ctx!.closePath()
      const sand = ctx!.createLinearGradient(0, baseY - 20, 0, height)
      sand.addColorStop(0, '#c7a266') // wet sand at the waterline
      sand.addColorStop(0.35, '#e6c983')
      sand.addColorStop(1, '#f7e2a6') // dry sand near the viewer
      ctx!.fillStyle = sand
      ctx!.fill()

      // soft wide foam, then a crisp bright crest along the edge
      const traceEdge = (): void => {
        ctx!.beginPath()
        ctx!.moveTo(0, edgeY(0))
        for (let x = 0; x <= width; x += 12) ctx!.lineTo(x, edgeY(x))
      }
      ctx!.lineCap = 'round'
      traceEdge()
      ctx!.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx!.lineWidth = 14
      ctx!.stroke()
      traceEdge()
      ctx!.strokeStyle = 'rgba(255,255,255,0.9)'
      ctx!.lineWidth = 4
      ctx!.stroke()

      // scattered foam bubbles just onto the sand
      for (let x = 0; x < width; x += 42) {
        const jitter = Math.sin(x * 0.7 + elapsed * 2) * 4
        const by = edgeY(x + 20) + 10 + jitter
        ctx!.fillStyle = 'rgba(255,255,255,0.5)'
        ctx!.beginPath()
        ctx!.arc(x + (Math.sin(x) + 1) * 10, by, 2 + Math.abs(Math.sin(x + elapsed)) * 2, 0, Math.PI * 2)
        ctx!.fill()
      }
    }

    // Tap a ball to whack it: kick it away from the tap point with an upward pop
    // and a bit of spin, so it splashes back down onto the water.
    function onClick(e: MouseEvent): void {
      for (const b of balls) {
        const dx = b.x - e.clientX
        const dy = b.y - e.clientY
        const d = Math.hypot(dx, dy)
        if (d < b.size + 14) {
          const nd = d || 1
          const power = 7
          b.vx += (dx / nd) * power
          b.vy += (dy / nd) * power - 9 // extra upward pop
          b.av += (dx / nd) * 0.25
        }
      }
    }

    function tick(now: number): void {
      const elapsed = (now - startTime) / 1000
      ctx!.clearRect(0, 0, width, height)

      drawSky()
      drawSun(elapsed)
      drawSea()
      drawSeaWaves(elapsed)
      drawGlitter(elapsed)
      for (const b of balls) {
        updateBall(b, elapsed)
        drawBall(b)
      }
      drawShore(elapsed)

      frame = requestAnimationFrame(tick)
    }

    build()
    window.addEventListener('resize', build)
    window.addEventListener('click', onClick)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', build)
      window.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <div className="decoration-overlay" aria-hidden="true">
      <canvas ref={canvasRef} className="decoration-overlay__canvas" />
    </div>
  )
}

export const summer: Gradient = {
  id: 'summer',
  name: 'Summer 🏖️',
  // Used only for the Settings swatch preview — the real scene is canvas-drawn.
  stops: ['#7dd3fc', '#f7dd9e'],
  contrast: '#7a2e0e',
  kind: 'effect',
  decoration: 'summer',
  unlockedBy: 'timerusage-1h',
  backgroundCss: BACKGROUND_CSS,
  cardTint: '#fbe4ae',
  Decoration: SummerDecoration
}
