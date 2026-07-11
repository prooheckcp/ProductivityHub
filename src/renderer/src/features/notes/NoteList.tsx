import type { JSX } from 'react'
import type { Note } from '@shared/types'
import { CloseIcon } from '../../components/icons'
import './NoteList.css'

type NoteListProps = {
  notes: Note[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export default function NoteList({ notes, selectedId, onSelect, onDelete }: NoteListProps): JSX.Element {
  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="note-list">
      {sorted.map((note) => (
        <button
          type="button"
          key={note.id}
          className={'note-list__item' + (note.id === selectedId ? ' note-list__item--active' : '')}
          onClick={() => onSelect(note.id)}
        >
          <div className="note-list__item-text">
            <span className="note-list__item-title">{note.title || 'Untitled note'}</span>
            <span className="note-list__item-date">{new Date(note.updatedAt).toLocaleDateString()}</span>
          </div>
          <span
            className="note-list__item-delete"
            role="button"
            tabIndex={0}
            aria-label="Delete note"
            onClick={(event) => {
              event.stopPropagation()
              onDelete(note.id)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.stopPropagation()
                onDelete(note.id)
              }
            }}
          >
            <CloseIcon size={12} />
          </span>
        </button>
      ))}
    </div>
  )
}
