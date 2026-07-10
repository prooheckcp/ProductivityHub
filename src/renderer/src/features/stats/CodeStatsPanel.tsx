import type { JSX } from 'react'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import type { CodeStatsResult } from '@shared/types'
import { formatDuration } from '../../utils/format'
import { getLanguageIcon } from './languageIcons'

type CodeStatsPanelProps = {
  stats: CodeStatsResult
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function CodeStatsPanel({ stats }: CodeStatsPanelProps): JSX.Element {
  const topProjectMs = stats.byProject[0]?.ms ?? 0
  const topFileMs = stats.byFile[0]?.ms ?? 0

  return (
    <>
      <div className="stats-columns">
        <Card>
          <h2 className="stats-section-title">Total coding time</h2>
          <p className="todo-stats__big-number">{formatDuration(stats.totalMs)}</p>
          <p className="stats-note">in this range, tracked from your editor</p>
        </Card>

        <Card>
          <h2 className="stats-section-title">By language</h2>
          {stats.byLanguage.length === 0 ? (
            <EmptyState title="No coding activity tracked in this range" />
          ) : (
            <ol className="leaderboard">
              {stats.byLanguage.map((entry, index) => {
                const Icon = getLanguageIcon(entry.key)
                return (
                  <li key={entry.key} className="leaderboard__row">
                    <span className="leaderboard__rank">{MEDALS[index] ?? index + 1}</span>
                    <span className="leaderboard__app">
                      <Icon size={22} />
                      <span className="leaderboard__label">{entry.label}</span>
                    </span>
                    <span className="leaderboard__value">{formatDuration(entry.ms)}</span>
                  </li>
                )
              })}
            </ol>
          )}
        </Card>
      </div>

      <div className="stats-columns">
        <Card>
          <h2 className="stats-section-title">By project</h2>
          {stats.byProject.length === 0 ? (
            <EmptyState title="No coding activity tracked in this range" />
          ) : (
            <ul className="stats-list">
              {stats.byProject.map((entry) => (
                <li key={entry.key} className="stats-list__row">
                  <span className="stats-list__label">{entry.label}</span>
                  <div className="stats-list__bar-track">
                    <div className="stats-list__bar-fill" style={{ width: `${(entry.ms / topProjectMs) * 100}%` }} />
                  </div>
                  <div className="stats-list__value">{formatDuration(entry.ms)}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="stats-section-title">By file</h2>
          {stats.byFile.length === 0 ? (
            <EmptyState title="No coding activity tracked in this range" />
          ) : (
            <ul className="stats-list">
              {stats.byFile.map((entry) => (
                <li key={entry.key} className="stats-list__row">
                  <span className="stats-list__label" title={entry.key}>
                    {entry.label}
                  </span>
                  <div className="stats-list__bar-track">
                    <div className="stats-list__bar-fill" style={{ width: `${(entry.ms / topFileMs) * 100}%` }} />
                  </div>
                  <div className="stats-list__value">{formatDuration(entry.ms)}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
