# Supabase Accounts & Sync — Implementation Plan

Status tracker for hooking Shiba Track up to Supabase with a full account system.

## Core architectural decisions

1. **supabase-js runs in the renderer.** Auth UI, session, and sync live there.
   Session persists in `localStorage` (PKCE flow). The main process only helps
   with the OAuth deep-link callback. No backend server; email/password + Google
   + GitHub are all native Supabase.

2. **Identity-scoped local data directories.** `paths.ts` becomes identity-aware:
   - Guest → `userData/data/` (current — never touched)
   - Logged-in user → `userData/accounts/<user_id>/data/`

   This satisfies: guest always loads local machine data, logout never deletes
   it, and logged-in mode uses cloud data (pulled into the account dir as a local
   cache). Switching identity = switch active dir + reload.

3. **Anti-cheat lives in Postgres, not the app.** A client check is worthless
   (anyone can edit the app or hit Supabase directly with the public key). The
   time-check is a database trigger on the sync table — the enforcement point,
   since RLS lets a user write their own row.

## Supabase schema (run once in SQL editor)

```
profiles
  id uuid PK  → references auth.users(id)      -- unique per-user ID
  username text unique
  avatar_url text
  created_at, updated_at

user_data
  user_id uuid PK → auth.users(id)
  bundle jsonb              -- full DataBundle (theme + all tracked stats)
  total_tracked_ms bigint  -- validated aggregate for anti-cheat
  updated_at timestamptz

Storage bucket: avatars  (public read, per-user write)
```

- RLS on both tables: user can only read/write rows where `user_id = auth.uid()`.
- `handle_new_user` trigger auto-creates a `profiles` row on signup.
- Anti-cheat trigger on `user_data` update:
  ```
  allowed = (now - old.updated_at) * CONCURRENCY_FACTOR + BASE_TOLERANCE
  if (new.total_tracked_ms - old.total_tracked_ms) > allowed → reject
  ```
  Elapsed real wall-clock naturally handles offline use. CONCURRENCY_FACTOR
  (~12) covers concurrent timers + app-usage + code tracking; BASE_TOLERANCE
  (~2h) covers clock drift. Both tunable. Rejecting never loses data (client
  keeps its copy and retries), it just refuses implausible inflation.

## Sync rules

- **Synced**: theme (`backgroundGradient`, `font`, `textColor`) + all tracked
  data (timers, tasks, notes, achievements, app usage, code sessions, clock).
- **Always local**: `launchAtLogin`, `showTimerOverlay`, overlay pins, paths.

## Auth & data flows

- **Guest**: default fallback. "Continue as guest" is one click (test path).
  Choice persisted in `userData/auth.json` so login is skipped next launch.
- **Login (existing)**: switch to account dir → pull cloud → restore → reload.
- **Signup (new)**: switch to account dir → prompt "Upload local data? (overrides
  cloud with this machine's data)" → yes = push guest bundle; no = fresh.
- **Logout** (works from guest too): switch to guest dir → reload. Guest data
  untouched. Returns to login screen.
- **While logged in**: debounced push on change + on quit; pull on startup.

## Build checklist

### Main process
- [ ] `store/identity.ts` — current identity + persisted skip-login (`auth.json`)
- [ ] `paths.ts` identity-aware
- [ ] `shibatrack://` protocol + forward OAuth callback (`index.ts`)
- [ ] IPC: `auth:getState`, `auth:setIdentity`, `auth:getLocalBundle`,
      `auth:restoreBundle`, `auth:reloadData`, deep-link event

### Renderer
- [ ] `supabase/client.ts` — client from `.env` (PKCE)
- [ ] `auth/AuthContext.tsx` — session, profile, signIn/signUp/OAuth/guest/logout
- [ ] `auth/LoginScreen.tsx` — email/password + Google + GitHub + guest
- [ ] auth gate in `main.tsx`
- [ ] `sync/syncEngine.ts` — pull/push via DataBundle
- [ ] Sidebar user chip (bottom-left) — avatar + username → menu
- [ ] Settings: change username, upload profile picture, logout
- [ ] First-login "upload local data?" modal

### You (Supabase dashboard)
- [ ] Run the SQL migration (`docs/supabase-schema.sql`)
- [ ] Auth → URL Configuration → add `shibatrack://auth-callback` to the
      **Redirect URLs** allowlist (needed for Google/GitHub)
- [ ] Register Google + GitHub OAuth apps, paste client id/secret, enable the
      providers (social only)
- [ ] (Optional) Auth → turn OFF "Confirm email" for a smoother desktop signup

## Status: all phases implemented (2026-07-18)
Code complete + typecheck + build verified for Phases 1–5. Pending your dashboard
steps above, then live testing. Known v1 caveats:
- Note/timer image *files* aren't synced yet (only the data blob + profile
  picture). Stats, todos, notes text, theme all sync.
- Multi-device: last-writer-wins per push; a device that's behind adopts cloud
  only when the remote tracked-time total is ahead.
- Social login deep link is reliable in packaged builds; flaky under dev on macOS.

## Phasing (each independently testable)

1. **Foundation** — install supabase-js, client, identity + dir-scoping, guest
   mode, auth gate, login screen with email/password + guest.
2. **Sync** — schema + RLS + sync engine + first-login upload prompt.
3. **Identity/profile** — username, profile picture + `avatars` bucket, sidebar
   chip, settings.
4. **Anti-cheat trigger** + tuning.
5. **Social login** (Google/GitHub + deep-link protocol) — after OAuth apps
   registered. Note: `shibatrack://` deep link is reliable in packaged builds;
   under `electron-vite dev` on macOS custom protocols can be finicky, so social
   login is tested against a packaged build.
