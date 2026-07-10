import type { JSX } from 'react'
import {
  AlarmIcon,
  AppsIcon,
  ChartIcon,
  ChecklistIcon,
  CodeIcon,
  HomeIcon,
  SettingsIcon,
  TimerIcon,
  TrophyIcon
} from './components/icons'
import Home from './pages/Home'
import TimeTracker from './pages/TimeTracker'
import Todo from './pages/Todo'
import ProjectDetail from './pages/ProjectDetail'
import Clock from './pages/Clock'
import Stats from './pages/Stats'
import Achievements from './pages/Achievements'
import Settings from './pages/Settings'

export type NavChild = {
  path: string
  label: string
  icon: (props: { size?: number }) => JSX.Element
}

export type NavItem = {
  path: string
  label: string
  icon: (props: { size?: number }) => JSX.Element
  element: JSX.Element
  children?: NavChild[]
}

// Add a new page by appending one entry here — the sidebar and router
// both read from this list, so nothing else needs to change.
export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', icon: HomeIcon, element: <Home /> },
  { path: '/time-tracker', label: 'Time Tracker', icon: TimerIcon, element: <TimeTracker /> },
  { path: '/todo', label: 'To-Do', icon: ChecklistIcon, element: <Todo /> },
  {
    path: '/clock',
    label: 'Alarms & Timers',
    icon: AlarmIcon,
    element: <Clock />,
    children: [
      { path: '/clock/alarms', label: 'Alarms', icon: AlarmIcon },
      { path: '/clock/timers', label: 'Timers', icon: TimerIcon }
    ]
  },
  {
    path: '/stats',
    label: 'Stats',
    icon: ChartIcon,
    element: <Stats />,
    children: [
      { path: '/stats/timers', label: 'Timers', icon: TimerIcon },
      { path: '/stats/apps', label: 'Apps', icon: AppsIcon },
      { path: '/stats/todo', label: 'To-Do', icon: ChecklistIcon },
      { path: '/stats/code', label: 'Code', icon: CodeIcon }
    ]
  },
  { path: '/achievements', label: 'Achievements', icon: TrophyIcon, element: <Achievements /> }
]

// Pinned to the bottom of the sidebar, separate from the main page list.
export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { path: '/settings', label: 'Settings', icon: SettingsIcon, element: <Settings /> }
]

// Reachable by navigation (e.g. from within To-Do or a Home quick link), but
// not shown as their own sidebar entry.
export const EXTRA_ROUTES: { path: string; element: JSX.Element }[] = [
  { path: '/todo/:projectId', element: <ProjectDetail /> },
  { path: '/stats/:category', element: <Stats /> },
  { path: '/clock/:view', element: <Clock /> }
]
