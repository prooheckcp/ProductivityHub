import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import type { Profile } from '@shared/types'
import { randomUsername } from '@shared/usernames'
import { resolveCountry } from '@shared/countries'
import { randomTemplateToken, templateToken } from '../assets/avatarTemplates'
import { supabase } from '../supabase/client'
import { useAuth } from './AuthContext'

type ProfileContextValue = {
  profile: Profile | null
  loading: boolean
  updateUsername: (username: string) => Promise<{ error: string | null }>
  updateCountry: (country: string | null) => Promise<{ error: string | null }>
  uploadAvatar: (file: File) => Promise<{ error: string | null }>
  chooseAvatarTemplate: (index: number) => Promise<{ error: string | null }>
  refresh: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

// A username the DB trigger auto-assigned (shiba_<8 hex>) — replaced with a fun
// random one on first login.
const DEFAULT_USERNAME_RE = /^shiba_[0-9a-f]{8}$/i

export function ProfileProvider({ children }: { children: ReactNode }): JSX.Element {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const initializedForUser = useRef<string | null>(null)
  const countryAttempted = useRef<string | null>(null)

  const load = useCallback(async (): Promise<void> => {
    if (!user) {
      setProfile(null)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, country')
      .eq('id', user.id)
      .maybeSingle()
    setProfile(
      data
        ? { id: data.id, username: data.username, avatarUrl: data.avatar_url, country: data.country }
        : { id: user.id, username: null, avatarUrl: null, country: null }
    )
    setLoading(false)
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  const updateUsername = useCallback(
    async (username: string): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not signed in.' }
      const trimmed = username.trim()
      if (!trimmed) return { error: 'Username cannot be empty.' }
      // upsert (not update) so it also works for accounts created before the
      // profiles auto-create trigger existed — the row is created if missing.
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, username: trimmed, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      if (error) {
        // 23505 = unique_violation
        if (error.code === '23505') return { error: 'That username is already taken.' }
        return { error: error.message }
      }
      setProfile((prev) => (prev ? { ...prev, username: trimmed } : prev))
      return { error: null }
    },
    [user]
  )

  const updateCountry = useCallback(
    async (country: string | null): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not signed in.' }
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, country, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      if (error) return { error: error.message }
      setProfile((prev) => (prev ? { ...prev, country } : prev))
      return { error: null }
    },
    [user]
  )

  const setAvatarValue = useCallback(
    async (value: string): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not signed in.' }
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, avatar_url: value, updated_at: new Date().toISOString() }, { onConflict: 'id' })
      if (error) return { error: error.message }
      setProfile((prev) => (prev ? { ...prev, avatarUrl: value } : prev))
      return { error: null }
    },
    [user]
  )

  const chooseAvatarTemplate = useCallback(
    (index: number) => setAvatarValue(templateToken(index)),
    [setAvatarValue]
  )

  const uploadAvatar = useCallback(
    async (file: File): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not signed in.' }
      // Fixed path per user (upsert) so we never accumulate orphaned files; a
      // cache-busting query param on the stored URL forces the new image to show.
      const path = `${user.id}/avatar`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) return { error: uploadError.message }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      return setAvatarValue(`${data.publicUrl}?t=${Date.now()}`)
    },
    [user, setAvatarValue]
  )

  // First-time cosmetic setup: give a new account a random username + template
  // avatar. The localStorage flag is set ONLY after a write succeeds, so a
  // failed attempt (e.g. the profiles table not created yet) retries next login.
  useEffect(() => {
    if (!user || !profile) return
    const flagKey = `profile-initialized-${user.id}`
    if (localStorage.getItem(flagKey) || initializedForUser.current === user.id) return
    initializedForUser.current = user.id

    void (async () => {
      let touchedRow = false
      if (!profile.username || DEFAULT_USERNAME_RE.test(profile.username)) {
        for (let attempt = 0; attempt < 5; attempt++) {
          const result = await updateUsername(randomUsername())
          if (!result.error) {
            touchedRow = true
            break
          }
        }
      } else {
        touchedRow = true
      }
      if (!profile.avatarUrl) {
        const result = await setAvatarValue(randomTemplateToken())
        if (!result.error) touchedRow = true
      }
      // Only remember we initialized if the profile row was actually reachable.
      if (touchedRow) localStorage.setItem(flagKey, '1')
      else initializedForUser.current = null // allow a retry next render/login
    })()
  }, [user, profile, updateUsername, setAvatarValue])

  // Auto-detect country (OS locale → IP) whenever it's unset. Attempted once per
  // session; if it fails (offline / table missing) it retries on the next login.
  useEffect(() => {
    if (!user || !profile || profile.country) return
    if (countryAttempted.current === user.id) return
    countryAttempted.current = user.id
    void (async () => {
      const country = await resolveCountry()
      if (!country) {
        countryAttempted.current = null
        return
      }
      const result = await updateCountry(country)
      if (result.error) countryAttempted.current = null // retry later
    })()
  }, [user, profile, updateCountry])

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading,
      updateUsername,
      updateCountry,
      uploadAvatar,
      chooseAvatarTemplate,
      refresh: () => void load()
    }),
    [profile, loading, updateUsername, updateCountry, uploadAvatar, chooseAvatarTemplate, load]
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile must be used within a ProfileProvider')
  return context
}
