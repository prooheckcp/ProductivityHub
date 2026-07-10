import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import type { DecorationProps, Gradient } from './types'

// A deep, crowded evergreen forest drawn procedurally: three depth layers of
// layered fir trees fading back into atmospheric haze, over a dark forest
// floor, with leaves tumbling down on a gentle wind. The treeline is
// deterministic (seeded RNG) so it stays put across resizes and is cached to
// an offscreen canvas — each frame is just a blit plus the leaf pass.

const TRUNK_COLOR = '#6b4326'
const TRUNK_SHADOW = '#4a2c17'
const TRUNK_HIGHLIGHT = '#835636'
const LEAF_COLORS = ['#5fae5f', '#3f9d54', '#2f8f47', '#e0a53a', '#d9773a', '#c94f2e']

// Each layer is drawn back-to-front. Further layers are smaller, lighter and
// bluer (aerial perspective); the near layer is big, dark and rich.
type Layer = {
  seed: number
  baseline: number // fraction of height where the trees are rooted
  minH: number // tree height as a fraction of viewport height
  maxH: number
  spacing: number // px between trunks (smaller = more crowded)
  colors: [string, string] // [tier fill, shadow side]
  round: number // chance a tree is a rounded broadleaf instead of a fir
}

const LAYERS: Layer[] = [
  { seed: 0x1a2b, baseline: 0.64, minH: 0.2, maxH: 0.3, spacing: 54, colors: ['#8fc4a6', '#78b394'], round: 0.15 },
  { seed: 0x3c4d, baseline: 0.8, minH: 0.3, maxH: 0.42, spacing: 74, colors: ['#3f9160', '#2f7a4c'], round: 0.22 },
  { seed: 0x5e6f, baseline: 0.97, minH: 0.4, maxH: 0.54, spacing: 100, colors: ['#1d5f36', '#12492a'], round: 0.18 }
]

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

type Leaf = {
  x: number
  y: number
  size: number
  rot: number
  spin: number
  fall: number
  sway: number
  swayPhase: number
  flip: number
  color: string
}

function ForestDecoration(_props: DecorationProps): JSX.Element {
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

    let scene: HTMLCanvasElement | null = null
    let leaves: Leaf[] = []

    function drawFir(
      c: CanvasRenderingContext2D,
      x: number,
      baseY: number,
      w: number,
      h: number,
      fill: string,
      shadow: string
    ): void {
      // A tall, chunky log so the trunk reads clearly below the canopy rather
      // than hiding under it.
      const trunkH = Math.max(10, h * 0.26)
      const trunkW = Math.max(5, w * 0.16)
      const tx = x - trunkW / 2
      const ty = baseY - trunkH
      c.fillStyle = TRUNK_COLOR
      c.fillRect(tx, ty, trunkW, trunkH)
      c.fillStyle = TRUNK_HIGHLIGHT
      c.fillRect(tx, ty, trunkW * 0.34, trunkH)
      c.fillStyle = TRUNK_SHADOW
      c.fillRect(tx + trunkW * 0.72, ty, trunkW * 0.28, trunkH)

      const canopyTop = baseY - h
      // Start the canopy just above the top of the trunk so the log stays
      // visible beneath it.
      const canopyBottom = baseY - trunkH * 0.82
      const canopyH = canopyBottom - canopyTop
      // Three overlapping triangular tiers, widest at the bottom, give the
      // classic layered fir silhouette instead of one flat triangle.
      const tiers = 3
      for (let i = 0; i < tiers; i++) {
        const apexY = canopyTop + canopyH * (i / tiers) * 0.5
        const tierBottomY = canopyBottom - canopyH * (i / tiers) * 0.78
        const halfW = (w / 2) * (1 - i * 0.2)
        // shadow half (right side a touch darker for form)
        c.fillStyle = shadow
        c.beginPath()
        c.moveTo(x, apexY)
        c.lineTo(x + halfW, tierBottomY)
        c.lineTo(x, tierBottomY)
        c.closePath()
        c.fill()
        // lit half
        c.fillStyle = fill
        c.beginPath()
        c.moveTo(x, apexY)
        c.lineTo(x - halfW, tierBottomY)
        c.lineTo(x, tierBottomY)
        c.closePath()
        c.fill()
      }
    }

    function drawBroadleaf(
      c: CanvasRenderingContext2D,
      rng: () => number,
      x: number,
      baseY: number,
      w: number,
      h: number,
      fill: string,
      shadow: string
    ): void {
      const trunkH = Math.max(12, h * 0.4)
      const trunkW = Math.max(5, w * 0.16)
      const tx = x - trunkW / 2
      const ty = baseY - trunkH
      c.fillStyle = TRUNK_COLOR
      c.fillRect(tx, ty, trunkW, trunkH)
      c.fillStyle = TRUNK_HIGHLIGHT
      c.fillRect(tx, ty, trunkW * 0.34, trunkH)
      c.fillStyle = TRUNK_SHADOW
      c.fillRect(tx + trunkW * 0.72, ty, trunkW * 0.28, trunkH)
      // A blobby round crown built from overlapping circles.
      const crownY = baseY - trunkH - (h - trunkH) * 0.42
      const r = (h - trunkH) * 0.5
      const puffs = 6
      for (let i = 0; i < puffs; i++) {
        const px = x + (rng() - 0.5) * w * 0.7
        const py = crownY + (rng() - 0.5) * r * 0.9
        const pr = r * (0.5 + rng() * 0.5)
        c.fillStyle = i % 2 === 0 ? fill : shadow
        c.beginPath()
        c.arc(px, py, pr, 0, Math.PI * 2)
        c.fill()
      }
    }

    function buildScene(): HTMLCanvasElement {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const off = document.createElement('canvas')
      off.width = width * dpr
      off.height = height * dpr
      const c = off.getContext('2d')!
      c.setTransform(dpr, 0, 0, dpr, 0, 0)

      LAYERS.forEach((layer, li) => {
        const rng = makeRng(layer.seed)
        const baseY = height * layer.baseline
        if (li < LAYERS.length - 1) {
          // A soft haze band behind each further-back layer reads as depth/mist.
          const haze = c.createLinearGradient(0, baseY - height * layer.maxH, 0, baseY)
          haze.addColorStop(0, 'rgba(255,255,255,0)')
          haze.addColorStop(1, `rgba(235,245,240,${0.14 - li * 0.04})`)
          c.fillStyle = haze
          c.fillRect(0, baseY - height * layer.maxH, width, height * layer.maxH)
        } else {
          // A dark, opaque understory painted *behind* the front row so the
          // trunks stand against forest shadow — never sky showing through the
          // gaps between trees.
          const under = c.createLinearGradient(0, height * 0.73, 0, height * 0.92)
          under.addColorStop(0, 'rgba(13, 48, 26, 0)')
          under.addColorStop(0.6, 'rgba(11, 42, 23, 0.85)')
          under.addColorStop(1, '#0a3a1e')
          c.fillStyle = under
          c.fillRect(0, height * 0.73, width, height - height * 0.73)
        }

        // Overshoot both edges so the treeline never shows a gap at the sides,
        // and jitter each trunk off the grid so it doesn't look planted in rows.
        for (let x = -layer.spacing; x < width + layer.spacing; x += layer.spacing) {
          const jx = x + (rng() - 0.5) * layer.spacing * 0.9
          const h = height * (layer.minH + rng() * (layer.maxH - layer.minH))
          const w = h * (0.62 + rng() * 0.22)
          const by = baseY + (rng() - 0.5) * height * 0.02
          if (rng() < layer.round) {
            drawBroadleaf(c, rng, jx, by, w * 1.1, h, layer.colors[0], layer.colors[1])
          } else {
            drawFir(c, jx, by, w, h, layer.colors[0], layer.colors[1])
          }
        }
      })

      return off
    }

    function spawnLeaf(fresh: boolean): Leaf {
      const r = Math.random
      return {
        x: r() * width,
        y: fresh ? -30 : r() * height,
        size: 6 + r() * 8,
        rot: r() * Math.PI * 2,
        spin: (r() - 0.5) * 0.08,
        fall: 26 + r() * 34,
        sway: 24 + r() * 40,
        swayPhase: r() * Math.PI * 2,
        flip: 0.6 + r() * 0.4,
        color: LEAF_COLORS[Math.floor(r() * LEAF_COLORS.length)]
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

      const leafCount = Math.max(20, Math.min(64, Math.round(width / 24)))
      leaves = Array.from({ length: leafCount }, () => spawnLeaf(false))
    }

    function drawLeaf(l: Leaf): void {
      ctx!.save()
      ctx!.translate(l.x, l.y)
      ctx!.rotate(l.rot)
      // A wobbling horizontal scale makes each leaf tumble as if catching the
      // air, instead of spinning like a flat coin.
      ctx!.scale(Math.cos(l.swayPhase) * l.flip, 1)
      ctx!.globalAlpha = 0.85
      const s = l.size
      ctx!.fillStyle = l.color
      ctx!.beginPath()
      ctx!.moveTo(0, -s)
      ctx!.quadraticCurveTo(s * 0.82, -s * 0.15, 0, s)
      ctx!.quadraticCurveTo(-s * 0.82, -s * 0.15, 0, -s)
      ctx!.closePath()
      ctx!.fill()
      // center vein
      ctx!.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx!.lineWidth = Math.max(0.6, s * 0.08)
      ctx!.beginPath()
      ctx!.moveTo(0, -s * 0.82)
      ctx!.lineTo(0, s * 0.82)
      ctx!.stroke()
      ctx!.restore()
    }

    function tick(now: number): void {
      const elapsed = (now - startTime) / 1000
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now

      ctx!.clearRect(0, 0, width, height)
      if (scene) ctx!.drawImage(scene, 0, 0, width, height)

      const wind = Math.sin(elapsed * 0.35) * 0.6 + 0.4 // gentle gusts
      for (const l of leaves) {
        l.swayPhase += dt * 2.2
        l.y += l.fall * dt
        l.x += Math.sin(l.swayPhase) * l.sway * dt + wind * 18 * dt
        l.rot += l.spin + wind * 0.008
        if (l.y > height + 30 || l.x > width + 40) {
          Object.assign(l, spawnLeaf(true))
        }
        drawLeaf(l)
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

export const forest: Gradient = {
  id: 'forest',
  name: 'Forest 🌲',
  stops: ['#22c55e', '#0ea5e9'],
  contrast: '#ffffff',
  kind: 'effect',
  decoration: 'forest',
  unlockedBy: 'tasks-1',
  cardTint: '#cdf0d9',
  Decoration: ForestDecoration
}
