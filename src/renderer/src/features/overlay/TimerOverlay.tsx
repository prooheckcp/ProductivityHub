import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import type { AchievementDef } from '@shared/types'
import { TrophyIcon } from '../../components/icons'
import { ACHIEVEMENT_CATEGORY_ICONS } from '../achievements/categoryIcons'
import CornerTimers from './CornerTimers'
import './overlay.css'

const ACH_VISIBLE_MS = 5000

/**
 * Root of the always-on-top overlay window: the pinned-timer cards plus
 * achievement-unlock popups mirrored from the main window. Reports its content
 * height so the window hugs the content (see overlayWindow.ts).
 */
export default function TimerOverlay(): JSX.Element {
  const [achToasts, setAchToasts] = useState<{ key: string; def: AchievementDef }[]>([])
  const rootRef = useRef<HTMLDivElement>(null)

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

  // Keep the window sized to the cards so it never blocks the desktop and the
  // buttons are always directly clickable (no click-through toggling).
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const report = (): void => window.api.overlay.resize(Math.ceil(el.getBoundingClientRect().height))
    report()
    const ro = new ResizeObserver(report)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="timer-overlay" ref={rootRef}>
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
            <span className="timer-overlay__ach-text">
              <span className="timer-overlay__ach-label">Achievement unlocked</span>
              <span className="timer-overlay__ach-title">{def.title}</span>
            </span>
          </div>
        )
      })}
      <CornerTimers variant="overlay" onOpenTimer={(kind, id) => void window.api.overlay.openTimer(kind, id)} />
    </div>
  )
}
