import type { JSX } from 'react'
import type { TaskPriority } from '@shared/types'
import './PriorityBadge.css'

const LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
}

export const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

export default function PriorityBadge({ priority }: { priority: TaskPriority }): JSX.Element {
  return <span className={`priority-badge priority-badge--${priority}`}>{LABELS[priority]}</span>
}
