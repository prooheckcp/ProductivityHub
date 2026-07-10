import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import type { DecorationProps, Gradient } from './types'

// --- Scene tuning ------------------------------------------------------------
const FLOOR_HEIGHT = 70 // sandy reef bed band
const FLEE_RADIUS = 150 // cursor scare distance for the little fish
const SHARK_SCARE = 220 // fish bolt when the shark gets this close
const EDGE_MARGIN = 70
const EDGE_FORCE = 0.16
const DAMPING = 0.95
const CRUISE_SPEED = 1.6
const FLEE_SPEED = 5

const FISH_PALETTE = [
  { body: '#ff9f43', fin: '#ff7a1a' }, // clownfish orange
  { body: '#ffd24a', fin: '#f5b400' }, // yellow tang
  { body: '#ff6b8b', fin: '#ff3d6a' }, // coral pink
  { body: '#5ad1c4', fin: '#2bb3a4' }, // teal
  { body: '#7aa8ff', fin: '#4c7dff' }, // electric blue
  { body: '#c58bff', fin: '#a25cff' } // violet
]

const CORAL_PALETTE = ['#ff6f91', '#ff9671', '#c780ff', '#ff8fab', '#ffb26b']

type Fish = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  maxSpeed: number
  body: string
  fin: string
  wander: number
  wigglePhase: number
  fleeing: number
}

type Bubble = {
  x: number
  y: number
  r: number
  speed: number
  wobble: number
  phase: number
}

type Coral = {
  x: number
  height: number
  color: string
  spread: number
  phase: number
  branches: number
}

type Shark = {
  x: number
  y: number
  baseY: number
  dir: number // +1 swimming right, -1 swimming left
  speed: number
  size: number
  bob: number
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function UnderwaterDecoration(_props: DecorationProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = 0
    let height = 0
    let floorY = 0
    let frame = 0
    let startTime = performance.now()

    let fish: Fish[] = []
    let bubbles: Bubble[] = []
    let corals: Coral[] = []
    let shark: Shark

    const mouse = { x: -9999, y: -9999 }

    function spawnFish(): Fish {
      const size = rand(9, 18)
      const c = FISH_PALETTE[Math.floor(Math.random() * FISH_PALETTE.length)]
      return {
        x: rand(0, width),
        y: rand(height * 0.12, floorY - 24),
        vx: rand(-1, 1) * CRUISE_SPEED,
        vy: rand(-0.4, 0.4),
        size,
        maxSpeed: CRUISE_SPEED * rand(0.75, 1.25),
        body: c.body,
        fin: c.fin,
        wander: rand(0, Math.PI * 2),
        wigglePhase: rand(0, Math.PI * 2),
        fleeing: 0
      }
    }

    function spawnBubble(x: number, y: number): Bubble {
      return {
        x,
        y,
        r: rand(1.5, 5),
        speed: rand(0.4, 1.3),
        wobble: rand(6, 18),
        phase: rand(0, Math.PI * 2)
      }
    }

    function spawnShark(): Shark {
      const dir = Math.random() > 0.5 ? 1 : -1
      const y = rand(height * 0.2, height * 0.5)
      return {
        x: dir > 0 ? -160 : width + 160,
        y,
        baseY: y,
        dir,
        speed: rand(0.9, 1.4),
        size: rand(46, 60),
        bob: rand(0, Math.PI * 2)
      }
    }

    function build(): void {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      floorY = height - FLOOR_HEIGHT
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      const fishCount = Math.max(6, Math.min(16, Math.round(width / 130)))
      fish = Array.from({ length: fishCount }, spawnFish)

      const bubbleCount = Math.max(10, Math.min(36, Math.round(width / 60)))
      bubbles = Array.from({ length: bubbleCount }, () =>
        spawnBubble(rand(0, width), rand(0, height))
      )

      const coralCount = Math.max(5, Math.min(14, Math.round(width / 150)))
      corals = Array.from({ length: coralCount }, () => ({
        x: rand(24, width - 24),
        height: rand(46, 120),
        color: CORAL_PALETTE[Math.floor(Math.random() * CORAL_PALETTE.length)],
        spread: rand(0.5, 1),
        phase: rand(0, Math.PI * 2),
        branches: 2 + Math.floor(Math.random() * 3)
      }))

      shark = spawnShark()
    }

    // --- input ---------------------------------------------------------------
    function onMove(e: MouseEvent): void {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    // 'mouseleave' is unreliable on window; a null relatedTarget on 'mouseout'
    // is the dependable "cursor left the window" signal.
    function onOut(e: MouseEvent): void {
      if (!e.relatedTarget) {
        mouse.x = -9999
        mouse.y = -9999
      }
    }
    // Every click puffs out a little cluster of bubbles that rise from the point.
    function onClick(e: MouseEvent): void {
      const burst = 6 + Math.floor(Math.random() * 5)
      for (let i = 0; i < burst && bubbles.length < 120; i++) {
        bubbles.push(spawnBubble(e.clientX + rand(-14, 14), e.clientY + rand(-10, 10)))
      }
    }

    // --- rendering helpers ---------------------------------------------------
    // Sunlight beams fanning down from the surface.
    function drawRays(elapsed: number): void {
      ctx!.save()
      ctx!.globalCompositeOperation = 'lighter'
      const rays = 5
      for (let i = 0; i < rays; i++) {
        const sway = Math.sin(elapsed * 0.22 + i * 1.3) * 50
        const topX = ((i + 0.5) / rays) * width + sway
        const grad = ctx!.createLinearGradient(topX, 0, topX + 80, height)
        grad.addColorStop(0, 'rgba(200,240,255,0.16)')
        grad.addColorStop(0.6, 'rgba(200,240,255,0.05)')
        grad.addColorStop(1, 'rgba(200,240,255,0)')
        ctx!.fillStyle = grad
        ctx!.beginPath()
        ctx!.moveTo(topX - 34, 0)
        ctx!.lineTo(topX + 34, 0)
        ctx!.lineTo(topX + 150, height)
        ctx!.lineTo(topX + 10, height)
        ctx!.closePath()
        ctx!.fill()
      }
      ctx!.restore()
    }

    // Darken toward the deep — a vertical shadow that grows toward the floor.
    function drawDepth(): void {
      const grad = ctx!.createLinearGradient(0, 0, 0, height)
      grad.addColorStop(0, 'rgba(2, 20, 46, 0)')
      grad.addColorStop(0.55, 'rgba(2, 18, 44, 0.18)')
      grad.addColorStop(1, 'rgba(1, 10, 28, 0.62)')
      ctx!.fillStyle = grad
      ctx!.fillRect(0, 0, width, height)
    }

    function drawFloor(): void {
      const grad = ctx!.createLinearGradient(0, floorY - 24, 0, height)
      grad.addColorStop(0, 'rgba(38, 60, 84, 0)')
      grad.addColorStop(0.4, 'rgba(30, 48, 70, 0.5)')
      grad.addColorStop(1, 'rgba(16, 28, 46, 0.9)')
      ctx!.fillStyle = grad
      ctx!.fillRect(0, floorY - 24, width, height - floorY + 24)
    }

    // A branching coral: a trunk that splits into a few swaying arms.
    function drawCoral(c: Coral, elapsed: number): void {
      ctx!.save()
      ctx!.strokeStyle = c.color
      ctx!.lineCap = 'round'
      ctx!.lineJoin = 'round'
      const sway = Math.sin(elapsed * 0.8 + c.phase) * 6

      const drawBranch = (
        x: number,
        y: number,
        angle: number,
        len: number,
        wsw: number,
        w: number
      ): void => {
        if (len < 8 || w < 1) return
        const ex = x + Math.cos(angle) * len + wsw
        const ey = y - Math.sin(angle) * len
        ctx!.lineWidth = w
        ctx!.beginPath()
        ctx!.moveTo(x, y)
        ctx!.lineTo(ex, ey)
        ctx!.stroke()
        // rounded knob tip
        ctx!.beginPath()
        ctx!.arc(ex, ey, w * 0.6, 0, Math.PI * 2)
        ctx!.fillStyle = c.color
        ctx!.fill()
        const spreadAng = 0.5 * c.spread
        drawBranch(ex, ey, angle + spreadAng, len * 0.7, wsw * 0.7, w * 0.7)
        drawBranch(ex, ey, angle - spreadAng, len * 0.7, wsw * 0.7, w * 0.7)
      }

      ctx!.globalAlpha = 0.9
      for (let b = 0; b < c.branches; b++) {
        const baseAngle = Math.PI / 2 + (b - (c.branches - 1) / 2) * 0.35
        drawBranch(c.x, height, baseAngle, c.height * 0.5, sway, Math.max(4, c.height * 0.09))
      }
      ctx!.restore()
    }

    function drawFish(f: Fish): void {
      const s = f.size
      const angle = Math.atan2(f.vy, f.vx)
      ctx!.save()
      ctx!.translate(f.x, f.y)
      ctx!.rotate(angle)
      if (Math.abs(angle) > Math.PI / 2) ctx!.scale(1, -1) // keep belly down when facing left
      const wag = Math.sin(f.wigglePhase) * 0.45

      // tail
      ctx!.fillStyle = f.fin
      ctx!.beginPath()
      ctx!.moveTo(-s * 0.75, 0)
      ctx!.lineTo(-s * 1.5, -s * 0.55 + wag * s)
      ctx!.lineTo(-s * 1.5, s * 0.55 + wag * s)
      ctx!.closePath()
      ctx!.fill()

      // dorsal fin
      ctx!.beginPath()
      ctx!.moveTo(-s * 0.1, -s * 0.45)
      ctx!.lineTo(-s * 0.5, -s * 0.95)
      ctx!.lineTo(s * 0.25, -s * 0.4)
      ctx!.closePath()
      ctx!.fill()

      // body
      ctx!.fillStyle = f.body
      ctx!.beginPath()
      ctx!.ellipse(0, 0, s, s * 0.58, 0, 0, Math.PI * 2)
      ctx!.fill()

      // eye
      ctx!.fillStyle = '#ffffff'
      ctx!.beginPath()
      ctx!.arc(s * 0.55, -s * 0.12, s * 0.16, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.fillStyle = '#20303a'
      ctx!.beginPath()
      ctx!.arc(s * 0.6, -s * 0.12, s * 0.08, 0, Math.PI * 2)
      ctx!.fill()

      ctx!.restore()
    }

    function drawShark(sh: Shark): void {
      const s = sh.size
      ctx!.save()
      ctx!.translate(sh.x, sh.y)
      ctx!.scale(sh.dir, 1) // face travel direction
      const wag = Math.sin(sh.bob) * 0.25

      // tail
      ctx!.fillStyle = '#5c6b78'
      ctx!.beginPath()
      ctx!.moveTo(-s * 1.05, 0)
      ctx!.lineTo(-s * 1.55, -s * 0.55 + wag * s)
      ctx!.lineTo(-s * 1.4, 0)
      ctx!.lineTo(-s * 1.55, s * 0.5 + wag * s)
      ctx!.closePath()
      ctx!.fill()

      // dorsal fin
      ctx!.beginPath()
      ctx!.moveTo(-s * 0.1, -s * 0.38)
      ctx!.lineTo(-s * 0.45, -s * 0.9)
      ctx!.lineTo(s * 0.25, -s * 0.34)
      ctx!.closePath()
      ctx!.fill()

      // pectoral fin
      ctx!.beginPath()
      ctx!.moveTo(s * 0.1, s * 0.25)
      ctx!.lineTo(-s * 0.2, s * 0.75)
      ctx!.lineTo(s * 0.35, s * 0.28)
      ctx!.closePath()
      ctx!.fill()

      // body
      ctx!.fillStyle = '#6b7a86'
      ctx!.beginPath()
      ctx!.moveTo(s * 1.15, 0) // snout
      ctx!.quadraticCurveTo(s * 0.4, -s * 0.5, -s * 0.9, -s * 0.16)
      ctx!.quadraticCurveTo(-s * 1.0, 0, -s * 0.9, s * 0.16)
      ctx!.quadraticCurveTo(s * 0.4, s * 0.5, s * 1.15, 0)
      ctx!.closePath()
      ctx!.fill()

      // pale belly
      ctx!.fillStyle = 'rgba(200, 214, 224, 0.55)'
      ctx!.beginPath()
      ctx!.moveTo(s * 1.0, s * 0.06)
      ctx!.quadraticCurveTo(s * 0.3, s * 0.42, -s * 0.8, s * 0.13)
      ctx!.quadraticCurveTo(s * 0.3, s * 0.24, s * 1.0, s * 0.06)
      ctx!.closePath()
      ctx!.fill()

      // gills
      ctx!.strokeStyle = 'rgba(40, 55, 66, 0.5)'
      ctx!.lineWidth = 1.4
      for (let g = 0; g < 3; g++) {
        ctx!.beginPath()
        ctx!.moveTo(s * (0.5 - g * 0.1), -s * 0.18)
        ctx!.lineTo(s * (0.5 - g * 0.1), s * 0.18)
        ctx!.stroke()
      }

      // eye
      ctx!.fillStyle = '#12202b'
      ctx!.beginPath()
      ctx!.arc(s * 0.78, -s * 0.1, s * 0.07, 0, Math.PI * 2)
      ctx!.fill()

      ctx!.restore()
    }

    function drawBubble(b: Bubble): void {
      ctx!.beginPath()
      ctx!.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx!.fillStyle = 'rgba(255,255,255,0.12)'
      ctx!.fill()
      ctx!.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx!.lineWidth = 1
      ctx!.stroke()
      ctx!.beginPath()
      ctx!.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.28, 0, Math.PI * 2)
      ctx!.fillStyle = 'rgba(255,255,255,0.55)'
      ctx!.fill()
    }

    // --- simulation ----------------------------------------------------------
    function updateFish(f: Fish, dt: number): void {
      let fx = 0
      let fy = 0

      // flee the cursor
      const dx = f.x - mouse.x
      const dy = f.y - mouse.y
      const md = Math.hypot(dx, dy)
      if (md < FLEE_RADIUS && md > 0.01) {
        const strength = 1 - md / FLEE_RADIUS
        f.fleeing = Math.max(f.fleeing, strength)
        fx += (dx / md) * strength
        fy += (dy / md) * strength
      }

      // flee the shark, harder
      const sdx = f.x - shark.x
      const sdy = f.y - shark.y
      const sd = Math.hypot(sdx, sdy)
      if (sd < SHARK_SCARE && sd > 0.01) {
        const strength = 1 - sd / SHARK_SCARE
        f.fleeing = Math.max(f.fleeing, strength)
        fx += (sdx / sd) * strength * 1.6
        fy += (sdy / sd) * strength * 1.6
      }

      if (fx === 0 && fy === 0) {
        f.fleeing = Math.max(0, f.fleeing - dt * 2)
        // idle wander
        f.wander += rand(-0.5, 0.5)
        fx += Math.cos(f.wander) * 0.06
        fy += Math.sin(f.wander) * 0.036
      }

      // stay inside the reef
      if (f.x < EDGE_MARGIN) fx += EDGE_FORCE * (1 - f.x / EDGE_MARGIN)
      if (f.x > width - EDGE_MARGIN) fx -= EDGE_FORCE * (1 - (width - f.x) / EDGE_MARGIN)
      if (f.y < EDGE_MARGIN) fy += EDGE_FORCE * (1 - f.y / EDGE_MARGIN)
      if (f.y > floorY - 12) fy -= EDGE_FORCE * 1.5

      f.vx += fx
      f.vy += fy
      f.vx *= DAMPING
      f.vy *= DAMPING

      const max = f.fleeing > 0.05 ? FLEE_SPEED : f.maxSpeed
      const sp = Math.hypot(f.vx, f.vy)
      if (sp > max) {
        f.vx = (f.vx / sp) * max
        f.vy = (f.vy / sp) * max
      }

      f.x += f.vx
      f.y += f.vy
      f.x = Math.max(-30, Math.min(width + 30, f.x))
      f.y = Math.max(6, Math.min(floorY - 4, f.y))
      f.wigglePhase += 0.2 + sp * 0.14
    }

    function updateShark(sh: Shark, elapsed: number): void {
      sh.bob += 0.05
      sh.x += sh.dir * sh.speed
      sh.y = sh.baseY + Math.sin(elapsed * 0.6 + sh.bob) * 14
      // once fully off-screen, loop back in from the other side at a new depth
      if ((sh.dir > 0 && sh.x > width + 180) || (sh.dir < 0 && sh.x < -180)) {
        sh.dir = Math.random() > 0.5 ? 1 : -1
        sh.baseY = rand(height * 0.2, height * 0.5)
        sh.y = sh.baseY
        sh.x = sh.dir > 0 ? -180 : width + 180
        sh.speed = rand(0.9, 1.4)
      }
    }

    function updateBubble(b: Bubble): void {
      b.phase += 0.04
      b.y -= b.speed
      b.x += Math.sin(b.phase) * (b.wobble * 0.02)
      if (b.y < -b.r) {
        b.x = rand(0, width)
        b.y = height + b.r
        b.r = rand(1.5, 5)
        b.speed = rand(0.4, 1.3)
      }
    }

    let lastTime = startTime
    function tick(now: number): void {
      const elapsed = (now - startTime) / 1000
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now

      ctx!.clearRect(0, 0, width, height)

      drawRays(elapsed)
      drawDepth()
      drawFloor()
      for (const c of corals) drawCoral(c, elapsed)

      updateShark(shark, elapsed)
      drawShark(shark)

      for (const f of fish) {
        updateFish(f, dt)
        drawFish(f)
      }

      // trim any click-spawned overflow that has drifted off the top
      for (let i = bubbles.length - 1; i >= 0; i--) {
        updateBubble(bubbles[i])
        drawBubble(bubbles[i])
      }

      frame = requestAnimationFrame(tick)
    }

    build()
    startTime = performance.now()
    lastTime = startTime
    window.addEventListener('resize', build)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseout', onOut)
    window.addEventListener('click', onClick)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', build)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseout', onOut)
      window.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <div className="decoration-overlay" aria-hidden="true">
      <canvas ref={canvasRef} className="decoration-overlay__canvas" />
    </div>
  )
}

export const underwater: Gradient = {
  id: 'underwater',
  name: 'Underwater 🐠',
  stops: ['#3ec6e0', '#062a44'],
  contrast: '#ffffff',
  kind: 'effect',
  decoration: 'underwater',
  unlockedBy: 'timerusage-50h',
  cardTint: '#d3eef6',
  Decoration: UnderwaterDecoration
}
