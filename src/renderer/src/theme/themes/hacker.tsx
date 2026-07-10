import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import type { DecorationProps, Gradient } from './types'

const GLYPHS = '01$#/\\<>{}[]()+-=*^%!&|;:,.?~ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const FONT_SIZE = 16
const MONOSPACE = '"SF Mono", Menlo, Consolas, monospace'

const COMMANDS = [
  '$ git commit -m "fix bug"',
  '$ npm run build',
  '$ sudo rm -rf node_modules',
  '$ ls -la',
  '> Compiling...',
  '$ docker ps -a',
  '$ ssh user@10.0.0.1',
  '> Build succeeded ✓',
  '$ git push origin main',
  '$ python manage.py runserver',
  '> 200 OK',
  '$ curl -X GET /api/v1/users',
  '$ cd ~/projects/app',
  '$ npm install --save-dev',
  '> Tests passed (42/42)',
  '$ echo $PATH',
  '$ chmod +x deploy.sh',
  '$ kubectl get pods'
]

type Column = { y: number; speed: number; brightness: number }

type CommandLine = {
  text: string
  x: number
  y: number
  revealed: number
  alpha: number
  phase: 'typing' | 'holding' | 'fading'
  holdUntil: number
  charTimer: number
}

function randomColumn(): Column {
  return { y: Math.random() * -100, speed: 0.25 + Math.random() * 0.35, brightness: 0.5 + Math.random() * 0.5 }
}

function randomCommand(width: number, height: number): CommandLine {
  return {
    text: COMMANDS[Math.floor(Math.random() * COMMANDS.length)],
    x: Math.random() * Math.max(0, width - 300),
    y: Math.random() * height,
    revealed: 0,
    alpha: 0,
    phase: 'typing',
    holdUntil: 0,
    charTimer: 0
  }
}

function HackerDecoration({ tint }: DecorationProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let columns: Column[] = []
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    function resize(): void {
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      const columnCount = Math.ceil(width / FONT_SIZE)
      columns = Array.from({ length: columnCount }, randomColumn)
    }
    resize()
    window.addEventListener('resize', resize)

    const commandLines: CommandLine[] = Array.from({ length: 3 }, () => randomCommand(width, height))
    let lastTime = performance.now()
    let raf = 0

    function draw(time: number): void {
      const dt = time - lastTime
      lastTime = time

      // Never fully clears — a translucent wash over the previous frame is
      // what produces the fading trail behind each falling glyph.
      ctx!.fillStyle = 'rgba(2, 6, 4, 0.08)'
      ctx!.fillRect(0, 0, width, height)

      ctx!.textBaseline = 'top'
      ctx!.font = `${FONT_SIZE}px ${MONOSPACE}`
      for (let i = 0; i < columns.length; i++) {
        const column = columns[i]
        const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        const y = column.y * FONT_SIZE
        ctx!.globalAlpha = column.brightness
        ctx!.fillStyle = tint
        ctx!.fillText(glyph, i * FONT_SIZE, y)
        ctx!.globalAlpha = 1

        column.y += column.speed
        if (y > height && Math.random() > 0.975) columns[i] = randomColumn()
      }

      ctx!.font = `13px ${MONOSPACE}`
      for (const line of commandLines) {
        line.charTimer += dt
        if (line.phase === 'typing') {
          line.alpha = Math.min(1, line.alpha + dt / 400)
          if (line.charTimer > 35) {
            line.charTimer = 0
            line.revealed += 1
            if (line.revealed >= line.text.length) {
              line.phase = 'holding'
              line.holdUntil = time + 2200
            }
          }
        } else if (line.phase === 'holding') {
          if (time > line.holdUntil) line.phase = 'fading'
        } else {
          line.alpha -= dt / 900
          if (line.alpha <= 0) Object.assign(line, randomCommand(width, height))
        }

        ctx!.globalAlpha = Math.max(0, Math.min(1, line.alpha)) * 0.55
        ctx!.fillStyle = tint
        ctx!.fillText(line.text.slice(0, line.revealed), line.x, line.y)
        ctx!.globalAlpha = 1
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [tint])

  return (
    <div className="decoration-overlay" aria-hidden="true">
      <canvas ref={canvasRef} className="decoration-overlay__canvas" />
    </div>
  )
}

export const hacker: Gradient = {
  id: 'hacker',
  name: 'Hacker Mode 💻',
  stops: ['#020604', '#0c2a17'],
  contrast: '#39ff88',
  kind: 'effect',
  decoration: 'hacker',
  // Unlocked by the 250-hour developer-tools achievement (src/shared/achievements.ts).
  unlockedBy: 'devtools-250h',
  cardTint: '#b8f0cd',
  Decoration: HackerDecoration
}
