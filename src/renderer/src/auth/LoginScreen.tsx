import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import Button from '../components/Button'
import { EyeIcon, EyeOffIcon, GitHubIcon, GoogleIcon, UserIcon } from '../components/icons'
import { useAuth, type OAuthProvider } from './AuthContext'
import logo from '../assets/logo.png'
import logoText from '../assets/logo-text.png'
import './LoginScreen.css'

type Mode = 'signin' | 'signup'

export default function LoginScreen(): JSX.Element {
  const { signInWithPassword, signUp, signInWithOAuth, continueAsGuest, supabaseEnabled, authError } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function switchMode(next: Mode): void {
    setMode(next)
    setError(null)
    setNotice(null)
    setConfirm('')
  }

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (busy) return
    setError(null)
    setNotice(null)
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    const result = mode === 'signin' ? await signInWithPassword(email, password) : await signUp(email, password)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.needsConfirmation) {
      setNotice('Check your inbox to confirm your email, then sign in.')
      setMode('signin')
    }
  }

  async function onOAuth(provider: OAuthProvider): Promise<void> {
    if (busy) return
    setError(null)
    setNotice('Opening your browser to continue…')
    const result = await signInWithOAuth(provider)
    if (result.error) {
      setNotice(null)
      setError(result.error)
    }
  }

  async function onGuest(): Promise<void> {
    if (busy) return
    setBusy(true)
    await continueAsGuest()
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__brand">
          <img className="login__logo" src={logo} alt="" />
          <img className="login__logo-text" src={logoText} alt="Shiba Track" />
        </div>

        {supabaseEnabled ? (
          <>
            <div className="login__tabs" role="tablist">
              <span className={'login__tab-indicator login__tab-indicator--' + mode} aria-hidden="true" />
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signin'}
                className={'login__tab' + (mode === 'signin' ? ' login__tab--active' : '')}
                onClick={() => switchMode('signin')}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'signup'}
                className={'login__tab' + (mode === 'signup' ? ' login__tab--active' : '')}
                onClick={() => switchMode('signup')}
              >
                Create account
              </button>
            </div>

            <form className="login__form" onSubmit={onSubmit}>
              <div key={mode} className="login__form-fields">
                <label className="login__field">
                  <span>Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
                <label className="login__field">
                  <span>Password</span>
                  <div className="login__password">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="login__reveal"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
                    </button>
                  </div>
                </label>

                {mode === 'signup' && (
                  <label className="login__field">
                    <span>Confirm password</span>
                    <div className="login__password">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        minLength={6}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </label>
                )}
              </div>

              {(error || authError) && <p className="login__error">{error || authError}</p>}
              {notice && <p className="login__notice">{notice}</p>}

              <Button type="submit" variant="primary" disabled={busy} className="login__submit">
                {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <div className="login__divider">
              <span>or</span>
            </div>

            <div className="login__socials">
              <button type="button" className="login__social" disabled={busy} onClick={() => onOAuth('google')}>
                <GoogleIcon size={18} />
                <span>Continue with Google</span>
              </button>
              <button type="button" className="login__social" disabled={busy} onClick={() => onOAuth('github')}>
                <GitHubIcon size={18} />
                <span>Continue with GitHub</span>
              </button>
            </div>
          </>
        ) : (
          <p className="login__notice">
            Account sync isn’t configured in this build. You can still use everything offline as a guest.
          </p>
        )}

        <button type="button" className="login__guest" disabled={busy} onClick={onGuest}>
          <UserIcon size={16} />
          <span>Continue as guest</span>
        </button>
        <p className="login__guest-hint">Guest data stays on this computer and is never uploaded.</p>
      </div>
    </div>
  )
}
