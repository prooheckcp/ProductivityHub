import type { JSX } from 'react'
import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import type { TodoStatsResult } from '@shared/types'

type TodoStatsPanelProps = {
  stats: TodoStatsResult
}

export default function TodoStatsPanel({ stats }: TodoStatsPanelProps): JSX.Element {
  const topCount = stats.byProject[0]?.count ?? 0

  return (
    <div className="stats-columns">
      <Card>
        <h2 className="stats-section-title">Tasks completed</h2>
        <p className="todo-stats__big-number">{stats.totalCompleted}</p>
        <p className="stats-note">in this range</p>
      </Card>

      <Card>
        <h2 className="stats-section-title">By project</h2>
        {stats.byProject.length === 0 ? (
          <EmptyState title="No completed tasks in this range" />
        ) : (
          <ul className="stats-list">
            {stats.byProject.map((entry) => (
              <li key={entry.key} className="stats-list__row">
                <span className="stats-list__label">{entry.label}</span>
                <div className="stats-list__bar-track">
                  <div className="stats-list__bar-fill" style={{ width: `${(entry.count / topCount) * 100}%` }} />
                </div>
                <div className="stats-list__value">{entry.count}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
