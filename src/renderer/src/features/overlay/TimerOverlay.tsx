import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import type { AchievementDef, CountdownTimer, Timer } from '@shared/types'
import { currentElapsedMs, currentRemainingMs } from '@shared/timeMath'
import { AlarmIcon, PauseIcon, PinIcon, PlayIcon, TimerIcon, TrophyIcon } from '../../components/icons'
import { ACHIEVEMENT_CATEGORY_ICONS } from '../achievements/categoryIcons'
import './overlay.css'

const POLL_MS = 800
const TICK_MS = 200
const ACH_VISIBLE_MS = 5000

type Item = {
  key: string
  kind: 'timer' | 'countdown'
  id: string
  name: string
  running: boolean
  ms: number
  // Identifies a single run session, so a fresh start after a pause re-shows a
  // previously-unpinned timer. runningSince for count-ups, endsAt for countdowns.
  token: number | null
}

function fmt(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number): string => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export default function TimerOverlay(): JSX.Element {
  const [timers, setTimers] = useState<Timer[]>([])
  const [countdowns, setCountdowns] = useState<CountdownTimer[]>([])
  const [now, setNow] = useState(Date.now())
  const [pinned, setPinned] = useState<Set<string>>(new Set())
  const [achToasts, setAchToasts] = useState<{ key: string; def: AchievementDef }[]>([])
  const [, force] = useState(0)

  const pinnedRef = useRef<Set<string>>(new Set())
  const dismissedRef = useRef<Set<string>>(new Set())
  const prevRunningRef = useRef<Set<string>>(new Set())
  const hoverCountRef = useRef(0)

  async function refresh(): Promise<void> {
    const [t, c] = await Promise.all([window.api.timers.list(), window.api.clock.timers.list()])
    setTimers(t)
    setCountdowns(c)
  }

  useEffect(() => {
    void refresh()
    const poll = setInterval(() => void refresh(), POLL_MS)
    const tick = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => {
      clearInterval(poll)
      clearInterval(tick)
    }
  }, [])

  // Achievement-unlock popups, mirrored onto the overlay so they're visible
  // while the app is in the background (the same 'achievements:unlocked' push
  // the main window listens on).
  useEffect(() => {
    return window.api.achievements.onUnlocked((defs) => {
      const stamp = Date.now()
      setAchToasts((prev) => [...prev, ...defs.map((def, i) => ({ key: `${stamp}-${i}-${def.id}`, def }))])
    })
  }, [])

  useEffect(() => {
    if (achToasts.length === 0) return
    const t = setTimeout(() => setAchToasts((prev) => prev.slice(1)), ACH_VISIBLE_MS)
    return () => clearTimeout(t)
  }, [achToasts])

  const items: Item[] = [
    ...timers.map<Item>((t) => ({
      key: `t:${t.id}`,
      kind: 'timer',
      id: t.id,
      name: t.name,
      running: t.runningSince !== null,
      ms: currentElapsedMs(t, now),
      token: t.runningSince
    })),
    ...countdowns.map<Item>((c) => ({
      key: `c:${c.id}`,
      kind: 'countdown',
      id: c.id,
      name: c.name,
      running: c.status === 'running',
      ms: currentRemainingMs(c, now),
      token: c.endsAt
    }))
  ]

  // Reconcile which cards are shown whenever the running-set / presence changes
  // (not on every clock tick — the signature deliberately omits `ms`).
  const signature = items.map((i) => `${i.key}:${i.running ? 1 : 0}:${i.token ?? '-'}`).join('|')
  useEffect(() => {
    const present = new Set(items.map((i) => i.key))
    const runningNow = new Set(items.filter((i) => i.running).map((i) => i.key))
    const prevRunning = prevRunningRef.current

    const nextDismissed = new Set(dismissedRef.current)
    // A fresh start (was not running, now running) clears any earlier dismissal.
    for (const k of runningNow) if (!prevRunning.has(k)) nextDismissed.delete(k)
    for (const k of [...nextDismissed]) if (!present.has(k)) nextDismissed.delete(k)

    const nextPinned = new Set(pinnedRef.current)
    for (const k of [...nextPinned]) if (!present.has(k)) nextPinned.delete(k)
    for (const i of items) if (i.running && !nextDismissed.has(i.key)) nextPinned.add(i.key)

    dismissedRef.current = nextDismissed
    pinnedRef.current = nextPinned
    prevRunningRef.current = runningNow
    setPinned(nextPinned)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  const visible = items.filter((i) => pinned.has(i.key))

  // Safety: when nothing is shown, make sure the window is fully click-through
  // (a card can vanish while a button is hovered, so its mouseleave never fires).
  useEffect(() => {
    if (visible.length === 0) {
      hoverCountRef.current = 0
      window.api.overlay.setMouseIgnore(true)
    }
  }, [visible.length])

  function enterInteractive(): void {
    hoverCountRef.current += 1
    if (hoverCountRef.current === 1) window.api.overlay.setMouseIgnore(false)
  }
  function leaveInteractive(): void {
    hoverCountRef.current = Math.max(0, hoverCountRef.current - 1)
    if (hoverCountRef.current === 0) window.api.overlay.setMouseIgnore(true)
  }

  async function togglePlay(item: Item): Promise<void> {
    if (item.kind === 'timer') {
      if (item.running) await window.api.timers.pause(item.id)
      else await window.api.timers.start(item.id)
    } else if (item.running) {
      await window.api.clock.timers.pause(item.id)
    } else {
      await window.api.clock.timers.start(item.id)
    }
    await refresh()
  }

  function unpin(item: Item): void {
    const nextP = new Set(pinnedRef.current)
    nextP.delete(item.key)
    const nextD = new Set(dismissedRef.current)
    nextD.add(item.key)
    pinnedRef.current = nextP
    dismissedRef.current = nextD
    setPinned(nextP)
    // The unpinned card unmounts under the cursor, so its button's mouseleave
    // won't fire — reset the click-through state directly.
    hoverCountRef.current = 0
    window.api.overlay.setMouseIgnore(true)
    force((n) => n + 1)
  }

  if (visible.length === 0 && achToasts.length === 0) return <div className="timer-overlay" />

  return (
    <div className="timer-overlay">
      {achToasts.map(({ key, def }) => {
        const CategoryIcon = ACHIEVEMENT_CATEGORY_ICONS[def.category]
        return (
          <div key={key} className="timer-overlay__ach">
            <span className="timer-overlay__ach-badge">
              <CategoryIcon size={16} />
              <span className="timer-overlay__ach-trophy">
                <TrophyIcon size={9} />
              </span>
            </span>
            <span className="timer-overlay__text">
              <span className="timer-overlay__ach-label">Achievement unlocked</span>
              <span className="timer-overlay__name">{def.title}</span>
            </span>
          </div>
        )
      })}
      {visible.map((item) => (
        <div key={item.key} className={'timer-overlay__card' + (item.running ? '' : ' timer-overlay__card--paused')}>
          <span className="timer-overlay__icon">
            {item.kind === 'timer' ? <TimerIcon size={16} /> : <AlarmIcon size={16} />}
          </span>
          <span className="timer-overlay__text">
            <span className="timer-overlay__name">{item.name}</span>
            <span className="timer-overlay__time">{fmt(item.ms)}</span>
          </span>
          <button
            type="button"
            className="timer-overlay__btn"
            onMouseEnter={enterInteractive}
            onMouseLeave={leaveInteractive}
            onClick={() => void togglePlay(item)}
            title={item.running ? 'Pause' : 'Resume'}
            aria-label={item.running ? 'Pause' : 'Resume'}
          >
            {item.running ? <PauseIcon size={13} /> : <PlayIcon size={13} />}
          </button>
          <button
            type="button"
            className="timer-overlay__btn timer-overlay__btn--unpin"
            onMouseEnter={enterInteractive}
            onMouseLeave={leaveInteractive}
            onClick={() => unpin(item)}
            title="Unpin (remove this card)"
            aria-label="Unpin"
          >
            <PinIcon size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
