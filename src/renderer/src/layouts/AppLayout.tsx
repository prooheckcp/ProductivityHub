import type { JSX } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import DecorationOverlay from '../components/DecorationOverlay'
import './AppLayout.css'

export default function AppLayout(): JSX.Element {
  return (
    <div className="app-layout">
      <DecorationOverlay />
      <Sidebar />
      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  )
}
