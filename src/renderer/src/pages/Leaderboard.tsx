import { useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../auth/AuthContext'
import { useProfile } from '../auth/ProfileContext'
import {
  fetchLeaderboard,
  fetchLeaderboardCountries,
  fetchLeaderboardLanguages,
  fetchMyRank
} from '../leaderboard/leaderboardApi'
import type { LeaderboardEntry, LeaderboardPeriod } from '@shared/types'
import { countryFlag, countryName } from '@shared/countries'
import { resolveAvatar } from '../assets/avatarTemplates'
import { languageIcon } from '../assets/langIcons'
import { formatDuration } from '../utils/format'
import './Leaderboard.css'

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: 'weekly', label: 'This week' },
  { key: 'daily', label: 'Today' }
]

function rankClass(rank: number): string {
  if (rank === 1) return 'lb-row--gold'
  if (rank === 2) return 'lb-row--silver'
  if (rank === 3) return 'lb-row--bronze'
  return ''
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const chars = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)
  return chars.toUpperCase()
}

export default function Leaderboard(): JSX.Element {
  const { status } = useAuth()
  const { profile } = useProfile()
  const signedIn = status === 'authenticated'

  const [languages, setLanguages] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [language, setLanguage] = useState<string>('')
  const [country, setCountry] = useState<string>('') // '' = all countries
  const [period, setPeriod] = useState<LeaderboardPeriod>('all')

  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState<{ rank: number; ms: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  // Load the available languages + countries (also on manual refresh, since new
  // data may have synced after the page opened).
  useEffect(() => {
    if (!signedIn) return
    let cancelled = false
    Promise.all([fetchLeaderboardLanguages(), fetchLeaderboardCountries()])
      .then(([langs, ctys]) => {
        if (cancelled) return
        setLanguages(langs)
        setCountries(ctys)
        setLanguage((prev) => prev || langs[0] || '')
      })
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [signedIn, refreshTick])

  // Load the ranked list + the user's own rank whenever filters change.
  useEffect(() => {
    if (!signedIn || !language) return
    let cancelled = false
    setLoading(true)
    setError(null)
    const q = { language, country: country || null, period }
    Promise.all([fetchLeaderboard({ ...q, limit: 100 }), fetchMyRank(q)])
      .then(([rows, rank]) => {
        if (cancelled) return
        setEntries(rows)
        setMyRank(rank)
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [signedIn, language, country, period, refreshTick])

  const scopeLabel = useMemo(
    () => (country ? `${countryName(country)} · ${language}` : `Worldwide · ${language}`),
    [country, language]
  )

  if (!signedIn) {
    return (
      <>
        <PageHeader title="Leaderboards" subtitle="See how your coding time stacks up." />
        <Card className="lb-card">
          <EmptyState
            title="Sign in to compete"
            description="Coding leaderboards rank your tracked programming time against everyone else. Sign in to appear on the board and see your world rank."
          />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Leaderboards" subtitle="Coding time, ranked against the world." />

      {/* Your rank banner */}
      <Card className="lb-card lb-myrank">
        {languageIcon(language) && <img className="lb-myrank__lang-icon" src={languageIcon(language) as string} alt="" />}
        <div className="lb-myrank__left">
          <span className="lb-myrank__label">Your {country ? countryName(country) : 'world'} rank</span>
          <span className="lb-myrank__scope">{scopeLabel} · {PERIODS.find((p) => p.key === period)?.label}</span>
        </div>
        <div className="lb-myrank__value">
          {myRank ? (
            <>
              <span className="lb-myrank__rank">#{myRank.rank}</span>
              <span className="lb-myrank__time">{formatDuration(myRank.ms)}</span>
            </>
          ) : (
            <span className="lb-myrank__none">Not ranked yet</span>
          )}
        </div>
      </Card>

      {/* Filters */}
      <Card className="lb-card lb-filters">
        <div className="lb-filter">
          <label htmlFor="lb-language">Language</label>
          <div className="lb-filter__with-icon">
            {languageIcon(language) && <img className="lb-filter__icon" src={languageIcon(language) as string} alt="" />}
            <select id="lb-language" value={language} onChange={(e) => setLanguage(e.target.value)} disabled={!languages.length}>
              {languages.length === 0 && <option value="">No data yet</option>}
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="lb-filter">
          <label htmlFor="lb-country">Country</label>
          <select id="lb-country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">🌍 All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {countryFlag(c)} {countryName(c)}
              </option>
            ))}
          </select>
        </div>

        <div className="lb-periods" role="tablist">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={period === p.key}
              className={'lb-period' + (period === p.key ? ' lb-period--active' : '')}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button type="button" className="lb-refresh" onClick={() => setRefreshTick((t) => t + 1)} title="Refresh">
          ↻
        </button>
      </Card>

      {/* Ranked list */}
      <Card className="lb-card">
        {error && <p className="lb-error">{error}</p>}
        {!error && loading && <p className="lb-loading">Loading…</p>}
        {!error && !loading && entries.length === 0 && (
          <EmptyState
            title="No entries yet"
            description="Nobody has tracked coding time for this filter yet. Track some coding time and check back!"
          />
        )}
        {!error && !loading && entries.length > 0 && (
          <ul className="lb-list">
            {entries.map((entry) => {
              const name = entry.username || 'Anonymous'
              const isMe = entry.userId === profile?.id
              return (
                <li key={entry.userId} className={'lb-row ' + rankClass(entry.rank) + (isMe ? ' lb-row--me' : '')}>
                  <span className="lb-row__rank">
                    {entry.rank <= 3 ? <span className="lb-medal">{['🥇', '🥈', '🥉'][entry.rank - 1]}</span> : `#${entry.rank}`}
                  </span>
                  <span className="lb-row__avatar">
                    {resolveAvatar(entry.avatarUrl) ? (
                      <img src={resolveAvatar(entry.avatarUrl) as string} alt="" />
                    ) : (
                      <span>{initials(name)}</span>
                    )}
                  </span>
                  <span className="lb-row__name">
                    {name}
                    {isMe && <span className="lb-row__you">You</span>}
                  </span>
                  <span className="lb-row__country" title={countryName(entry.country)}>
                    {countryFlag(entry.country)}
                  </span>
                  <span className="lb-row__time">{formatDuration(entry.ms)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </>
  )
}
