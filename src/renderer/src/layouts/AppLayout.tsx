import { useCallback, useEffect, useState } from 'react'
import type { JSX } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import DecorationOverlay from '../components/DecorationOverlay'
import { SidebarIcon } from '../components/icons'
import '../components/FloatingWidgets.css'
import { TimersProvider } from '../features/timers/TimersContext'
import { ClockProvider } from '../features/clock/ClockContext'
import ClockWidgets from '../features/clock/ClockWidgets'
import AchievementToast from '../features/achievements/AchievementToast'
import CornerTimers from '../features/overlay/CornerTimers'
import './AppLayout.css'

const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed'

export default function AppLayout(): JSX.Element {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true')
  const navigate = useNavigate()

  // Open a pinned timer in its page — used both by the in-app corner cards and
  // by a card-body click on the floating overlay window (via IPC).
  const openTimer = useCallback(
    (kind: 'timer' | 'countdown', id: string): void => {
      if (kind === 'timer') navigate('/time-tracker', { state: { openTimerId: id } })
      else navigate('/clock/timers')
    },
    [navigate]
  )

  useEffect(() => window.api.overlay.onOpenTimer(openTimer), [openTimer])

  function toggle(): void {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      return next
    })
  }

  return (
    <TimersProvider>
      <ClockProvider>
        <div className={'app-layout' + (collapsed ? ' app-layout--sidebar-collapsed' : '')}>
          <DecorationOverlay />
          <Sidebar onCollapse={toggle} />
          {collapsed && (
            <button
              type="button"
              className="app-layout__sidebar-show"
              onClick={toggle}
              aria-label="Show sidebar"
              title="Show sidebar"
            >
              <SidebarIcon size={18} />
            </button>
          )}
          <main className="app-layout__content">
            <Outlet />
          </main>
          <div className="floating-widgets">
            <CornerTimers variant="app" onOpenTimer={openTimer} />
            <ClockWidgets />
          </div>
          <AchievementToast />
        </div>
      </ClockProvider>
    </TimersProvider>
  )
}
