import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { JSX, ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../supabase/client'
import { bundleHasData, pullRemote, pushRemote, startPushEngine, type RemoteData } from '../sync/syncEngine'

// Gate states that decide what the app shell renders:
//  - loading:  still resolving the persisted session/identity
//  - needs-auth: show the login screen
//  - guest / authenticated: render the app
export type AuthStatus = 'loading' | 'needs-auth' | 'guest' | 'authenticated'

export type OAuthProvider = 'google' | 'github'

export type SignResult = { error: string | null; needsConfirmation?: boolean }

type AuthContextValue = {
  status: AuthStatus
  user: User | null
  supabaseEnabled: boolean
  authError: string | null
  uploadPromptOpen: boolean
  resolveUploadPrompt: (upload: boolean) => void
  signInWithPassword: (email: string, password: string) => Promise<SignResult>
  signUp: (email: string, password: string) => Promise<SignResult>
  signInWithOAuth: (provider: OAuthProvider) => Promise<SignResult>
  continueAsGuest: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Full reload is only used for logout (back to the login screen). The login
// path mounts the app in-place instead — the app tree isn't mounted while the
// login screen shows, so flipping status to 'authenticated' mounts it fresh
// against the account's data dir. Long-lived providers that DON'T remount
// (ThemeProvider) listen for this event to re-read after the dir switch.
function notifyDataReloaded(): void {
  window.dispatchEvent(new Event('app:data-reloaded'))
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [uploadResolver, setUploadResolver] = useState<((upload: boolean) => void) | null>(null)

  // Opens the "upload local data?" modal and resolves once the user answers.
  const askUpload = useCallback((): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setUploadResolver(() => (upload: boolean) => {
        setUploadResolver(null)
        resolve(upload)
      })
    })
  }, [])

  // Switch to the account's data dir, reconcile local vs cloud, then mount the
  // app. Captures the guest bundle BEFORE switching identity (current dir is
  // guest). Existing cloud data is adopted; a new/empty account offers to seed
  // the cloud from local (guest) data.
  const completeLogin = useCallback(
    async (u: User): Promise<void> => {
      const guestBundle = await window.api.data.getBundle() // current dir = guest
      await window.api.auth.setIdentity('account', u.id, true)
      const accountBundle = await window.api.data.getBundle() // account dir now active

      // LOCAL-FIRST: if this machine already has data for the account, it is
      // authoritative — NEVER overwrite it with the cloud (which could be
      // staler and cause data loss). Just back it up to the cloud.
      if (bundleHasData(accountBundle)) {
        try {
          await pushRemote(u.id, accountBundle)
        } catch {
          // offline — the push engine will retry
        }
      } else {
        // The account dir is empty on this machine. Safe to seed it.
        let remote: RemoteData = null
        let pullFailed = false
        try {
          remote = await pullRemote(u.id)
        } catch {
          pullFailed = true
        }

        if (!pullFailed && remote && bundleHasData(remote.bundle)) {
          // Existing account, restore its cloud data onto this fresh machine.
          await window.api.data.restoreBundle(remote.bundle)
        } else if (!pullFailed && !remote && bundleHasData(guestBundle)) {
          // Brand-new account (no cloud row) + you have guest data → offer import.
          const wantsUpload = await askUpload()
          if (wantsUpload) {
            await window.api.data.restoreBundle(guestBundle)
            await pushRemote(u.id, await window.api.data.getBundle())
          } else {
            await pushRemote(u.id, accountBundle)
          }
        } else if (bundleHasData(guestBundle)) {
          // Cloud empty/unreachable but you have local guest data → seed it so
          // the app is never blank. (No prompt: nothing to overwrite.)
          await window.api.data.restoreBundle(guestBundle)
        }
      }

      notifyDataReloaded()
      setUser(u)
      setAuthError(null)
      setStatus('authenticated')
    },
    [askUpload]
  )

  useEffect(() => {
    let cancelled = false

    async function resolve(): Promise<void> {
      const mainState = await window.api.auth.getState()
      const {
        data: { session }
      } = await supabase.auth.getSession()
      if (cancelled) return

      if (session) {
        if (mainState.mode !== 'account' || mainState.userId !== session.user.id) {
          // Session exists but the identity dir isn't set up yet — run full login.
          await completeLogin(session.user)
          return
        }
        // Identity matches. Local data on this machine is authoritative — do NOT
        // pull/restore on startup (that risked overwriting newer local data with
        // a staler cloud copy). The push engine backs local up to the cloud.
        setUser(session.user)
        if (!cancelled) setStatus('authenticated')
        return
      }

      // No session.
      if (mainState.mode === 'account') {
        // Stale account identity (session expired/cleared) — drop to the guest
        // dir and show the login screen again.
        await window.api.auth.setIdentity('guest', null, false)
        window.location.reload()
        return
      }
      if (mainState.skipLogin && mainState.mode === 'guest') setStatus('guest')
      else setStatus('needs-auth')
    }

    resolve()
    return () => {
      cancelled = true
    }
  }, [completeLogin])

  // Push local changes to the cloud while signed in.
  useEffect(() => {
    if (status !== 'authenticated' || !user) return
    return startPushEngine(user.id)
  }, [status, user])

  // Complete a social sign-in: the browser redirects to shibatrack://auth-callback
  // ?code=..., the main process forwards it here, and we exchange it for a session.
  useEffect(() => {
    return window.api.auth.onDeepLink(async (url) => {
      try {
        const code = new URL(url).searchParams.get('code')
        if (!code) return
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error || !data.session) {
          setAuthError(error?.message ?? 'Sign-in could not be completed. Please try again.')
          return
        }
        await completeLogin(data.session.user)
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Sign-in failed.')
      }
    })
  }, [completeLogin])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      supabaseEnabled: isSupabaseConfigured,
      authError,
      uploadPromptOpen: uploadResolver !== null,
      resolveUploadPrompt: (upload) => uploadResolver?.(upload),
      signInWithPassword: async (email, password) => {
        setAuthError(null)
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { error: error.message }
        await completeLogin(data.user)
        return { error: null }
      },
      signUp: async (email, password) => {
        setAuthError(null)
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) return { error: error.message }
        // Supabase obfuscates "email already registered" (to prevent enumeration)
        // by returning a user with an empty `identities` array and no session.
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          return { error: 'An account with this email already exists — try signing in instead.' }
        }
        if (!data.session) return { error: null, needsConfirmation: true }
        await completeLogin(data.session.user)
        return { error: null }
      },
      signInWithOAuth: async (provider) => {
        setAuthError(null)
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { skipBrowserRedirect: true, redirectTo: 'shibatrack://auth-callback' }
        })
        if (error) return { error: error.message }
        if (data?.url) await window.api.system.openExternal(data.url)
        // Completion happens asynchronously via the deep-link handler above.
        return { error: null }
      },
      continueAsGuest: async () => {
        await window.api.auth.setIdentity('guest', null, true)
        setStatus('guest')
      },
      signOut: async () => {
        await supabase.auth.signOut()
        await window.api.auth.setIdentity('guest', null, false)
        window.location.reload()
      }
    }),
    [status, user, authError, uploadResolver, completeLogin]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
