import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { CalendarIcon, FilterIcon } from '../components/icons'
import type {
  CodeStatsResult,
  CodeTrackerStatus,
  StatsQuery,
  StatsRangeKey,
  StatsResult,
  TodoStatsResult
} from '@shared/types'
import { formatDuration } from '../utils/format'
import AppIcon from '../features/stats/AppIcon'
import AppDetailModal from '../features/stats/AppDetailModal'
import { getCategoryIcon } from '../features/stats/categoryIcons'
import StatsChart, { type ChartView } from '../features/stats/StatsChart'
import TodoStatsPanel from '../features/stats/TodoStatsPanel'
import CodeStatsPanel from '../features/stats/CodeStatsPanel'
import './Stats.css'

const VALID_CATEGORIES = ['timers', 'apps', 'todo', 'code'] as const
type StatsCategoryParam = (typeof VALID_CATEGORIES)[number]

const RANGES: { key: StatsRangeKey; label: string }[] = [
  { key: '1d', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: 'all', label: 'All time' }
]

const VIEWS: { key: ChartView; label: string }[] = [
  { key: 'bar', label: 'Bar' },
  { key: 'pie', label: 'Pie' }
]

const MEDALS = ['🥇', '🥈', '🥉']

const RANGE_LABEL_FULL: Record<StatsRangeKey, string> = {
  '1d': 'last 24 hours',
  '7d': 'last 7 days',
  '30d': 'last 30 days',
  all: 'all time',
  custom: 'custom range'
}

function toDateInputValue(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

export default function Stats(): JSX.Element {
  const { category: categoryParam } = useParams<{ category?: string }>()
  const activeCategory: StatsCategoryParam = VALID_CATEGORIES.includes(categoryParam as StatsCategoryParam)
    ? (categoryParam as StatsCategoryParam)
    : 'timers'
  const [range, setRange] = useState<StatsRangeKey>('7d')
  const [view, setView] = useState<ChartView>('bar')
  const [category, setCategory] = useState<string | null>(null)
  const [stats, setStats] = useState<StatsResult | null>(null)
  const [todoStats, setTodoStats] = useState<TodoStatsResult | null>(null)
  const [codeStats, setCodeStats] = useState<CodeStatsResult | null>(null)
  const [codeStatus, setCodeStatus] = useState<CodeTrackerStatus | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const now = Date.now()
  const [customStart, setCustomStart] = useState(() => toDateInputValue(now - 7 * 24 * 60 * 60 * 1000))
  const [customEnd, setCustomEnd] = useState(() => toDateInputValue(now))

  useEffect(() => {
    let cancelled = false
    const query: StatsQuery =
      range === 'custom'
        ? {
            range,
            startMs: new Date(customStart).getTime(),
            endMs: new Date(customEnd).getTime() + 24 * 60 * 60 * 1000 - 1,
            category
          }
        : { range, category }
    // Keep showing the previous stats while the new query is in flight instead
    // of unmounting the whole results section — that unmount/remount on every
    // filter click was the visible flicker.
    window.api.stats.get(query).then((result) => {
      if (!cancelled) setStats(result)
    })
    window.api.stats.getTodo(query).then((result) => {
      if (!cancelled) setTodoStats(result)
    })
    window.api.stats.getCode(query).then((result) => {
      if (!cancelled) setCodeStats(result)
    })
    return () => {
      cancelled = true
    }
  }, [range, category, customStart, customEnd])

  useEffect(() => {
    let cancelled = false
    function poll(): void {
      window.api.code.getStatus().then((status) => {
        if (!cancelled) setCodeStatus(status)
      })
    }
    poll()
    const interval = setInterval(poll, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  function applyCustomRange(): void {
    setRange('custom')
    setShowCalendar(false)
  }

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
              <div className="stats-popover-anchor">
                <button
                  type="button"
                  className={
                    'stats-range__option stats-range__option--icon' +
                    (range === 'custom' ? ' stats-range__option--active' : '')
                  }
                  onClick={() => setShowCalendar((v) => !v)}
                  aria-label="Custom date range"
                >
                  <CalendarIcon size={15} />
                </button>
                {showCalendar && (
                  <div className="stats-popover">
                    <p className="stats-popover__title">Custom range</p>
                    <label className="stats-popover__field">
                      Start
                      <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                    </label>
                    <label className="stats-popover__field">
                      End
                      <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                    </label>
                    <button type="button" className="stats-popover__apply" onClick={applyCustomRange}>
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>
            {activeCategory !== 'todo' && (
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
            )}
          </div>
        }
      />

      <>
          {activeCategory === 'apps' && (
            <div className="stats-category-row">
              <button
                type="button"
                className={'stats-category-pill' + (category === null ? ' stats-category-pill--active' : '')}
                onClick={() => setCategory(null)}
              >
                <FilterIcon size={14} />
                All apps
              </button>
              {(stats?.availableCategories ?? []).map((c) => {
                const Icon = getCategoryIcon(c)
                return (
                  <button
                    key={c}
                    type="button"
                    className={'stats-category-pill' + (category === c ? ' stats-category-pill--active' : '')}
                    onClick={() => setCategory(c === category ? null : c)}
                  >
                    <Icon size={14} />
                    {c}
                  </button>
                )
              })}
            </div>
          )}

          {activeCategory === 'timers' && stats && (
            <div className="stats-columns">
              <Card>
                <h2 className="stats-section-title">Timers</h2>
                <StatsChart entries={stats.timers} view={view} />
              </Card>
            </div>
          )}

          {activeCategory === 'apps' && stats && (
            <>
              <div className="stats-columns">
                <Card>
                  <h2 className="stats-section-title">Apps</h2>
                  <StatsChart entries={stats.apps} view={view} onSelect={setSelectedApp} />
                </Card>
                <Card>
                  <h2 className="stats-section-title">
                    {range === 'all' ? 'All-time app leaderboard' : `App leaderboard · ${RANGE_LABEL_FULL[range]}`}
                  </h2>
                  {stats.apps.length === 0 ? (
                    <EmptyState title="No app activity tracked in this range" />
                  ) : (
                    <ol className="leaderboard">
                      {stats.apps.map((entry, index) => (
                        <li key={entry.key} className="leaderboard__row">
                          <span className="leaderboard__rank">{MEDALS[index] ?? index + 1}</span>
                          <button
                            type="button"
                            className="leaderboard__app"
                            onClick={() => setSelectedApp(entry.key)}
                          >
                            <AppIcon path={entry.appPath} label={entry.label} category={entry.category} />
                            <span className="leaderboard__label">{entry.label}</span>
                          </button>
                          <span className="leaderboard__value">{formatDuration(entry.ms)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </Card>
              </div>

              <div className="stats-columns">
                <Card>
                  <h2 className="stats-section-title">By category</h2>
                  {!stats.categorySupport && (
                    <p className="stats-note">
                      Automatic category detection is macOS-only — categories shown here (and on Windows)
                      come from a locally-known list of common apps, so less common apps may show as
                      Uncategorized.
                    </p>
                  )}
                  {stats.categories.length === 0 ? (
                    <EmptyState title="No categorized app activity in this range" />
                  ) : (
                    <ul className="stats-list">
                      {stats.categories.map((entry) => (
                        <li key={entry.key} className="stats-list__row">
                          <button
                            type="button"
                            className="stats-list__label stats-list__label--button"
                            onClick={() => setCategory(entry.key === category ? null : entry.key)}
                          >
                            {entry.label}
                          </button>
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

          {activeCategory === 'todo' && todoStats && <TodoStatsPanel stats={todoStats} />}

          {activeCategory === 'code' && codeStats && (
            <CodeStatsPanel stats={codeStats} status={codeStatus} view={view} />
          )}
      </>

      {selectedApp && <AppDetailModal appName={selectedApp} onClose={() => setSelectedApp(null)} />}
    </>
  )
}
