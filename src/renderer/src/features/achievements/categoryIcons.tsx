import type { JSX } from 'react'
import { ChartIcon, ChecklistIcon, CodeIcon, TimerIcon } from '../../components/icons'
import type { AchievementCategory } from '@shared/types'

export const ACHIEVEMENT_CATEGORY_ICONS: Record<AchievementCategory, (props: { size?: number }) => JSX.Element> = {
  timers: TimerIcon,
  timerUsage: ChartIcon,
  tasks: ChecklistIcon,
  devtools: CodeIcon,
  coding: CodeIcon
}
