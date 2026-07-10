import type { JSX } from 'react'
import ProgressBar from '../../components/ProgressBar'
import { SettingsIcon } from '../../components/icons'
import { toFileUrl } from '../../utils/fileUrl'
import type { Task } from '@shared/types'
import './ProjectCard.css'

type ProjectCardProps = {
  name: string
  description: string
  imagePath: string | null
  tasks: Task[]
  onOpen: () => void
  onEdit: () => void
}

export default function ProjectCard({
  name,
  description,
  imagePath,
  tasks,
  onOpen,
  onEdit
}: ProjectCardProps): JSX.Element {
  const completed = tasks.filter((t) => t.status === 'finished').length
  const percent = tasks.length === 0 ? 0 : (completed / tasks.length) * 100

  return (
    <div className="project-card">
      <button type="button" className="project-card__body" onClick={onOpen}>
        {imagePath && <img src={toFileUrl(imagePath)} alt="" className="project-card__image" />}
        <p className="project-card__name">{name}</p>
        <p className="project-card__description">{description || 'No description yet.'}</p>
        <ProgressBar percent={percent} label={`${completed}/${tasks.length}`} />
      </button>
      <button
        type="button"
        className="project-card__edit"
        onClick={(event) => {
          event.stopPropagation()
          onEdit()
        }}
        aria-label="Edit project"
      >
        <SettingsIcon size={14} />
      </button>
    </div>
  )
}
