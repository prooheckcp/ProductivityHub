import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import type { DecorationProps, Gradient } from './types'

// --- Fish behaviour tuning ---------------------------------------------------
const FLEE_RADIUS = 160 // how close the cursor gets before a fish bolts
const FLEE_FORCE = 0.95 // how hard a startled fish accelerates away
const WANDER_FORCE = 0.06 // gentle idle drift so nothing sits still
const SEEK_FORCE = 0.16 // pull toward a food pellet a fish has noticed
const FOOD_SENSE = 380 // radius within which a fish smells the food
const EDGE_MARGIN = 70 // fish start turning back this far from a wall
const EDGE_FORCE = 0.16
const DAMPING = 0.95
const CRUISE_SPEED = 1.7
const FLEE_SPEED = 4.6

// --- Scene tuning ------------------------------------------------------------
const FLOOR_HEIGHT = 64 // sandy bottom band
const FOOD_REST_LIFETIME = 14 // seconds a pellet lingers on the sand before it dissolves
const FOOD_FADE = 2.5 // seconds of fade-out at the end of the rest
const FOOD_SINK_SPEED = 1.4

const FISH_PALETTE = [
  { body: '#ff9f43', fin: '#ff7a1a' }, // clownfish orange
  { body: '#ffd24a', fin: '#f5b400' }, // yellow tang
  { body: '#ff6b8b', fin: '#ff3d6a' }, // coral pink
  { body: '#5ad1c4', fin: '#2bb3a4' }, // teal
  { body: '#7aa8ff', fin: '#4c7dff' }, // blue
  { body: '#c58bff', fin: '#a25cff' } // violet
]

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

type Food = {
  x: number
  y: number
  vy: number
  resting: boolean
  size: number
  restAge: number // only counts up once the pellet has settled on the sand
  eaten: boolean
  color: string
}

type Weed = { x: number; height: number; segs: number; phase: number; width: number }

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function AquariumDecoration(_props: DecorationProps): JSX.Element {
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
    let lastTime = startTime

    let fish: Fish[] = []
    let bubbles: Bubble[] = []
    let weeds: Weed[] = []
    const foods: Food[] = []

    const mouse = { x: -9999, y: -9999 }

    function spawnFish(): Fish {
      const size = rand(11, 22)
      const c = FISH_PALETTE[Math.floor(Math.random() * FISH_PALETTE.length)]
      return {
        x: rand(0, width),
        y: rand(height * 0.15, floorY - 20),
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

    function spawnBubble(fromBottom: boolean): Bubble {
      return {
        x: rand(0, width),
        y: fromBottom ? floorY + rand(0, 30) : rand(0, height),
        r: rand(1.5, 5),
        speed: rand(0.4, 1.3),
        wobble: rand(6, 18),
        phase: rand(0, Math.PI * 2)
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

      const fishCount = Math.max(5, Math.min(14, Math.round(width / 170)))
      fish = Array.from({ length: fishCount }, spawnFish)

      const bubbleCount = Math.max(10, Math.min(40, Math.round(width / 55)))
      bubbles = Array.from({ length: bubbleCount }, () => spawnBubble(false))

      const weedCount = Math.max(3, Math.min(10, Math.round(width / 240)))
      weeds = Array.from({ length: weedCount }, () => ({
        x: rand(20, width - 20),
        height: rand(50, 130),
        segs: 5,
        phase: rand(0, Math.PI * 2),
        width: rand(7, 13)
      }))
    }

    function dropFood(clientX: number, clientY: number): void {
      // A pinch of food: a few pellets scattered around the tap point that
      // start at the cursor and sink to the sand. Cap the total so rapid
      // clicking can't flood the tank.
      const pellets = 3 + Math.floor(Math.random() * 3)
      for (let i = 0; i < pellets && foods.length < 60; i++) {
        foods.push({
          x: clientX + rand(-18, 18),
          y: Math.min(clientY + rand(-10, 10), floorY - 4),
          vy: rand(0.2, 0.8),
          resting: false,
          size: rand(2.2, 3.6),
          restAge: 0,
          eaten: false,
          color: Math.random() > 0.5 ? '#c98a3e' : '#e0a85a'
        })
      }
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
    function onClick(e: MouseEvent): void {
      dropFood(e.clientX, e.clientY)
    }

    // --- rendering helpers ---------------------------------------------------
    function drawRays(elapsed: number): void {
      ctx!.save()
      ctx!.globalCompositeOperation = 'lighter'
      const rays = 4
      for (let i = 0; i < rays; i++) {
        const sway = Math.sin(elapsed * 0.25 + i) * 40
        const topX = ((i + 0.5) / rays) * width + sway
        const grad = ctx!.createLinearGradient(topX, 0, topX + 60, height)
        grad.addColorStop(0, 'rgba(255,255,255,0.10)')
        grad.addColorStop(1, 'rgba(255,255,255,0)')
        ctx!.fillStyle = grad
        ctx!.beginPath()
        ctx!.moveTo(topX - 30, 0)
        ctx!.lineTo(topX + 30, 0)
        ctx!.lineTo(topX + 130, height)
        ctx!.lineTo(topX + 10, height)
        ctx!.closePath()
        ctx!.fill()
      }
      ctx!.restore()
    }

    function drawFloor(): void {
      const grad = ctx!.createLinearGradient(0, floorY - 20, 0, height)
      grad.addColorStop(0, 'rgba(214, 188, 130, 0)')
      grad.addColorStop(0.4, 'rgba(214, 188, 130, 0.45)')
      grad.addColorStop(1, 'rgba(184, 152, 96, 0.85)')
      ctx!.fillStyle = grad
      ctx!.fillRect(0, floorY - 20, width, height - floorY + 20)
    }

    function drawWeed(weed: Weed, elapsed: number): void {
      ctx!.save()
      ctx!.strokeStyle = 'rgba(46, 139, 87, 0.5)'
      ctx!.lineWidth = weed.width
      ctx!.lineCap = 'round'
      ctx!.beginPath()
      ctx!.moveTo(weed.x, height)
      const segLen = weed.height / weed.segs
      for (let s = 1; s <= weed.segs; s++) {
        const t = s / weed.segs
        const bend = Math.sin(elapsed * 1.1 + weed.phase + s * 0.6) * 12 * t
        ctx!.lineTo(weed.x + bend, height - segLen * s)
      }
      ctx!.stroke()
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

      // top + bottom fins
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

    function drawBubble(b: Bubble): void {
      ctx!.beginPath()
      ctx!.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx!.fillStyle = 'rgba(255,255,255,0.12)'
      ctx!.fill()
      ctx!.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx!.lineWidth = 1
      ctx!.stroke()
      // little highlight
      ctx!.beginPath()
      ctx!.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.28, 0, Math.PI * 2)
      ctx!.fillStyle = 'rgba(255,255,255,0.5)'
      ctx!.fill()
    }

    function drawFood(f: Food): void {
      const remaining = FOOD_REST_LIFETIME - f.restAge
      const fade = remaining < FOOD_FADE ? Math.max(0, remaining / FOOD_FADE) : 1
      ctx!.globalAlpha = fade
      ctx!.fillStyle = f.color
      ctx!.beginPath()
      ctx!.arc(f.x, f.y, f.size, 0, Math.PI * 2)
      ctx!.fill()
      ctx!.globalAlpha = 1
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
        f.fleeing = strength
        fx += (dx / md) * strength * FLEE_FORCE
        fy += (dy / md) * strength * FLEE_FORCE
      } else {
        f.fleeing = Math.max(0, f.fleeing - dt * 2)
      }

      // seek the nearest food, unless spooked
      let target: Food | null = null
      let bestDist = FOOD_SENSE
      if (f.fleeing < 0.35) {
        for (const food of foods) {
          if (food.eaten) continue
          const d = Math.hypot(food.x - f.x, food.y - f.y)
          if (d < bestDist) {
            bestDist = d
            target = food
          }
        }
      }

      if (target) {
        const gx = target.x - f.x
        const gy = target.y - f.y
        const gd = Math.hypot(gx, gy) || 1
        fx += (gx / gd) * SEEK_FORCE
        fy += (gy / gd) * SEEK_FORCE
        if (gd < f.size + 6) target.eaten = true // eaten → removed next tick
      } else {
        // idle wander
        f.wander += rand(-0.5, 0.5)
        fx += Math.cos(f.wander) * WANDER_FORCE
        fy += Math.sin(f.wander) * WANDER_FORCE * 0.6
      }

      // stay inside the tank — but let a fish diving for food on the sand
      // ignore the floor "ceiling" so it can actually reach the pellet.
      const divingForFood = target !== null && target.y > floorY - 10
      if (f.x < EDGE_MARGIN) fx += EDGE_FORCE * (1 - f.x / EDGE_MARGIN)
      if (f.x > width - EDGE_MARGIN) fx -= EDGE_FORCE * (1 - (width - f.x) / EDGE_MARGIN)
      if (f.y < EDGE_MARGIN) fy += EDGE_FORCE * (1 - f.y / EDGE_MARGIN)
      if (f.y > floorY - 10 && !divingForFood) fy -= EDGE_FORCE * 1.5

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
      // normally kept just above the sand, but a feeding fish may nose down into it
      const floorLimit = divingForFood ? height - 8 : floorY - 4
      f.y = Math.max(6, Math.min(floorLimit, f.y))

      f.wigglePhase += 0.2 + sp * 0.14
    }

    function updateBubble(b: Bubble): void {
      b.phase += 0.04
      b.y -= b.speed
      b.x += Math.sin(b.phase) * (b.wobble * 0.02)
      if (b.y < -b.r) {
        b.x = rand(0, width)
        b.y = floorY + rand(0, 30)
        b.r = rand(1.5, 5)
        b.speed = rand(0.4, 1.3)
      }
    }

    function updateFood(f: Food, dt: number): void {
      if (!f.resting) {
        f.vy += 0.03
        f.y += Math.min(f.vy, FOOD_SINK_SPEED)
        if (f.y >= floorY + rand(0, FLOOR_HEIGHT * 0.4)) {
          f.y = Math.min(f.y, height - 6)
          f.resting = true
        }
      } else {
        // only start counting toward dissolving once it has settled
        f.restAge += dt
      }
    }

    function tick(now: number): void {
      const elapsed = (now - startTime) / 1000
      const dt = Math.min(0.05, (now - lastTime) / 1000)
      lastTime = now

      ctx!.clearRect(0, 0, width, height)

      drawRays(elapsed)
      drawFloor()
      for (const w of weeds) drawWeed(w, elapsed)

      // occasionally release a fresh bubble from the sand for variety
      if (Math.random() < 0.06 && bubbles.length < 60) bubbles.push(spawnBubble(true))

      for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i]
        if (food.eaten || food.restAge >= FOOD_REST_LIFETIME) {
          foods.splice(i, 1)
          continue
        }
        updateFood(food, dt)
        drawFood(food)
      }

      for (const f of fish) {
        updateFish(f, dt)
        drawFish(f)
      }

      for (const b of bubbles) {
        updateBubble(b)
        drawBubble(b)
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

export const aquarium: Gradient = {
  id: 'aquarium',
  name: 'Aquarium 🐠',
  stops: ['#4fc3d9', '#0a5a7a'],
  contrast: '#ffffff',
  kind: 'effect',
  decoration: 'aquarium',
  unlockedBy: null,
  cardTint: '#e0f4f8',
  Decoration: AquariumDecoration
}
