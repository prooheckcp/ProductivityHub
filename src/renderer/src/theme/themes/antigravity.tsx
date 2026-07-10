import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import type { DecorationProps, Gradient } from './types'

const CELL = 46
const JITTER = 0.8
const INFLUENCE_RADIUS = 150
const MAX_DISPLACEMENT = 22
const EASE = 0.12
const HUE_SPAN = 200
const HUE_SPEED = 6 // degrees per second, slow drift across the whole field

type Dot = {
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
      dots = []
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const jitterX = (Math.random() - 0.5) * CELL * JITTER
          const jitterY = (Math.random() - 0.5) * CELL * JITTER
          const x = col * CELL + jitterX
          const y = row * CELL + jitterY
          dots.push({
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
      ctx!.clearRect(0, 0, width, height)
      for (const dot of dots) {
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

        const twinkle = 0.85 + 0.15 * Math.sin(elapsed * 1.4 + dot.phase)
        const hue = (dot.hue + globalHue) % 360
        const lightness = 62 + strength * 20
        const saturation = 70 + strength * 25

        ctx!.beginPath()
        ctx!.arc(dot.x, dot.y, dot.radius + strength * 2.5, 0, Math.PI * 2)
        ctx!.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`
        ctx!.globalAlpha = (0.3 + strength * 0.6) * twinkle
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
