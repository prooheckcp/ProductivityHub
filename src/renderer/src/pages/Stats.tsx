import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import type { StatsEntry, StatsRangeKey, StatsResult } from '@shared/types'
import { formatDuration } from '../utils/format'
import './Stats.css'

const RANGES: { key: StatsRangeKey; label: string }[] = [
  { key: '1d', label: 'Last 24 hours' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'all', label: 'All time' }
]

function StatsList({ entries, emptyLabel }: { entries: StatsEntry[]; emptyLabel: string }): JSX.Element {
  if (entries.length === 0) {
    return <EmptyState title={emptyLabel} />
  }
  const max = Math.max(...entries.map((entry) => entry.ms), 1)
  return (
    <ul className="stats-list">
      {entries.map((entry) => (
        <li key={entry.key} className="stats-list__row">
          <div className="stats-list__label">{entry.label}</div>
          <div className="stats-list__bar-track">
            <div className="stats-list__bar-fill" style={{ width: `${(entry.ms / max) * 100}%` }} />
          </div>
          <div className="stats-list__value">{formatDuration(entry.ms)}</div>
        </li>
      ))}
    </ul>
  )
}

export default function Stats(): JSX.Element {
  const [range, setRange] = useState<StatsRangeKey>('7d')
  const [stats, setStats] = useState<StatsResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    window.api.stats.get(range).then((result) => {
      if (!cancelled) {
        setStats(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [range])

  return (
    <>
      <PageHeader
        title="Stats"
        subtitle="See where your time actually goes."
        actions={
          <div className="stats-range">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                className={'stats-range__option' + (range === r.key ? ' stats-range__option--active' : '')}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {!loading && stats && (
        <div className="stats-columns">
          <Card>
            <h2 className="stats-section-title">Timers</h2>
            <StatsList entries={stats.timers} emptyLabel="No timer activity in this range" />
          </Card>
          <Card>
            <h2 className="stats-section-title">Apps</h2>
            <StatsList entries={stats.apps} emptyLabel="No app activity tracked in this range" />
          </Card>
        </div>
      )}
    </>
  )
}
