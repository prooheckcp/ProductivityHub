import type { LeaderboardEntry, LeaderboardPeriod } from '@shared/types'
import { DEV_TOOLS, GAMES, type LeaderboardCategory } from '@shared/appLeaderboardCatalog'
import { supabase } from '../supabase/client'

export type LeaderboardQuery = {
  category: LeaderboardCategory
  item: string
  country: string | null
  period: LeaderboardPeriod
  limit?: number
}

// A missing RPC/table (PostgREST schema cache) means that part of the schema
// hasn't been applied yet. Treat it as "no data" rather than a hard error so
// the page shows an empty state instead of a scary message.
//  - PGRST202: function not found  - PGRST205: table/view not found
function isMissingSchema(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  if (code === 'PGRST202' || code === 'PGRST205') return true
  const message = (error as { message?: string } | null)?.message ?? ''
  return /could not find the (function|table)/i.test(message)
}

function mapEntry(row: Record<string, unknown>): LeaderboardEntry {
  return {
    userId: row.user_id as string,
    username: (row.username as string) ?? null,
    avatarUrl: (row.avatar_url as string) ?? null,
    country: (row.country as string) ?? null,
    ms: Number(row.ms ?? 0),
    rank: Number(row.rank ?? 0)
  }
}

export async function fetchLeaderboard(query: LeaderboardQuery): Promise<LeaderboardEntry[]> {
  const { category, item, country, period, limit = 100 } = query
  const { data, error } =
    category === 'code'
      ? await supabase.rpc('get_coding_leaderboard', { p_language: item, p_country: country, p_period: period, p_limit: limit })
      : await supabase.rpc('get_app_leaderboard', { p_category: category, p_item: item, p_country: country, p_period: period, p_limit: limit })
  if (error) {
    if (isMissingSchema(error)) return []
    throw error
  }
  return (data ?? []).map(mapEntry)
}

export async function fetchMyRank(
  query: Omit<LeaderboardQuery, 'limit'>
): Promise<{ rank: number; ms: number } | null> {
  const { category, item, country, period } = query
  const { data, error } =
    category === 'code'
      ? await supabase.rpc('get_my_coding_rank', { p_language: item, p_country: country, p_period: period })
      : await supabase.rpc('get_my_app_rank', { p_category: category, p_item: item, p_country: country, p_period: period })
  if (error) {
    if (isMissingSchema(error)) return null
    throw error
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return { rank: Number(row.rank ?? 0), ms: Number(row.ms ?? 0) }
}

export async function fetchLeaderboardItems(category: LeaderboardCategory): Promise<string[]> {
  // Dev tools & games use the curated catalog so the filter always shows the
  // popular items (independent of the DB) — never the coding languages.
  if (category === 'devtools') return DEV_TOOLS.map((t) => t.name)
  if (category === 'games') return GAMES.map((g) => g.name)

  // Code: only the languages currently tracked/cached (from the DB).
  const { data, error } = await supabase.rpc('get_coding_leaderboard_languages')
  if (error) {
    if (isMissingSchema(error)) return []
    throw error
  }
  return (data ?? []).map((row: Record<string, unknown>) => row.language as string)
}

export async function fetchLeaderboardCountries(category: LeaderboardCategory): Promise<string[]> {
  const { data, error } =
    category === 'code'
      ? await supabase.rpc('get_coding_leaderboard_countries')
      : await supabase.rpc('get_app_leaderboard_countries', { p_category: category })
  if (error) {
    if (isMissingSchema(error)) return []
    throw error
  }
  return (data ?? []).map((row: Record<string, unknown>) => row.country as string)
}
