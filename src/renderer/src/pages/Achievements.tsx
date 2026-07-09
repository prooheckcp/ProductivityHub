import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { CheckIcon, ChecklistIcon, CodeIcon, GiftIcon, TimerIcon } from '../components/icons'
import { ACHIEVEMENT_DEFS, describeAchievements } from '@shared/achievements'
import type { AchievementCategory, AchievementProgress, AchievementSummary } from '@shared/types'
import { formatDuration } from '../utils/format'
import { GRADIENTS } from '../theme/gradients'
import './Achievements.css'

const SECTIONS: { key: AchievementCategory; title: string }[] = [
  { key: 'timers', title: 'Timers' },
  { key: 'tasks', title: 'Tasks' },
  { key: 'devtools', title: 'Developer Tools' }
]

const CATEGORY_ICONS: Record<AchievementCategory, (props: { size?: number }) => JSX.Element> = {
  timers: TimerIcon,
  tasks: ChecklistIcon,
  devtools: CodeIcon
}

function rewardFor(achievementId: string): string | null {
  return GRADIENTS.find((g) => g.unlockedBy === achievementId)?.name ?? null
}

function formatAmount(category: AchievementCategory, value: number): string {
  return category === 'devtools' ? formatDuration(value) : String(Math.round(value))
}

export default function Achievements(): JSX.Element {
  const [progress, setProgress] = useState<AchievementProgress | null>(null)

  useEffect(() => {
    window.api.achievements.get().then(setProgress)
  }, [])

  if (!progress) return <></>

  const summaries = describeAchievements(progress)
  const unlockedCount = Object.keys(progress.unlocked).length

  return (
    <>
      <PageHeader title="Achievements" subtitle={`${unlockedCount} of ${ACHIEVEMENT_DEFS.length} unlocked.`} />

      {SECTIONS.map((section) => {
        const items = summaries.filter((s) => s.category === section.key)
        if (items.length === 0) return null
        return (
          <div key={section.key} className="achievements-section">
            <h2 className="achievements-section__title">{section.title}</h2>
            <div className="achievements-grid">
              {items.map((achievement: AchievementSummary) => {
                const isUnlocked = achievement.unlockedAt !== null
                const percent = Math.round(achievement.progress * 100)
                const CategoryIcon = CATEGORY_ICONS[achievement.category]
                const reward = rewardFor(achievement.id)

                return (
                  <Card
                    key={achievement.id}
                    className={'achievement-card' + (isUnlocked ? ' achievement-card--unlocked' : '')}
                  >
                    <div className="achievement-card__icon">
                      <CategoryIcon size={20} />
                      {isUnlocked && (
                        <span className="achievement-card__icon-badge">
                          <CheckIcon size={10} />
                        </span>
                      )}
                    </div>
                    <div className="achievement-card__body">
                      <p className="achievement-card__title">{achievement.title}</p>
                      <p className="achievement-card__description">{achievement.description}</p>
                      {reward && (
                        <p className="achievement-card__reward">
                          <GiftIcon size={12} />
                          {isUnlocked ? `Unlocked theme: ${reward}` : `Reward: unlocks the "${reward}" theme`}
                        </p>
                      )}
                      {!isUnlocked && (
                        <div className="achievement-card__progress">
                          <div className="achievement-card__progress-track">
                            <div className="achievement-card__progress-fill" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="achievement-card__progress-label">
                            {formatAmount(achievement.category, Math.min(achievement.current, achievement.threshold))} /{' '}
                            {formatAmount(achievement.category, achievement.threshold)}
                          </span>
                        </div>
                      )}
                      {isUnlocked && (
                        <p className="achievement-card__unlocked-at">
                          Unlocked {new Date(achievement.unlockedAt ?? 0).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}
