import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { CheckIcon, TrophyIcon } from '../components/icons'
import { ACHIEVEMENT_DEFS } from '@shared/achievements'
import type { AchievementProgress } from '@shared/types'
import './Achievements.css'

function progressFor(progress: AchievementProgress, category: 'timers' | 'tasks'): number {
  return category === 'timers' ? progress.timersCreated : progress.tasksCompleted
}

export default function Achievements(): JSX.Element {
  const [progress, setProgress] = useState<AchievementProgress | null>(null)

  useEffect(() => {
    window.api.achievements.get().then(setProgress)
  }, [])

  if (!progress) return <></>

  const unlockedCount = Object.keys(progress.unlocked).length

  return (
    <>
      <PageHeader
        title="Achievements"
        subtitle={`${unlockedCount} of ${ACHIEVEMENT_DEFS.length} unlocked.`}
      />

      <div className="achievements-grid">
        {ACHIEVEMENT_DEFS.map((def) => {
          const unlockedAt = progress.unlocked[def.id]
          const isUnlocked = unlockedAt !== undefined
          const current = progressFor(progress, def.category)
          const percent = Math.min(100, Math.round((current / def.threshold) * 100))

          return (
            <Card key={def.id} className={'achievement-card' + (isUnlocked ? ' achievement-card--unlocked' : '')}>
              <div className="achievement-card__icon">
                {isUnlocked ? <CheckIcon size={20} /> : <TrophyIcon size={20} />}
              </div>
              <div className="achievement-card__body">
                <p className="achievement-card__title">{def.title}</p>
                <p className="achievement-card__description">{def.description}</p>
                {!isUnlocked && (
                  <div className="achievement-card__progress">
                    <div className="achievement-card__progress-track">
                      <div className="achievement-card__progress-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="achievement-card__progress-label">
                      {Math.min(current, def.threshold)} / {def.threshold}
                    </span>
                  </div>
                )}
                {isUnlocked && (
                  <p className="achievement-card__unlocked-at">
                    Unlocked {new Date(unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}
