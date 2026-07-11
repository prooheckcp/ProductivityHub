import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { NoteFormInput } from '@shared/types'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import { PlusIcon } from '../components/icons'
import { useNotes } from '../features/notes/useNotes'
import NoteList from '../features/notes/NoteList'
import NoteEditor from '../features/notes/NoteEditor'
import './Notes.css'

const BLANK_NOTE: NoteFormInput = { title: 'Untitled note', content: '', images: [], pdfs: [] }

export default function Notes(): JSX.Element {
  const { notes, loading, createNote, updateNote, removeNote } = useNotes()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (selectedId && notes.some((n) => n.id === selectedId)) return
    setSelectedId(notes.length > 0 ? [...notes].sort((a, b) => b.updatedAt - a.updatedAt)[0].id : null)
  }, [loading, notes, selectedId])

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null

  async function handleCreate(): Promise<void> {
    const note = await createNote(BLANK_NOTE)
    setSelectedId(note.id)
  }

  async function handleDeleteConfirmed(): Promise<void> {
    if (!deletingId) return
    await removeNote(deletingId)
    if (deletingId === selectedId) setSelectedId(null)
    setDeletingId(null)
  }

  return (
    <>
      <PageHeader
        title="Notes"
        subtitle="Write, organize, and attach files — Markdown renders live."
        actions={
          <Button variant="primary" onClick={handleCreate}>
            <PlusIcon size={15} />
            New Note
          </Button>
        }
      />

      {!loading && notes.length === 0 && (
        <EmptyState
          title="No notes yet"
          description="Create a note to start writing."
          action={
            <Button variant="secondary" onClick={handleCreate}>
              <PlusIcon size={15} />
              New Note
            </Button>
          }
        />
      )}

      {notes.length > 0 && (
        <div className="notes-page">
          <div className="notes-page__sidebar">
            <NoteList notes={notes} selectedId={selectedId} onSelect={setSelectedId} onDelete={setDeletingId} />
          </div>
          <div className="notes-page__editor">
            {selectedNote && (
              <NoteEditor
                key={selectedNote.id}
                note={selectedNote}
                onUpdate={updateNote}
                onRequestDelete={() => setDeletingId(selectedNote.id)}
              />
            )}
          </div>
        </div>
      )}

      {deletingId && (
        <ConfirmDialog
          title="Delete this note?"
          description="This can't be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </>
  )
}
