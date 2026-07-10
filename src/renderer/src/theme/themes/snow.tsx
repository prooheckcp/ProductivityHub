import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import type { DecorationProps, Gradient } from './types'

// --- Scene tuning ------------------------------------------------------------
const GRAVITY = 1400 // px/s² pulling puff particles back down
const SNOWBALL_DUR = 0.55 // seconds a thrown snowball spends in the air
const SNOWBALL_ARC = 140 // px of extra height at the top of the throw arc
const PUFF_COUNT = 14 // flecks of snow kicked up when a snowball splats
const FALL_MIN = 26 // px/s downward for the most distant flakes
const FALL_SPAN = 60 // extra px/s for the nearest flakes

// Dusk winter palette — deeper greens and cooler snow so the scene reads as
// twilight rather than midday, letting the tree lights glow.
const TREE_DARK = '#154732'
const TREE_LIGHT = '#1f6144'
const SNOW_WHITE = '#f4f9ff'
const SNOW_SHADE = '#b9cee8'
// Warm string-light colors that cycle bulb-to-bulb down each tree.
const LIGHT_COLORS = ['#ff5a5a', '#ffd24a', '#5ad1ff', '#7dff8a', '#ff8be0']

type Flake = {
  x: number
  y: number
  depth: number // 0 (far, small, slow) → 1 (near, big, fast)
  wobblePhase: number
  wobbleSpeed: number
}

type Tree = { x: number; scale: number; phase: number }
type Star = { x: number; y: number; r: number; phase: number }
type Snowman = { x: number; scale: number; arm: number } // arm: 0 rest → 1 raised

type Snowball = {
  sx: number
  sy: number
  tx: number
  ty: number
  t: number // 0 → 1 progress along the arc
  r: number
}

type Puff = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function SnowDecoration({ tint }: DecorationProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = 0
    let height = 0
    let groundY = 0
    let frame = 0
    let startTime = performance.now()
    let lastTime = startTime

    let flakes: Flake[] = []
    let trees: Tree[] = []
    let snowmen: Snowman[] = []
    let stars: Star[] = []
    let drift: number[] = []
    const snowballs: Snowball[] = []
    const puffs: Puff[] = []

    function makeFlake(spawnAnywhere: boolean): Flake {
      const depth = Math.pow(Math.random(), 1.5)
      return {
        x: rand(0, width),
        y: spawnAnywhere ? rand(0, height) : rand(-height * 0.3, -10),
        depth,
        wobblePhase: rand(0, Math.PI * 2),
        wobbleSpeed: rand(0.6, 1.8)
      }
    }

    function build(): void {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      groundY = height - Math.min(90, height * 0.12)
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.max(60, Math.min(220, Math.round((width * height) / 7000)))
      flakes = Array.from({ length: count }, () => makeFlake(true))

      // a gentle bumpy snow crest along the very bottom
      const cols = Math.max(10, Math.round(width / 70))
      drift = Array.from({ length: cols + 1 }, () => rand(8, 22))

      // scatter a few trees and snowmen across the snowy ground, scaled to the
      // viewport so a wide window gets more scenery than a narrow one.
      const base = Math.max(0.7, Math.min(1.3, width / 1200))
      trees = [
        { x: width * 0.08, scale: base * 1.15, phase: rand(0, Math.PI * 2) },
        { x: width * 0.24, scale: base * 0.85, phase: rand(0, Math.PI * 2) },
        { x: width * 0.72, scale: base * 0.95, phase: rand(0, Math.PI * 2) },
        { x: width * 0.92, scale: base * 1.25, phase: rand(0, Math.PI * 2) }
      ]
      snowmen = [
        { x: width * 0.42, scale: base * 1.0, arm: 0 },
        { x: width * 0.6, scale: base * 0.82, arm: 0 }
      ]

      // faint stars scattered across the upper sky, twinkling out of sync
      const starCount = Math.max(20, Math.min(80, Math.round((width * height) / 26000)))
      stars = Array.from({ length: starCount }, () => ({
        x: rand(0, width),
        y: rand(0, groundY * 0.7),
        r: rand(0.5, 1.6),
        phase: rand(0, Math.PI * 2)
      }))
    }

    // --- drawing -------------------------------------------------------------
    function drawGround(elapsed: number): void {
      if (!drift.length) return
      const step = width / (drift.length - 1)
      ctx!.beginPath()
      ctx!.moveTo(0, height)
      ctx!.lineTo(0, groundY)
      for (let i = 0; i <= drift.length - 1; i++) {
        const sway = Math.sin(elapsed * 0.5 + i * 0.7) * 2
        const x = i * step
        const y = groundY - drift[i] - sway
        if (i === 0) ctx!.lineTo(x, y)
        else {
          const px = (i - 1) * step
          ctx!.quadraticCurveTo((px + x) / 2, y, x, y)
        }
      }
      ctx!.lineTo(width, height)
      ctx!.closePath()
      const grad = ctx!.createLinearGradient(0, groundY - 40, 0, height)
      grad.addColorStop(0, SNOW_WHITE)
      grad.addColorStop(1, SNOW_SHADE)
      ctx!.fillStyle = grad
      ctx!.fill()
    }

    function drawTree(t: Tree, elapsed: number): void {
      const s = t.scale
      const baseY = groundY - 4
      const w = 46 * s // half-width of the widest tier
      const trunkH = 20 * s
      ctx!.save()
      ctx!.translate(t.x, baseY)

      // trunk
      ctx!.fillStyle = '#5c3618'
      ctx!.fillRect(-6 * s, -trunkH, 12 * s, trunkH)

      // three stacked foliage tiers, dark base to light top
      const tiers = [
        { y: -trunkH, w, h: 60 * s, c: TREE_DARK },
        { y: -trunkH - 34 * s, w: w * 0.78, h: 56 * s, c: TREE_LIGHT },
        { y: -trunkH - 66 * s, w: w * 0.54, h: 52 * s, c: TREE_LIGHT }
      ]
      let bulb = 0
      for (const tier of tiers) {
        ctx!.fillStyle = tier.c
        ctx!.beginPath()
        ctx!.moveTo(0, tier.y - tier.h)
        ctx!.lineTo(-tier.w, tier.y)
        ctx!.lineTo(tier.w, tier.y)
        ctx!.closePath()
        ctx!.fill()
        // dusting of snow riding on each tier's shoulders
        ctx!.strokeStyle = 'rgba(244,249,255,0.8)'
        ctx!.lineWidth = 3 * s
        ctx!.lineCap = 'round'
        ctx!.beginPath()
        ctx!.moveTo(-tier.w * 0.85, tier.y - tier.h * 0.12)
        ctx!.quadraticCurveTo(0, tier.y - tier.h * 0.45, tier.w * 0.85, tier.y - tier.h * 0.12)
        ctx!.stroke()

        // string lights: bulbs marched down each slanted edge, twinkling
        for (const dir of [-1, 1]) {
          const n = 4
          for (let i = 1; i <= n; i++) {
            const f = i / (n + 1)
            const bx = dir * tier.w * f
            const by = tier.y - tier.h * (1 - f) + 2 * s
            const color = LIGHT_COLORS[bulb % LIGHT_COLORS.length]
            const twinkle = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(elapsed * 3 + t.phase + bulb * 1.3))
            ctx!.save()
            ctx!.globalAlpha = twinkle
            ctx!.shadowColor = color
            ctx!.shadowBlur = 9 * s
            ctx!.fillStyle = color
            ctx!.beginPath()
            ctx!.arc(bx, by, 2.2 * s, 0, Math.PI * 2)
            ctx!.fill()
            ctx!.restore()
            bulb++
          }
        }
      }

      // glowing star on top
      const topY = -trunkH - 66 * s - 52 * s
      ctx!.save()
      ctx!.shadowColor = '#ffe27a'
      ctx!.shadowBlur = 14 * s
      ctx!.fillStyle = '#ffd54a'
      drawStar(0, topY - 6 * s, 5, 9 * s, 4 * s)
      ctx!.fill()
      ctx!.restore()

      ctx!.restore()
    }

    function drawStar(cx: number, cy: number, spikes: number, outer: number, inner: number): void {
      let rot = -Math.PI / 2
      const step = Math.PI / spikes
      ctx!.beginPath()
      ctx!.moveTo(cx, cy - outer)
      for (let i = 0; i < spikes; i++) {
        ctx!.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer)
        rot += step
        ctx!.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner)
        rot += step
      }
      ctx!.closePath()
    }

    function drawSnowman(m: Snowman): void {
      const s = m.scale
      const baseY = groundY - 4
      ctx!.save()
      ctx!.translate(m.x, baseY)

      const bottomR = 32 * s
      const midR = 23 * s
      const headR = 16 * s
      const bottomCY = -bottomR
      const midCY = bottomCY - bottomR * 0.82 - midR * 0.55
      const headCY = midCY - midR * 0.7 - headR * 0.6

      // soft shadow on the snow
      ctx!.fillStyle = 'rgba(120,150,190,0.18)'
      ctx!.beginPath()
      ctx!.ellipse(0, 2 * s, bottomR * 1.05, 7 * s, 0, 0, Math.PI * 2)
      ctx!.fill()

      // three snowballs
      for (const [cy, r] of [
        [bottomCY, bottomR],
        [midCY, midR],
        [headCY, headR]
      ] as const) {
        const g = ctx!.createRadialGradient(-r * 0.3, cy - r * 0.3, r * 0.2, 0, cy, r)
        g.addColorStop(0, SNOW_WHITE)
        g.addColorStop(1, SNOW_SHADE)
        ctx!.fillStyle = g
        ctx!.beginPath()
        ctx!.arc(0, cy, r, 0, Math.PI * 2)
        ctx!.fill()
      }

      // stick arms — the throwing arm (right) raises as arm → 1
      ctx!.strokeStyle = '#7a4a24'
      ctx!.lineWidth = 2.6 * s
      ctx!.lineCap = 'round'
      // left arm, resting down-ish
      ctx!.beginPath()
      ctx!.moveTo(-midR * 0.6, midCY)
      ctx!.lineTo(-midR * 1.7, midCY - 4 * s)
      ctx!.moveTo(-midR * 1.3, midCY - 2 * s)
      ctx!.lineTo(-midR * 1.6, midCY - 12 * s)
      ctx!.stroke()
      // right arm swings up with the throw
      const swing = m.arm * (Math.PI * 0.75)
      const ax = midR * 0.6
      const ex = ax + Math.cos(-0.2 - swing) * midR * 1.2
      const ey = midCY + Math.sin(-0.2 - swing) * midR * 1.2
      ctx!.beginPath()
      ctx!.moveTo(ax, midCY)
      ctx!.lineTo(ex, ey)
      ctx!.stroke()

      // buttons
      ctx!.fillStyle = '#33475b'
      for (let i = 0; i < 3; i++) {
        ctx!.beginPath()
        ctx!.arc(0, midCY - midR * 0.4 + i * midR * 0.42, 2 * s, 0, Math.PI * 2)
        ctx!.fill()
      }

      // face: eyes + carrot nose + coal smile
      ctx!.fillStyle = '#33475b'
      ctx!.beginPath()
      ctx!.arc(-headR * 0.38, headCY - headR * 0.15, 2.2 * s, 0, Math.PI * 2)
      ctx!.arc(headR * 0.38, headCY - headR * 0.15, 2.2 * s, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.fillStyle = '#ff8b3d'
      ctx!.beginPath()
      ctx!.moveTo(0, headCY)
      ctx!.lineTo(headR * 0.9, headCY + 3 * s)
      ctx!.lineTo(0, headCY + 6 * s)
      ctx!.closePath()
      ctx!.fill()
      ctx!.fillStyle = '#33475b'
      for (let i = -2; i <= 2; i++) {
        ctx!.beginPath()
        ctx!.arc(i * headR * 0.28, headCY + headR * 0.5 + Math.abs(i) * 0.8 * s, 1.3 * s, 0, Math.PI * 2)
        ctx!.fill()
      }

      // scarf
      ctx!.fillStyle = '#d64545'
      ctx!.fillRect(-headR * 0.9, headCY + headR * 0.75, headR * 1.8, 5 * s)
      ctx!.fillRect(headR * 0.4, headCY + headR * 0.75, 6 * s, 16 * s)

      // top hat
      ctx!.fillStyle = '#2a2f38'
      ctx!.fillRect(-headR * 1.05, headCY - headR * 0.95, headR * 2.1, 4 * s)
      ctx!.fillRect(-headR * 0.62, headCY - headR * 1.85, headR * 1.24, headR * 0.95)

      ctx!.restore()
    }

    function drawSnowball(b: Snowball): void {
      const x = b.sx + (b.tx - b.sx) * b.t
      const y = b.sy + (b.ty - b.sy) * b.t - Math.sin(Math.PI * b.t) * SNOWBALL_ARC
      const g = ctx!.createRadialGradient(x - b.r * 0.3, y - b.r * 0.3, b.r * 0.2, x, y, b.r)
      g.addColorStop(0, SNOW_WHITE)
      g.addColorStop(1, SNOW_SHADE)
      ctx!.fillStyle = g
      ctx!.beginPath()
      ctx!.arc(x, y, b.r, 0, Math.PI * 2)
      ctx!.fill()
    }

    function drawPuff(p: Puff): void {
      const a = Math.max(0, p.life / p.maxLife)
      ctx!.fillStyle = `rgba(255,255,255,${a})`
      ctx!.beginPath()
      ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx!.fill()
    }

    // --- interaction ---------------------------------------------------------
    function splat(x: number, y: number): void {
      for (let i = 0; i < PUFF_COUNT; i++) {
        const ang = rand(0, Math.PI * 2)
        const spd = rand(40, 220)
        puffs.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 60,
          life: rand(0.4, 0.9),
          maxLife: 0.9,
          size: rand(1.5, 4)
        })
      }
    }

    function throwSnowball(tx: number, ty: number): void {
      // the snowman nearest the target hurls the snowball, so the throw always
      // reads as coming from a character in the scene.
      let thrower: Snowman | null = null
      let best = Infinity
      for (const m of snowmen) {
        const d = Math.abs(m.x - tx)
        if (d < best) {
          best = d
          thrower = m
        }
      }
      if (!thrower) return
      thrower.arm = 1 // snap the arm up; it eases back down each tick
      const s = thrower.scale
      const handY = groundY - 4 - (32 * s + 20 * s) // roughly the mid-section height
      snowballs.push({
        sx: thrower.x + 20 * s,
        sy: handY,
        tx,
        ty,
        t: 0,
        r: 7 * s
      })
    }

    function onClick(e: MouseEvent): void {
      throwSnowball(e.clientX, e.clientY)
    }

    // --- loop ----------------------------------------------------------------
    function tick(now: number): void {
      const elapsed = (now - startTime) / 1000
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now

      ctx!.clearRect(0, 0, width, height)

      // twinkling stars in the night sky (furthest back)
      for (const st of stars) {
        const tw = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(elapsed * 1.6 + st.phase))
        ctx!.globalAlpha = tw
        ctx!.fillStyle = '#ffffff'
        ctx!.beginPath()
        ctx!.arc(st.x, st.y, st.r, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1

      // far falling snow (behind the scenery)
      ctx!.fillStyle = 'rgba(255,255,255,0.9)'
      for (const p of flakes) {
        if (p.depth >= 0.5) continue
        stepFlake(p, dt)
        ctx!.globalAlpha = 0.35 + p.depth * 0.5
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, 1 + p.depth * 2.2, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1

      drawGround(elapsed)
      for (const t of trees) drawTree(t, elapsed)
      for (const m of snowmen) {
        m.arm = Math.max(0, m.arm - dt * 2.2) // arm eases back to rest
        drawSnowman(m)
      }

      // near falling snow (in front of the scenery)
      ctx!.fillStyle = 'rgba(255,255,255,0.95)'
      for (const p of flakes) {
        if (p.depth < 0.5) continue
        stepFlake(p, dt)
        ctx!.globalAlpha = 0.35 + p.depth * 0.5
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, 1 + p.depth * 2.2, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1

      // snowballs in flight
      for (let i = snowballs.length - 1; i >= 0; i--) {
        const b = snowballs[i]
        b.t += dt / SNOWBALL_DUR
        if (b.t >= 1) {
          splat(b.tx, b.ty)
          snowballs.splice(i, 1)
          continue
        }
        drawSnowball(b)
      }

      // puff particles from splats
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i]
        p.life -= dt
        if (p.life <= 0) {
          puffs.splice(i, 1)
          continue
        }
        p.vy += GRAVITY * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        drawPuff(p)
      }

      frame = requestAnimationFrame(tick)
    }

    function stepFlake(p: Flake, dt: number): void {
      const fall = FALL_MIN + p.depth * FALL_SPAN
      p.wobblePhase += dt * p.wobbleSpeed
      p.x += Math.sin(p.wobblePhase) * 12 * dt
      p.y += fall * dt
      if (p.y > groundY) {
        p.y = rand(-40, -10)
        p.x = rand(0, width)
      }
    }

    build()
    startTime = performance.now()
    lastTime = startTime
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
    <div className="decoration-overlay" aria-hidden="true" style={{ color: tint }}>
      <canvas ref={canvasRef} className="decoration-overlay__canvas" />
    </div>
  )
}

export const snow: Gradient = {
  id: 'snow',
  name: 'Snow ❄️',
  stops: ['#1b2846', '#41608f'],
  contrast: '#eaf2ff',
  kind: 'effect',
  decoration: 'snow',
  unlockedBy: 'timerusage-10h',
  cardTint: '#cfe0f5',
  Decoration: SnowDecoration
}
