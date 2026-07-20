import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { RepeatIcon } from '../../components/icons'
import './RecurringTaskToast.css'

type Toast = { key: string; name: string }

const VISIBLE_MS = 6000

// Mirrors AchievementToast: listens for the main process broadcasting that a
// recurring task has reset and is due again, then shows an in-app popup.
export default function RecurringTaskToast(): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    return window.api.todo.tasks.onRecurringDue((task) => {
      setToasts((prev) => [...prev, { key: `${task.id}-${prev.length}-${task.name}`, name: task.name }])
    })
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
    <div className="recurring-toasts">
      {toasts.map((toast) => (
        <button type="button" key={toast.key} className="recurring-toast" onClick={() => dismiss(toast.key)}>
          <span className="recurring-toast__badge">
            <RepeatIcon size={20} />
          </span>
          <span className="recurring-toast__text">
            <span className="recurring-toast__label">Recurring task due</span>
            <span className="recurring-toast__title">{toast.name}</span>
            <span className="recurring-toast__desc">Time to do it again</span>
          </span>
        </button>
      ))}
    </div>
  )
}
