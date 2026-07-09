import type { JSX } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import DecorationOverlay from '../components/DecorationOverlay'
import ActiveTimerWidget from '../components/ActiveTimerWidget'
import { TimersProvider } from '../features/timers/TimersContext'
import './AppLayout.css'

export default function AppLayout(): JSX.Element {
  return (
    <TimersProvider>
      <div className="app-layout">
        <DecorationOverlay />
        <Sidebar />
        <main className="app-layout__content">
          <Outlet />
        </main>
        <ActiveTimerWidget />
      </div>
    </TimersProvider>
  )
}
