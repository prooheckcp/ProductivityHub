import { useState } from 'react'
import type { JSX } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import DecorationOverlay from '../components/DecorationOverlay'
import ActiveTimerWidget from '../components/ActiveTimerWidget'
import { SidebarIcon } from '../components/icons'
import '../components/FloatingWidgets.css'
import { TimersProvider } from '../features/timers/TimersContext'
import { ClockProvider } from '../features/clock/ClockContext'
import ClockWidgets from '../features/clock/ClockWidgets'
import AchievementToast from '../features/achievements/AchievementToast'
import './AppLayout.css'

const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed'

export default function AppLayout(): JSX.Element {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true')

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
            <ActiveTimerWidget />
            <ClockWidgets />
          </div>
          <AchievementToast />
        </div>
      </ClockProvider>
    </TimersProvider>
  )
}
