import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import type { AuthMode, AuthState } from '../../shared/types'

export type { AuthMode, AuthState }

const DEFAULT_STATE: AuthState = { mode: 'guest', userId: null, skipLogin: false }

// The identity file lives at the userData root — NOT inside a data dir — because
// it decides *which* data dir is active. Guest data stays in `userData/data`;
// each account gets `userData/accounts/<userId>/data`.
function authFile(): string {
  return join(app.getPath('userData'), 'auth.json')
}

let current: AuthState | null = null

function load(): AuthState {
  if (current) return current
  try {
    const raw = readFileSync(authFile(), 'utf-8')
    current = { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<AuthState>) }
  } catch {
    current = { ...DEFAULT_STATE }
  }
  return current
}

function persist(): void {
  writeFileSync(authFile(), JSON.stringify(current, null, 2), 'utf-8')
}

export function getAuthState(): AuthState {
  return { ...load() }
}

// Switch the active identity. Passing 'guest' always clears the userId.
// `skipLogin` controls whether the login screen is shown next: login/guest set
// it true (remember the choice), logout sets it false (drop back to the login
// screen) while still switching to the guest data dir so nothing is deleted.
export function setIdentity(mode: AuthMode, userId: string | null, skipLogin = true): AuthState {
  load()
  current = {
    mode,
    userId: mode === 'account' ? userId : null,
    skipLogin
  }
  persist()
  return { ...current }
}

// The root directory for the current identity's local data. `data`, `images`,
// and `attachments` all hang off this. Guest → userData; account → a per-user
// subfolder, so logging out never touches the guest's files.
export function identityRoot(): string {
  const state = load()
  if (state.mode === 'account' && state.userId) {
    return join(app.getPath('userData'), 'accounts', state.userId)
  }
  return app.getPath('userData')
}
