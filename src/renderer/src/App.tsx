import type { JSX } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import { EXTRA_ROUTES, NAV_ITEMS, SECONDARY_NAV_ITEMS } from './navigation'

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {[...NAV_ITEMS, ...SECONDARY_NAV_ITEMS, ...EXTRA_ROUTES].map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Route>
    </Routes>
  )
}
