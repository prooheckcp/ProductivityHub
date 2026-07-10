import { useState } from 'react'
import type { JSX } from 'react'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import type { CodeStatsResult, CodeTrackerStatus } from '@shared/types'
import { CODE_TRACKER_CONNECTED_WINDOW_MS } from '@shared/codeTrackerConfig'
import { formatDuration } from '../../utils/format'
import { getLanguageIcon } from './languageIcons'
import CodeLanguageChart from './CodeLanguageChart'
import CodeProjectFilesModal from './CodeProjectFilesModal'
import InstallExtensionCard from './InstallExtensionCard'
import type { ChartView } from './StatsChart'

type CodeStatsPanelProps = {
  stats: CodeStatsResult
  status: CodeTrackerStatus | null
  view: ChartView
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function CodeStatsPanel({ stats, status, view }: CodeStatsPanelProps): JSX.Element {
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const topProjectMs = stats.byProject[0]?.ms ?? 0

  const recentlyConnected =
    status !== null &&
    status.lastHeartbeatAt !== null &&
    Date.now() - status.lastHeartbeatAt < CODE_TRACKER_CONNECTED_WINDOW_MS
  const showInstallCard = !recentlyConnected

  const selectedProjectEntry = stats.byProject.find((entry) => entry.key === selectedProject)

  return (
    <>
      {showInstallCard && <InstallExtensionCard />}

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
          <h2 className="stats-section-title">By language (chart)</h2>
          <CodeLanguageChart entries={stats.byLanguage} view={view} />
        </Card>

        <Card>
          <h2 className="stats-section-title">By project</h2>
          {stats.byProject.length === 0 ? (
            <EmptyState title="No coding activity tracked in this range" />
          ) : (
            <ul className="stats-list">
              {stats.byProject.map((entry) => (
                <li key={entry.key}>
                  <button
                    type="button"
                    className="stats-list__row stats-list__row--button"
                    onClick={() => setSelectedProject(entry.key)}
                  >
                    <span className="stats-list__label">{entry.label}</span>
                    <div className="stats-list__bar-track">
                      <div className="stats-list__bar-fill" style={{ width: `${(entry.ms / topProjectMs) * 100}%` }} />
                    </div>
                    <div className="stats-list__value">{formatDuration(entry.ms)}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {selectedProjectEntry && (
        <CodeProjectFilesModal
          projectLabel={selectedProjectEntry.label}
          files={stats.byProjectFile[selectedProjectEntry.key] ?? []}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  )
}
