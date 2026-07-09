import type { JSX } from 'react'
import { ChartIcon, ChecklistIcon, HomeIcon, SettingsIcon, TimerIcon } from './components/icons'
import Home from './pages/Home'
import TimeTracker from './pages/TimeTracker'
import Todo from './pages/Todo'
import Stats from './pages/Stats'
import Settings from './pages/Settings'

export type NavItem = {
  path: string
  label: string
  icon: (props: { size?: number }) => JSX.Element
  element: JSX.Element
}

// Add a new page by appending one entry here — the sidebar and router
// both read from this list, so nothing else needs to change.
export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: HomeIcon, element: <Home /> },
  { path: '/time-tracker', label: 'Time Tracker', icon: TimerIcon, element: <TimeTracker /> },
  { path: '/todo', label: 'To-Do', icon: ChecklistIcon, element: <Todo /> },
  { path: '/stats', label: 'Stats', icon: ChartIcon, element: <Stats /> }
]

// Pinned to the bottom of the sidebar, separate from the main page list.
export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { path: '/settings', label: 'Settings', icon: SettingsIcon, element: <Settings /> }
]
