import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { CheckIcon, NoteIcon } from '../components/icons'
import type { HomeSummary } from '@shared/types'
import { formatDuration } from '../utils/format'
import { toFileUrl } from '../utils/fileUrl'
import defaultCover from '../assets/shiba-clock.png'
import { ACHIEVEMENT_CATEGORY_ICONS } from '../features/achievements/categoryIcons'
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

  const hasQuickLinks =
    summary && (summary.recentTimers.length > 0 || summary.recentProject || summary.recentNotes.length > 0)

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
                <img
                  src={timer.imagePath ? toFileUrl(timer.imagePath) : defaultCover}
                  onError={(event) => {
                    event.currentTarget.onerror = null
                    event.currentTarget.src = defaultCover
                  }}
                  alt=""
                />
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

          {summary?.recentNotes.map((note) => (
            <button
              key={note.id}
              type="button"
              className="home__quick-link"
              onClick={() => navigate('/notes', { state: { openNoteId: note.id } })}
            >
              <span className="home__quick-link-thumb">
                <NoteIcon size={18} />
              </span>
              <span>
                <span className="home__quick-link-title">{note.title || 'Untitled note'}</span>
                <span className="home__quick-link-subtitle">Recent note</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No recent activity yet"
          description="Start a timer or complete a to-do to see quick links show up here."
        />
      )}

      {summary && (summary.recentAchievements.length > 0 || summary.closeAchievements.length > 0) && (
        <div className="home__achievements">
          {summary.recentAchievements.length > 0 && (
            <Card className="home__achievements-card">
              <h2 className="home__achievements-title">Recently unlocked</h2>
              <ul className="home__achievements-list">
                {summary.recentAchievements.map((a) => {
                  const CategoryIcon = ACHIEVEMENT_CATEGORY_ICONS[a.category]
                  return (
                    <li key={a.id} className="home__achievement-row">
                      <span className="home__achievement-icon home__achievement-icon--unlocked">
                        <CategoryIcon size={16} />
                        <span className="home__achievement-icon-badge">
                          <CheckIcon size={9} />
                        </span>
                      </span>
                      <span>
                        <span className="home__achievement-name">{a.title}</span>
                        <span className="home__achievement-meta">
                          {new Date(a.unlockedAt ?? 0).toLocaleDateString()}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}

          {summary.closeAchievements.length > 0 && (
            <Card className="home__achievements-card">
              <h2 className="home__achievements-title">Almost there</h2>
              <ul className="home__achievements-list">
                {summary.closeAchievements.map((a) => {
                  const CategoryIcon = ACHIEVEMENT_CATEGORY_ICONS[a.category]
                  return (
                    <li key={a.id} className="home__achievement-row">
                      <span className="home__achievement-icon">
                        <CategoryIcon size={16} />
                      </span>
                      <span className="home__achievement-progress">
                        <span className="home__achievement-name">{a.title}</span>
                        <span className="home__achievement-progress-track">
                          <span
                            className="home__achievement-progress-fill"
                            style={{ width: `${Math.round(a.progress * 100)}%` }}
                          />
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </div>
      )}
    </>
  )
}
