import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import type { DecorationProps, Gradient } from './types'

// --- Scene tuning ------------------------------------------------------------
// A single large cherry blossom tree drawn procedurally: a recursive, tapering
// branch structure topped with fluffy blossom clusters, over a soft dawn glow,
// with petals drifting off the canopy on a gentle wind. The tree itself is
// deterministic (seeded RNG) so it stays put across resizes; only the petals
// animate, and the static tree is cached to an offscreen canvas so each frame
// is just a blit plus the petal pass.

const TRUNK_COLORS = ['#7a5443', '#6b4436', '#5c3a2e']
// Layered from pale to deep so the canopy reads as soft, sunlit blossom masses
// rather than flat pink blobs.
const BLOSSOM_COLORS = ['#ffe3ef', '#ffc8de', '#f9a8ca', '#f386b0']
const PETAL_COLORS = ['#ffd0e2', '#ffbcd6', '#f9a8ca']

function rand(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min)
}

// Small deterministic PRNG (mulberry32) so the tree's shape is identical on
// every build — resizing shouldn't grow a whole new tree.
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type BlossomPoint = { x: number; y: number; r: number }

type Petal = {
  x: number
  y: number
  size: number
  rot: number
  spin: number
  fall: number
  sway: number
  swayPhase: number
  color: string
}

function SakuraDecoration(_props: DecorationProps): JSX.Element {
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

    // The static tree + glow, pre-rendered once per build.
    let scene: HTMLCanvasElement | null = null
    // Where petals are born (roughly the canopy footprint).
    let canopy = { x: 0, y: 0, w: 0, h: 0 }
    let petals: Petal[] = []

    function drawPetalShape(c: CanvasRenderingContext2D, s: number): void {
      // A single rounded blossom petal with a soft notch at the wide end.
      c.beginPath()
      c.moveTo(0, -s)
      c.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.7, s * 0.6, 0, s)
      c.bezierCurveTo(-s * 0.7, s * 0.6, -s * 0.9, -s * 0.6, 0, -s)
      c.closePath()
      c.fill()
    }

    function drawBlossomCluster(
      c: CanvasRenderingContext2D,
      rng: () => number,
      cx: number,
      cy: number,
      spread: number
    ): void {
      const puffs = 5 + Math.floor(rng() * 5)
      for (let i = 0; i < puffs; i++) {
        const px = cx + rand(rng, -spread, spread)
        const py = cy + rand(rng, -spread, spread)
        const r = rand(rng, spread * 0.5, spread * 1.05)
        const color = BLOSSOM_COLORS[Math.floor(rng() * BLOSSOM_COLORS.length)]
        c.globalAlpha = rand(rng, 0.45, 0.8)
        c.fillStyle = color
        c.beginPath()
        c.arc(px, py, r, 0, Math.PI * 2)
        c.fill()
      }
      // A couple of crisp little five-petal flowers on top for detail.
      const flowers = 1 + Math.floor(rng() * 2)
      for (let f = 0; f < flowers; f++) {
        const fx = cx + rand(rng, -spread, spread)
        const fy = cy + rand(rng, -spread, spread)
        const fs = rand(rng, spread * 0.24, spread * 0.36)
        c.save()
        c.translate(fx, fy)
        c.rotate(rng() * Math.PI)
        c.globalAlpha = 0.9
        c.fillStyle = '#fff2f8'
        for (let p = 0; p < 5; p++) {
          c.save()
          c.rotate((p / 5) * Math.PI * 2)
          drawPetalShape(c, fs)
          c.restore()
        }
        c.globalAlpha = 0.9
        c.fillStyle = '#f9c0d8'
        c.beginPath()
        c.arc(0, 0, fs * 0.32, 0, Math.PI * 2)
        c.fill()
        c.restore()
      }
      c.globalAlpha = 1
    }

    function growBranch(
      c: CanvasRenderingContext2D,
      rng: () => number,
      x: number,
      y: number,
      len: number,
      angle: number,
      lineWidth: number,
      depth: number,
      blossoms: BlossomPoint[]
    ): void {
      // Slight curve on each limb reads far more organic than straight sticks.
      const curve = rand(rng, -0.28, 0.28)
      const midAngle = angle + curve * 0.5
      const ex = x + Math.cos(angle + curve) * len
      const ey = y + Math.sin(angle + curve) * len
      const cx = x + Math.cos(midAngle) * len * 0.5
      const cy = y + Math.sin(midAngle) * len * 0.5

      c.lineWidth = lineWidth
      c.lineCap = 'round'
      c.strokeStyle = TRUNK_COLORS[Math.min(TRUNK_COLORS.length - 1, 3 - Math.min(3, depth))] ?? TRUNK_COLORS[0]
      c.beginPath()
      c.moveTo(x, y)
      c.quadraticCurveTo(cx, cy, ex, ey)
      c.stroke()

      if (depth <= 0 || len < 14) {
        blossoms.push({ x: ex, y: ey, r: rand(rng, 14, 26) })
        return
      }

      // Blossoms also cling along the upper, thinner limbs — not just the tips.
      if (depth <= 2 && rng() < 0.6) {
        blossoms.push({ x: ex, y: ey, r: rand(rng, 12, 20) })
      }

      const children = rng() < 0.35 ? 3 : 2
      for (let i = 0; i < children; i++) {
        const spread = rand(rng, 0.28, 0.62) * (i % 2 === 0 ? 1 : -1)
        const nextLen = len * rand(rng, 0.68, 0.82)
        growBranch(c, rng, ex, ey, nextLen, angle + curve + spread, lineWidth * 0.72, depth - 1, blossoms)
      }
      // Occasional straight-ish continuation keeps the canopy from splitting
      // too symmetrically.
      if (rng() < 0.5) {
        growBranch(c, rng, ex, ey, len * 0.7, angle + curve + rand(rng, -0.15, 0.15), lineWidth * 0.7, depth - 1, blossoms)
      }
    }

    function buildScene(): HTMLCanvasElement {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const off = document.createElement('canvas')
      off.width = width * dpr
      off.height = height * dpr
      const c = off.getContext('2d')!
      c.setTransform(dpr, 0, 0, dpr, 0, 0)

      // --- soft dawn glow behind everything ---
      const glow = c.createRadialGradient(
        width * 0.72,
        height * 0.18,
        0,
        width * 0.72,
        height * 0.18,
        Math.max(width, height) * 0.9
      )
      glow.addColorStop(0, 'rgba(255, 244, 249, 0.55)')
      glow.addColorStop(0.5, 'rgba(255, 224, 238, 0.18)')
      glow.addColorStop(1, 'rgba(255, 224, 238, 0)')
      c.fillStyle = glow
      c.fillRect(0, 0, width, height)

      // --- the tree ---
      const rng = makeRng(0x5a4b12)
      const baseX = width * 0.24
      const baseY = height + 8
      const trunkLen = Math.max(120, height * 0.2)
      // Lean the trunk gently up-and-right so the canopy sprawls across the
      // top of the screen.
      const blossoms: BlossomPoint[] = []
      const depth = width < 720 ? 8 : 9

      // A soft ground shadow anchors the trunk.
      c.save()
      c.globalAlpha = 0.12
      c.fillStyle = '#b25a86'
      c.beginPath()
      c.ellipse(baseX, height - 4, trunkLen * 0.7, 18, 0, 0, Math.PI * 2)
      c.fill()
      c.restore()

      growBranch(c, rng, baseX, baseY, trunkLen, -Math.PI / 2 + 0.18, Math.max(16, trunkLen * 0.14), depth, blossoms)

      // Draw blossom clusters back-to-front-ish; a couple of low fallen-petal
      // drifts on the ground add a finished, lived-in feel.
      const clusterRng = makeRng(0x1f77b4)
      for (const b of blossoms) {
        drawBlossomCluster(c, clusterRng, b.x, b.y, b.r)
      }

      canopy = {
        x: blossoms.reduce((m, b) => Math.min(m, b.x), width),
        y: blossoms.reduce((m, b) => Math.min(m, b.y), height),
        w: 0,
        h: 0
      }
      const maxX = blossoms.reduce((m, b) => Math.max(m, b.x), 0)
      const maxY = blossoms.reduce((m, b) => Math.max(m, b.y), 0)
      canopy.w = Math.max(1, maxX - canopy.x)
      canopy.h = Math.max(1, maxY - canopy.y)

      return off
    }

    function spawnPetal(fresh: boolean): Petal {
      // Petals are born within the canopy footprint and drift down & across.
      const r = Math.random
      const x = canopy.x + r() * canopy.w
      const y = fresh ? -20 : canopy.y + r() * canopy.h
      return {
        x,
        y,
        size: 4 + r() * 4,
        rot: r() * Math.PI * 2,
        spin: (r() - 0.5) * 0.06,
        fall: 22 + r() * 24,
        sway: 18 + r() * 26,
        swayPhase: r() * Math.PI * 2,
        color: PETAL_COLORS[Math.floor(r() * PETAL_COLORS.length)]
      }
    }

    function build(): void {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      scene = buildScene()

      const petalCount = Math.max(24, Math.min(60, Math.round(width / 26)))
      petals = Array.from({ length: petalCount }, () => spawnPetal(false))
    }

    function drawPetal(p: Petal): void {
      ctx!.save()
      ctx!.translate(p.x, p.y)
      ctx!.rotate(p.rot)
      ctx!.globalAlpha = 0.85
      ctx!.fillStyle = p.color
      // reuse the blossom petal shape
      const s = p.size
      ctx!.beginPath()
      ctx!.moveTo(0, -s)
      ctx!.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.7, s * 0.6, 0, s)
      ctx!.bezierCurveTo(-s * 0.7, s * 0.6, -s * 0.9, -s * 0.6, 0, -s)
      ctx!.closePath()
      ctx!.fill()
      ctx!.restore()
    }

    function tick(now: number): void {
      const elapsed = (now - startTime) / 1000
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now

      ctx!.clearRect(0, 0, width, height)
      // Soften the whole tree so it sits behind UI content as an atmospheric
      // backdrop rather than a solid pink wall — page text stays readable.
      if (scene) {
        ctx!.globalAlpha = 0.68
        ctx!.drawImage(scene, 0, 0, width, height)
        ctx!.globalAlpha = 1
      }

      const wind = Math.sin(elapsed * 0.3) * 0.6 + 0.5 // 0..1-ish gentle gusts
      for (const p of petals) {
        p.swayPhase += dt * 1.4
        p.y += p.fall * dt
        p.x += (Math.sin(p.swayPhase) * p.sway * dt) + wind * 14 * dt
        p.rot += p.spin + wind * 0.01
        if (p.y > height + 20 || p.x > width + 30) {
          Object.assign(p, spawnPetal(true))
        }
        drawPetal(p)
      }
      ctx!.globalAlpha = 1

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

export const sakura: Gradient = {
  id: 'sakura',
  name: 'Sakura 🌸',
  // A soft dawn sky — pale cream at the top easing into warm blossom pink —
  // so the hand-drawn cherry tree reads against a real sky rather than a flat
  // wash.
  stops: ['#fff4f8', '#f7b8d2'],
  // A deep rose, picked to pop against the pale pink background.
  contrast: '#c81d63',
  kind: 'effect',
  decoration: 'sakura',
  unlockedBy: 'timers-1',
  cardTint: '#fcd3e4',
  Decoration: SakuraDecoration
}
