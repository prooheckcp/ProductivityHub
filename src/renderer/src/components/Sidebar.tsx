import type { JSX } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { NAV_ITEMS, SECONDARY_NAV_ITEMS, type NavItem } from '../navigation'
import logo from '../assets/logo.png'
import logoText from '../assets/logo-text.png'
import './Sidebar.css'

function NavList({ items }: { items: NavItem[] }): JSX.Element {
  return (
    <ul className="sidebar__list">
      {items.map(({ path, label, icon: Icon }) => (
        <li key={path}>
          <NavLink
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              'sidebar__link' +
              (isActive ? ' sidebar__link--active' : '') +
              (path === '/settings' ? ' sidebar__link--gear' : '')
            }
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
      <Link to="/" className="sidebar__brand">
        <img className="sidebar__brand-mark" src={logo} alt="" />
        <img className="sidebar__brand-name" src={logoText} alt="Shiba Tracker" />
      </Link>

      <NavList items={NAV_ITEMS} />

      <div className="sidebar__secondary">
        <NavList items={SECONDARY_NAV_ITEMS} />
      </div>
    </nav>
  )
}
