import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useProfile } from '../auth/ProfileContext'
import { resolveAvatar } from '../assets/avatarTemplates'
import { LogOutIcon, SettingsIcon, UserIcon } from './icons'
import './UserChip.css'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const chars = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)
  return chars.toUpperCase()
}

export default function UserChip(): JSX.Element {
  const { status, user, signOut } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const isGuest = status !== 'authenticated' || !user
  const name = isGuest ? 'Guest' : profile?.username || user?.email || 'Account'
  const subtitle = isGuest ? 'Local only' : user?.email ?? ''
  const avatarUrl = isGuest ? null : resolveAvatar(profile?.avatarUrl ?? null)

  return (
    <div className="user-chip" ref={ref}>
      {open && (
        <div className="user-chip__menu" role="menu">
          <button
            type="button"
            className="user-chip__menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              navigate('/settings')
            }}
          >
            <SettingsIcon size={15} />
            <span>Account settings</span>
          </button>
          <button
            type="button"
            className={'user-chip__menu-item' + (isGuest ? '' : ' user-chip__menu-item--danger')}
            role="menuitem"
            onClick={() => {
              setOpen(false)
              void signOut()
            }}
          >
            {isGuest ? <UserIcon size={15} /> : <LogOutIcon size={15} />}
            <span>{isGuest ? 'Sign in' : 'Log out'}</span>
          </button>
        </div>
      )}

      <button type="button" className="user-chip__button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        <span className="user-chip__avatar">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="user-chip__avatar-fallback">{initials(name)}</span>}
        </span>
        <span className="user-chip__labels">
          <span className="user-chip__name">{name}</span>
          {subtitle && <span className="user-chip__subtitle">{subtitle}</span>}
        </span>
      </button>
    </div>
  )
}
