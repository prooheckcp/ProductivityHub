import type { JSX } from 'react'
import ProgressBar from '../../components/ProgressBar'
import { SettingsIcon } from '../../components/icons'
import type { Task } from '@shared/types'
import './ProjectCard.css'

type ProjectCardProps = {
  name: string
  description: string
  tasks: Task[]
  onOpen: () => void
  onEdit: () => void
}

export default function ProjectCard({ name, description, tasks, onOpen, onEdit }: ProjectCardProps): JSX.Element {
  const completed = tasks.filter((t) => t.completed).length
  const percent = tasks.length === 0 ? 0 : (completed / tasks.length) * 100

  return (
    <div className="project-card">
      <button type="button" className="project-card__body" onClick={onOpen}>
        <p className="project-card__name">{name}</p>
        {description && <p className="project-card__description">{description}</p>}
        <ProgressBar percent={percent} label={`${completed}/${tasks.length}`} />
      </button>
      <button type="button" className="project-card__edit" onClick={onEdit} aria-label="Edit project">
        <SettingsIcon size={15} />
      </button>
    </div>
  )
}
