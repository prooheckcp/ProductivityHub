import type { JSX } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import { NAV_ITEMS, SECONDARY_NAV_ITEMS } from './navigation'

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {[...NAV_ITEMS, ...SECONDARY_NAV_ITEMS].map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Route>
    </Routes>
  )
}
