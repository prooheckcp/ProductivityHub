import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { TimerIcon } from '../components/icons'
import type { HomeSummary } from '@shared/types'
import { formatDuration } from '../utils/format'
import { toFileUrl } from '../utils/fileUrl'
import LiveClock from '../features/home/LiveClock'
import './Home.css'

export default function Home(): JSX.Element {
  const [summary, setSummary] = useState<HomeSummary | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function load(): void {
      window.api.home.getSummary().then(setSummary)
    }
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [])

  const hasQuickLinks = summary && (summary.recentTimers.length > 0 || summary.recentProject)

  return (
    <>
      <PageHeader title="What are we doing today?" actions={<LiveClock />} />

      <div className="home__stats">
        <Card className="home__stat">
          <p className="home__stat-value">{formatDuration(summary?.timerMsToday ?? 0)}</p>
          <p className="home__stat-label">Tracked on timers today</p>
        </Card>
        <Card className="home__stat">
          <p className="home__stat-value">{formatDuration(summary?.appMsToday ?? 0)}</p>
          <p className="home__stat-label">Spent in apps today</p>
        </Card>
        <Card className="home__stat">
          <p className="home__stat-value">{summary?.tasksCompletedToday ?? 0}</p>
          <p className="home__stat-label">Tasks completed today</p>
        </Card>
      </div>

      {hasQuickLinks ? (
        <div className="home__quick-links">
          {summary?.recentTimers.map((timer) => (
            <button
              key={timer.id}
              type="button"
              className="home__quick-link"
              onClick={() => navigate('/time-tracker', { state: { openTimerId: timer.id } })}
            >
              <span className="home__quick-link-thumb">
                {timer.imagePath ? <img src={toFileUrl(timer.imagePath)} alt="" /> : <TimerIcon size={16} />}
              </span>
              <span>
                <span className="home__quick-link-title">{timer.name}</span>
                <span className="home__quick-link-subtitle">Recent timer</span>
              </span>
            </button>
          ))}

          {summary?.recentProject && (
            <button
              type="button"
              className="home__quick-link"
              onClick={() => navigate(`/todo/${summary.recentProject!.projectId}`)}
            >
              <span className="home__quick-link-thumb">✓</span>
              <span>
                <span className="home__quick-link-title">{summary.recentProject.projectName}</span>
                <span className="home__quick-link-subtitle">Completed "{summary.recentProject.taskName}"</span>
              </span>
            </button>
          )}
        </div>
      ) : (
        <EmptyState
          title="No recent activity yet"
          description="Start a timer or complete a to-do to see quick links show up here."
        />
      )}
    </>
  )
}
