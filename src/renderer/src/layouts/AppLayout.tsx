import type { JSX } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import DecorationOverlay from '../components/DecorationOverlay'
import ActiveTimerWidget from '../components/ActiveTimerWidget'
import '../components/FloatingWidgets.css'
import { TimersProvider } from '../features/timers/TimersContext'
import { ClockProvider } from '../features/clock/ClockContext'
import ClockWidgets from '../features/clock/ClockWidgets'
import './AppLayout.css'

export default function AppLayout(): JSX.Element {
  return (
    <TimersProvider>
      <ClockProvider>
        <div className="app-layout">
          <DecorationOverlay />
          <Sidebar />
          <main className="app-layout__content">
            <Outlet />
          </main>
          <div className="floating-widgets">
            <ActiveTimerWidget />
            <ClockWidgets />
          </div>
        </div>
      </ClockProvider>
    </TimersProvider>
  )
}
