import type { LeaderboardEntry, LeaderboardPeriod } from '@shared/types'
import { supabase } from '../supabase/client'

export type LeaderboardQuery = {
  language: string
  country: string | null
  period: LeaderboardPeriod
  limit?: number
}

export async function fetchLeaderboard(query: LeaderboardQuery): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_coding_leaderboard', {
    p_language: query.language,
    p_country: query.country,
    p_period: query.period,
    p_limit: query.limit ?? 100
  })
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => ({
    userId: row.user_id as string,
    username: (row.username as string) ?? null,
    avatarUrl: (row.avatar_url as string) ?? null,
    country: (row.country as string) ?? null,
    ms: Number(row.ms ?? 0),
    rank: Number(row.rank ?? 0)
  }))
}

export async function fetchMyRank(
  query: Omit<LeaderboardQuery, 'limit'>
): Promise<{ rank: number; ms: number } | null> {
  const { data, error } = await supabase.rpc('get_my_coding_rank', {
    p_language: query.language,
    p_country: query.country,
    p_period: query.period
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return { rank: Number(row.rank ?? 0), ms: Number(row.ms ?? 0) }
}

export async function fetchLeaderboardLanguages(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_coding_leaderboard_languages')
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => row.language as string)
}

export async function fetchLeaderboardCountries(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_coding_leaderboard_countries')
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => row.country as string)
}
