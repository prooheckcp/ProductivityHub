import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import type { StatsRangeKey, StatsResult } from '@shared/types'
import { formatDuration } from '../utils/format'
import AppIcon from '../features/stats/AppIcon'
import StatsChart, { type ChartView } from '../features/stats/StatsChart'
import './Stats.css'

const RANGES: { key: StatsRangeKey; label: string }[] = [
  { key: '1d', label: 'Last 24 hours' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'all', label: 'All time' }
]

const VIEWS: { key: ChartView; label: string }[] = [
  { key: 'bar', label: 'Bar' },
  { key: 'pie', label: 'Pie' },
  { key: 'line', label: 'Line' }
]

const MEDALS = ['🥇', '🥈', '🥉']

export default function Stats(): JSX.Element {
  const [range, setRange] = useState<StatsRangeKey>('7d')
  const [view, setView] = useState<ChartView>('bar')
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
          <div className="stats-toolbar">
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
            <div className="stats-range">
              {VIEWS.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  className={'stats-range__option' + (view === v.key ? ' stats-range__option--active' : '')}
                  onClick={() => setView(v.key)}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {!loading && stats && (
        <>
          <div className="stats-columns">
            <Card>
              <h2 className="stats-section-title">Timers</h2>
              <StatsChart entries={stats.timers} view={view} />
            </Card>
            <Card>
              <h2 className="stats-section-title">Apps</h2>
              <StatsChart entries={stats.apps} view={view} />
            </Card>
          </div>

          <div className="stats-columns">
            <Card>
              <h2 className="stats-section-title">All-time app leaderboard</h2>
              {stats.appsAllTime.length === 0 ? (
                <EmptyState title="No app activity tracked yet" />
              ) : (
                <ol className="leaderboard">
                  {stats.appsAllTime.slice(0, 10).map((entry, index) => (
                    <li key={entry.key} className="leaderboard__row">
                      <span className="leaderboard__rank">{MEDALS[index] ?? index + 1}</span>
                      <AppIcon path={entry.appPath} label={entry.label} />
                      <span className="leaderboard__label">{entry.label}</span>
                      <span className="leaderboard__value">{formatDuration(entry.ms)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            <Card>
              <h2 className="stats-section-title">By category</h2>
              {!stats.categorySupport ? (
                <p className="stats-note">
                  App categories aren't available on this platform yet — macOS exposes an app's
                  category via its bundle metadata, but Windows has no equivalent for arbitrary
                  installed programs.
                </p>
              ) : stats.categories.length === 0 ? (
                <EmptyState title="No categorized app activity in this range" />
              ) : (
                <ul className="stats-list">
                  {stats.categories.map((entry) => (
                    <li key={entry.key} className="stats-list__row">
                      <div className="stats-list__label">{entry.label}</div>
                      <div className="stats-list__bar-track">
                        <div
                          className="stats-list__bar-fill"
                          style={{ width: `${(entry.ms / stats.categories[0].ms) * 100}%` }}
                        />
                      </div>
                      <div className="stats-list__value">{formatDuration(entry.ms)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  )
}
