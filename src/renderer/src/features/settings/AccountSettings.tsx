import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import Card from '../../components/Card'
import Button from '../../components/Button'
import { useAuth } from '../../auth/AuthContext'
import { useProfile } from '../../auth/ProfileContext'
import { COUNTRIES, countryFlag, detectCountryCode } from '@shared/countries'
import { AVATAR_TEMPLATES, resolveAvatar, templateIndex } from '../../assets/avatarTemplates'
import './AccountSettings.css'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const chars = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)
  return chars.toUpperCase()
}

export default function AccountSettings(): JSX.Element {
  const { status, user, signOut } = useAuth()
  const { profile, updateUsername, updateCountry, uploadAvatar, chooseAvatarTemplate } = useProfile()
  const fileRef = useRef<HTMLInputElement>(null)
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setUsername(profile?.username ?? '')
  }, [profile?.username])

  const isGuest = status !== 'authenticated' || !user

  async function onSaveUsername(): Promise<void> {
    setSaving(true)
    setError(null)
    setMessage(null)
    const result = await updateUsername(username)
    setSaving(false)
    if (result.error) setError(result.error)
    else setMessage('Username saved.')
  }

  async function onChangeCountry(code: string): Promise<void> {
    setError(null)
    setMessage(null)
    const result = await updateCountry(code || null)
    if (result.error) setError(result.error)
    else setMessage('Country saved.')
  }

  async function onPickAvatar(file: File | undefined): Promise<void> {
    if (!file) return
    setError(null)
    setMessage(null)
    const result = await uploadAvatar(file)
    if (result.error) setError(result.error)
    else setMessage('Profile picture updated.')
  }

  async function onPickTemplate(index: number): Promise<void> {
    setError(null)
    setMessage(null)
    const result = await chooseAvatarTemplate(index)
    if (result.error) setError(result.error)
    else setMessage('Profile picture updated.')
  }

  if (isGuest) {
    return (
      <Card className="settings__card">
        <h2 className="settings__section-title">Account</h2>
        <p className="settings__section-description">
          You’re using Shiba Track as a guest — your data stays on this computer only. Sign in or
          create an account to back it up and sync your stats and theme across devices.
        </p>
        <div className="settings__data-actions">
          <Button variant="primary" onClick={() => void signOut()}>
            Sign in / create account
          </Button>
        </div>
      </Card>
    )
  }

  const displayName = profile?.username || user?.email || 'Account'

  return (
    <Card className="settings__card">
      <h2 className="settings__section-title">Account</h2>
      <p className="settings__section-description">
        Your stats and theme sync to this account automatically. Machine-specific settings (launch
        at login, the floating overlay) always stay on this device.
      </p>

      <div className="account__identity">
        <button
          type="button"
          className="account__avatar"
          onClick={() => fileRef.current?.click()}
          title="Upload a profile picture"
        >
          {resolveAvatar(profile?.avatarUrl ?? null) ? (
            <img src={resolveAvatar(profile?.avatarUrl ?? null) as string} alt="" />
          ) : (
            <span className="account__avatar-fallback">{initials(displayName)}</span>
          )}
          <span className="account__avatar-edit">Upload</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => void onPickAvatar(e.target.files?.[0])}
        />
        <div className="account__email">
          <span className="account__email-label">Signed in as</span>
          <span className="account__email-value">{user?.email}</span>
        </div>
      </div>

      <p className="settings__label">Choose a picture</p>
      <div className="account__templates">
        {AVATAR_TEMPLATES.map((src, index) => {
          const selected = templateIndex(profile?.avatarUrl ?? null) === index
          return (
            <button
              key={index}
              type="button"
              className={'account__template' + (selected ? ' account__template--selected' : '')}
              onClick={() => void onPickTemplate(index)}
              title={`Template ${index + 1}`}
            >
              <img src={src} alt="" />
            </button>
          )
        })}
      </div>

      <p className="settings__label">Display username</p>
      <div className="account__username-row">
        <input
          className="account__input"
          type="text"
          value={username}
          maxLength={32}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Pick a username"
        />
        <Button variant="secondary" onClick={onSaveUsername} disabled={saving || username.trim() === (profile?.username ?? '')}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <p className="settings__label">Country</p>
      <select
        className="account__input account__select"
        value={profile?.country ?? ''}
        onChange={(e) => void onChangeCountry(e.target.value)}
      >
        <option value="">
          {detectCountryCode() ? `Not set (detected ${countryFlag(detectCountryCode())})` : 'Not set'}
        </option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {countryFlag(c.code)} {c.name}
          </option>
        ))}
      </select>
      <p className="account__hint">Used for the country filter on the coding leaderboards.</p>

      {message && <p className="settings__status">{message}</p>}
      {error && <p className="account__error">{error}</p>}

      <div className="settings__data-actions account__logout">
        <Button variant="secondary" onClick={() => void signOut()}>
          Log out
        </Button>
      </div>
    </Card>
  )
}
