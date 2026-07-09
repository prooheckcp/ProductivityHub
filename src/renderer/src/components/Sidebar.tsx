import type { JSX } from 'react'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS, SECONDARY_NAV_ITEMS, type NavItem } from '../navigation'
import logo from '../assets/logo.png'
import './Sidebar.css'

function NavList({ items }: { items: NavItem[] }): JSX.Element {
  return (
    <ul className="sidebar__list">
      {items.map(({ path, label, icon: Icon }) => (
        <li key={path}>
          <NavLink
            to={path}
            end={path === '/'}
            className={({ isActive }) => 'sidebar__link' + (isActive ? ' sidebar__link--active' : '')}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export default function Sidebar(): JSX.Element {
  return (
    <nav className="sidebar">
      <div className="sidebar__brand">
        <img className="sidebar__brand-mark" src={logo} alt="Shiba Tracker" />
        <span className="sidebar__brand-name">Shiba Tracker</span>
      </div>

      <NavList items={NAV_ITEMS} />

      <div className="sidebar__secondary">
        <NavList items={SECONDARY_NAV_ITEMS} />
      </div>
    </nav>
  )
}
