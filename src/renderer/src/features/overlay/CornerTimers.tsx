import { useCallback, useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { CountdownTimer, Timer } from '@shared/types'
import { currentElapsedMs, currentRemainingMs } from '@shared/timeMath'
import { PauseIcon, PinIcon, PlayIcon } from '../../components/icons'
import defaultCover from '../../assets/shiba-clock.png'
import { toFileUrl } from '../../utils/fileUrl'
import { formatClock } from '../../utils/format'
import { useOverlayPins } from './useOverlayPins'
import './cornerTimers.css'

const POLL_MS = 800
const TICK_MS = 200

type Item = {
  key: string
  kind: 'timer' | 'countdown'
  id: string
  name: string
  imagePath: string | null
  running: boolean
  ms: number
  pinned: boolean
}

type CornerTimersProps = {
  /** 'overlay' = floating window (shows PINNED only); 'app' = in-app corner
   *  (shows pinned OR running). */
  variant: 'overlay' | 'app'
  onOpenTimer?: (kind: 'timer' | 'countdown', id: string) => void
}

export default function CornerTimers({ variant, onOpenTimer }: CornerTimersProps): JSX.Element | null {
  const { pins, setPinned } = useOverlayPins()
  const [timers, setTimers] = useState<Timer[]>([])
  const [countdowns, setCountdowns] = useState<CountdownTimer[]>([])
  const [now, setNow] = useState(Date.now())

  const refresh = useCallback((): void => {
    void Promise.all([window.api.timers.list(), window.api.clock.timers.list()]).then(([t, c]) => {
      setTimers(t)
      setCountdowns(c)
    })
  }, [])

  useEffect(() => {
    refresh()
    const poll = setInterval(refresh, POLL_MS)
    const tick = setInterval(() => setNow(Date.now()), TICK_MS)
    // On the overlay window (hidden while the app is focused) the list can be
    // stale by the time it's revealed — refresh the instant it becomes visible.
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') {
        setNow(Date.now())
        refresh()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(poll)
      clearInterval(tick)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  const all: Item[] = [
    ...timers.map<Item>((t) => ({
      key: `t:${t.id}`,
      kind: 'timer',
      id: t.id,
      name: t.name,
      imagePath: t.imagePath,
      running: t.runningSince !== null,
      ms: currentElapsedMs(t, now),
      pinned: pins.has(`t:${t.id}`)
    })),
    ...countdowns.map<Item>((c) => ({
      key: `c:${c.id}`,
      kind: 'countdown',
      id: c.id,
      name: c.name,
      imagePath: null,
      running: c.status === 'running',
      ms: currentRemainingMs(c, now),
      pinned: pins.has(`c:${c.id}`)
    }))
  ]

  // Overlay shows only pinned timers; the in-app corner shows pinned OR running.
  const items = all.filter((i) => (variant === 'overlay' ? i.pinned : i.pinned || i.running))

  // Apply the returned updated timer to local state right away so the icon and
  // clock flip immediately — otherwise the change only shows on the next poll,
  // which felt like a 2-3s lag on the overlay window.
  async function togglePlay(item: Item): Promise<void> {
    if (item.kind === 'timer') {
      const updated = item.running
        ? await window.api.timers.pause(item.id)
        : await window.api.timers.start(item.id)
      if (updated) setTimers((prev) => prev.map((t) => (t.id === item.id ? updated : t)))
    } else {
      const updated = item.running
        ? await window.api.clock.timers.pause(item.id)
        : await window.api.clock.timers.start(item.id)
      if (updated) setCountdowns((prev) => prev.map((c) => (c.id === item.id ? updated : c)))
    }
    setNow(Date.now())
  }

  if (items.length === 0) return null

  return (
    <div className={'corner-timers' + (variant === 'overlay' ? ' corner-timers--overlay' : '')}>
      {items.map((item) => {
        const clock = formatClock(item.ms)
        return (
          <div
            key={item.key}
            className={
              'corner-timer' +
              (variant === 'overlay' ? ' corner-timer--overlay' : '') +
              (onOpenTimer ? ' corner-timer--clickable' : '')
            }
            onClick={() => onOpenTimer?.(item.kind, item.id)}
            role={onOpenTimer ? 'button' : undefined}
            title={onOpenTimer ? 'Open in app' : undefined}
          >
            <span className="corner-timer__cover">
              <img
                src={item.imagePath ? toFileUrl(item.imagePath) : defaultCover}
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = defaultCover
                }}
                alt=""
              />
            </span>
            <span className="corner-timer__info">
              <span className="corner-timer__name">{item.name}</span>
              <span className="corner-timer__clock">
                {item.running && <span className="corner-timer__dot" />}
                {clock.hh}:{clock.mm}:{clock.ss}
              </span>
            </span>
            <button
              type="button"
              className="corner-timer__btn corner-timer__btn--play"
              onClick={(e) => {
                e.stopPropagation()
                void togglePlay(item)
              }}
              aria-label={item.running ? 'Pause' : 'Resume'}
              title={item.running ? 'Pause' : 'Resume'}
            >
              {item.running ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
            </button>
            <button
              type="button"
              className={'corner-timer__btn corner-timer__pin' + (item.pinned ? ' corner-timer__pin--active' : '')}
              onClick={(e) => {
                e.stopPropagation()
                setPinned(item.key, !item.pinned)
              }}
              aria-label={item.pinned ? 'Unpin from overlay' : 'Pin to overlay'}
              aria-pressed={item.pinned}
              title={item.pinned ? 'Unpin from overlay' : 'Pin to overlay'}
            >
              <PinIcon size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
