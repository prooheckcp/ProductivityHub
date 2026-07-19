import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.RENDERER_VITE_SUPABASE_URL
const anonKey = import.meta.env.RENDERER_VITE_SUPABASE_ANON_KEY

// Whether the app was built with Supabase credentials. When false the app still
// runs fully in guest mode — the login screen just hides account features.
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] RENDERER_VITE_SUPABASE_URL / RENDERER_VITE_SUPABASE_ANON_KEY are not set. ' +
      'Account features are disabled; the app runs in guest-only mode.'
  )
}

// A single shared client for the whole renderer. Session is persisted to
// localStorage; PKCE is the flow required for the desktop OAuth redirect.
export const supabase: SupabaseClient = createClient(url ?? 'http://localhost', anonKey ?? 'public-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
})
