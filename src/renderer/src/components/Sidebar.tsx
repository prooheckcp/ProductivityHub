import { useState } from 'react'
import type { JSX } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDownIcon, SidebarIcon } from './icons'
import { NAV_ITEMS, SECONDARY_NAV_ITEMS, type NavItem } from '../navigation'
import UserChip from './UserChip'
import logo from '../assets/logo.png'
import logoText from '../assets/logo-text.png'
import './Sidebar.css'

function NavList({ items }: { items: NavItem[] }): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const [manuallyToggled, setManuallyToggled] = useState<Record<string, boolean>>({})

  return (
    <ul className="sidebar__list">
      {items.map(({ path, label, icon: Icon, children }) => {
        const isSectionActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
        const expanded = children ? (manuallyToggled[path] ?? isSectionActive) : false

        return (
          <li key={path}>
            {children ? (
              <button
                type="button"
                className={'sidebar__link sidebar__link--toggle' + (isSectionActive ? ' sidebar__link--active' : '')}
                onClick={() => {
                  setManuallyToggled((prev) => ({ ...prev, [path]: true }))
                  navigate(children[0].path)
                }}
                aria-expanded={expanded}
              >
                <Icon size={18} />
                <span>{label}</span>
                <span
                  className={'sidebar__chevron' + (expanded ? ' sidebar__chevron--open' : '')}
                  onClick={(event) => {
                    event.stopPropagation()
                    setManuallyToggled((prev) => ({ ...prev, [path]: !expanded }))
                  }}
                >
                  <ChevronDownIcon size={13} />
                </span>
              </button>
            ) : (
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
            )}

            {children && expanded && (
              <ul className="sidebar__sublist">
                {children.map((child) => (
                  <li key={child.path}>
                    <NavLink
                      to={child.path}
                      className={({ isActive }) => 'sidebar__sublink' + (isActive ? ' sidebar__sublink--active' : '')}
                    >
                      <child.icon size={14} />
                      <span>{child.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default function Sidebar({ onCollapse }: { onCollapse: () => void }): JSX.Element {
  return (
    <nav className="sidebar">
      <div className="sidebar__top">
        <Link to="/" className="sidebar__brand">
          <img className="sidebar__brand-mark" src={logo} alt="" />
          <img className="sidebar__brand-name" src={logoText} alt="Shiba Tracker" />
        </Link>
        <button type="button" className="sidebar__collapse" onClick={onCollapse} aria-label="Hide sidebar" title="Hide sidebar">
          <SidebarIcon size={16} />
        </button>
      </div>

      <NavList items={NAV_ITEMS} />

      <div className="sidebar__secondary">
        <NavList items={SECONDARY_NAV_ITEMS} />
      </div>

      <UserChip />
    </nav>
  )
}
