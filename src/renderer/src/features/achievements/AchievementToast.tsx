import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { AchievementDef } from '@shared/types'
import { TrophyIcon } from '../../components/icons'
import { ACHIEVEMENT_CATEGORY_ICONS } from './categoryIcons'
import './AchievementToast.css'

type Toast = { key: string; def: AchievementDef }

const VISIBLE_MS = 5000

export default function AchievementToast(): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    // First main→renderer push subscription in the app: the main process
    // broadcasts on 'achievements:unlocked' when a threshold is crossed.
    const unsubscribe = window.api.achievements.onUnlocked((defs) => {
      const stamp = Date.now()
      setToasts((prev) => [...prev, ...defs.map((def, i) => ({ key: `${stamp}-${i}-${def.id}`, def }))])
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (toasts.length === 0) return
    const timeout = setTimeout(() => setToasts((prev) => prev.slice(1)), VISIBLE_MS)
    return () => clearTimeout(timeout)
  }, [toasts])

  function dismiss(key: string): void {
    setToasts((prev) => prev.filter((t) => t.key !== key))
  }

  if (toasts.length === 0) return <></>

  return (
    <div className="achievement-toasts">
      {toasts.map((toast) => {
        const CategoryIcon = ACHIEVEMENT_CATEGORY_ICONS[toast.def.category]
        return (
          <button
            type="button"
            key={toast.key}
            className="achievement-toast"
            onClick={() => dismiss(toast.key)}
          >
            <span className="achievement-toast__badge">
              <CategoryIcon size={20} />
              <span className="achievement-toast__trophy">
                <TrophyIcon size={11} />
              </span>
            </span>
            <span className="achievement-toast__text">
              <span className="achievement-toast__label">Achievement unlocked</span>
              <span className="achievement-toast__title">{toast.def.title}</span>
              <span className="achievement-toast__desc">{toast.def.description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
