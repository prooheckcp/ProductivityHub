import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import type { DecorationProps, Gradient } from './types'

const CELL = 46
const JITTER = 0.8
const INFLUENCE_RADIUS = 200
const MAX_DISPLACEMENT = 42
const EASE = 0.19
const HUE_SPAN = 360 // full rainbow spread across the field
const HUE_SPEED = 30 // degrees per second — lively rainbow drift
// How far (in degrees) a dot's hue is shoved when the cursor is right on it, so
// the color visibly ripples around the pointer, not just brightens.
const HUE_MOUSE_SHIFT = 150
// Spiral swirl: every dot orbits the screen center, but inner dots turn faster
// than outer ones (differential rotation), so the field winds into spiral arms.
// Radians per second.
const SPIRAL_SPEED = 0.16
// How much the orbit slows with distance from center — larger = tighter winding.
const SPIRAL_FALLOFF = 420

type Dot = {
  // Polar anchor around the screen center; the live baseX/baseY are derived
  // from these each frame as the spiral rotates.
  angle: number
  dist: number
  baseX: number
  baseY: number
  x: number
  y: number
  radius: number
  hue: number
  phase: number
}

// A scattered (not grid-aligned) field of colorful dots that get pushed away
// from the cursor and ease back once it moves on — inspired by Google's
// Antigravity page, but leaning into more color: each dot's hue sweeps across
// its position plus a slow global drift, instead of a single flat tint.
// Canvas-driven rather than one DOM node per dot: a full-viewport field is
// several hundred dots, and re-positioning that many React-rendered elements
// every animation frame would be far heavier than redrawing circles on a
// single canvas.
function AntigravityDecoration(_props: DecorationProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let dots: Dot[] = []
    let width = 0
    let height = 0
    let frame = 0
    let startTime = performance.now()
    const mouse = { x: -9999, y: -9999 }

    function buildField(): void {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      const cols = Math.ceil(width / CELL) + 1
      const rows = Math.ceil(height / CELL) + 1
      const cx = width / 2
      const cy = height / 2
      dots = []
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const jitterX = (Math.random() - 0.5) * CELL * JITTER
          const jitterY = (Math.random() - 0.5) * CELL * JITTER
          const x = col * CELL + jitterX
          const y = row * CELL + jitterY
          const rx = x - cx
          const ry = y - cy
          dots.push({
            angle: Math.atan2(ry, rx),
            dist: Math.hypot(rx, ry),
            baseX: x,
            baseY: y,
            x,
            y,
            radius: 1 + Math.random() * 2.2,
            hue: (x / width + y / height) * HUE_SPAN,
            phase: Math.random() * Math.PI * 2
          })
        }
      }
    }

    function handleMouseMove(event: MouseEvent): void {
      mouse.x = event.clientX
      mouse.y = event.clientY
    }

    // 'mouseleave' doesn't fire reliably on window — a relatedTarget of null
    // on 'mouseout' is the reliable signal that the cursor left the window.
    function handleMouseOut(event: MouseEvent): void {
      if (!event.relatedTarget) {
        mouse.x = -9999
        mouse.y = -9999
      }
    }

    function tick(now: number): void {
      const elapsed = (now - startTime) / 1000
      const globalHue = elapsed * HUE_SPEED
      const cx = width / 2
      const cy = height / 2
      ctx!.clearRect(0, 0, width, height)
      for (const dot of dots) {
        // Wind the dot around the center; inner dots turn faster than outer
        // ones, so straight rows curl into slow spiral arms over time.
        const spin = (elapsed * SPIRAL_SPEED * SPIRAL_FALLOFF) / (dot.dist + SPIRAL_FALLOFF)
        dot.baseX = cx + Math.cos(dot.angle + spin) * dot.dist
        dot.baseY = cy + Math.sin(dot.angle + spin) * dot.dist

        const dx = dot.baseX - mouse.x
        const dy = dot.baseY - mouse.y
        const dist = Math.hypot(dx, dy)
        let targetX = dot.baseX
        let targetY = dot.baseY
        let strength = 0
        if (dist < INFLUENCE_RADIUS) {
          strength = 1 - dist / INFLUENCE_RADIUS
          const angle = Math.atan2(dy, dx)
          targetX = dot.baseX + Math.cos(angle) * strength * MAX_DISPLACEMENT
          targetY = dot.baseY + Math.sin(angle) * strength * MAX_DISPLACEMENT
        }
        dot.x += (targetX - dot.x) * EASE
        dot.y += (targetY - dot.y) * EASE

        const twinkle = 0.8 + 0.2 * Math.sin(elapsed * 2.2 + dot.phase)
        // Hue = per-dot base + global rainbow drift + a strong local shove near
        // the cursor, so colors swirl around the pointer.
        const hue = (dot.hue + globalHue + strength * HUE_MOUSE_SHIFT + 360) % 360
        const lightness = 60 + strength * 22
        const saturation = Math.min(100, 82 + strength * 18)

        ctx!.beginPath()
        ctx!.arc(dot.x, dot.y, dot.radius + strength * 3.5, 0, Math.PI * 2)
        ctx!.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
        ctx!.globalAlpha = Math.min(1, (0.45 + strength * 0.55) * twinkle)
        ctx!.fill()
      }
      frame = requestAnimationFrame(tick)
    }

    buildField()
    window.addEventListener('resize', buildField)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseout', handleMouseOut)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', buildField)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseout', handleMouseOut)
    }
  }, [])

  return (
    <div className="decoration-overlay" aria-hidden="true">
      <canvas ref={canvasRef} className="decoration-overlay__canvas" />
    </div>
  )
}

export const antigravity: Gradient = {
  id: 'antigravity',
  name: 'Antigravity ✨',
  stops: ['#150f36', '#4c1d95'],
  contrast: '#ffffff',
  kind: 'effect',
  decoration: 'antigravity',
  unlockedBy: null,
  cardTint: '#ece6fb',
  Decoration: AntigravityDecoration
}
