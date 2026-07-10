import type { JSX } from 'react'
import Modal from '../../components/Modal'
import EmptyState from '../../components/EmptyState'
import type { CodeStatsEntry } from '@shared/types'
import { formatDuration } from '../../utils/format'
import { getLanguageIcon } from './languageIcons'

type CodeProjectFilesModalProps = {
  projectLabel: string
  files: CodeStatsEntry[]
  onClose: () => void
}

export default function CodeProjectFilesModal({ projectLabel, files, onClose }: CodeProjectFilesModalProps): JSX.Element {
  const topFileMs = files[0]?.ms ?? 0

  return (
    <Modal title={projectLabel} onClose={onClose} width={560}>
      {files.length === 0 ? (
        <EmptyState title="No coding activity tracked in this range" />
      ) : (
        <ul className="stats-list">
          {files.map((entry) => {
            const Icon = getLanguageIcon(entry.language ?? 'Other')
            return (
              <li key={entry.key} className="stats-list__row">
                <span className="stats-list__label stats-list__label--with-icon" title={entry.key}>
                  <Icon size={16} />
                  <span className="stats-list__label-text">{entry.label}</span>
                </span>
                <div className="stats-list__bar-track">
                  <div className="stats-list__bar-fill" style={{ width: `${(entry.ms / topFileMs) * 100}%` }} />
                </div>
                <div className="stats-list__value">{formatDuration(entry.ms)}</div>
              </li>
            )
          })}
        </ul>
      )}
    </Modal>
  )
}
