import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useLocation } from 'react-router-dom'
import type { NoteFormInput } from '@shared/types'
import PageHeader from '../components/PageHeader'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import ConfirmDialog from '../components/ConfirmDialog'
import { PlusIcon, SidebarIcon } from '../components/icons'
import { useNotes } from '../features/notes/useNotes'
import NoteList, { type NoteSelection } from '../features/notes/NoteList'
import NoteEditor from '../features/notes/NoteEditor'
import FileViewer from '../features/notes/FileViewer'
import './Notes.css'

const BLANK_NOTE: NoteFormInput = { title: 'Untitled note', color: null, groupId: null, blocks: [] }

export default function Notes(): JSX.Element {
  const {
    notes,
    groups,
    files,
    loading,
    createNote,
    updateNote,
    removeNote,
    moveNote,
    createGroup,
    updateGroup,
    removeGroup,
    createFile,
    renameFile,
    removeFile,
    moveFile
  } = useNotes()
  const location = useLocation()
  const openNoteId = (location.state as { openNoteId?: string } | null)?.openNoteId ?? null

  const [selection, setSelection] = useState<NoteSelection | null>(null)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const [listCollapsed, setListCollapsed] = useState(() => localStorage.getItem('notesListCollapsed') === 'true')

  function toggleList(): void {
    setListCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('notesListCollapsed', String(next))
      return next
    })
  }

  useEffect(() => {
    if (openNoteId && notes.some((n) => n.id === openNoteId)) setSelection({ type: 'note', id: openNoteId })
  }, [openNoteId, notes])

  // Keep a valid selection: default to the most-recently-updated note.
  useEffect(() => {
    if (loading) return
    if (selection?.type === 'note' && notes.some((n) => n.id === selection.id)) return
    if (selection?.type === 'file' && files.some((f) => f.id === selection.id)) return
    setSelection(notes.length > 0 ? { type: 'note', id: [...notes].sort((a, b) => b.updatedAt - a.updatedAt)[0].id } : null)
  }, [loading, notes, files, selection])

  const selectedNote = selection?.type === 'note' ? notes.find((n) => n.id === selection.id) ?? null : null
  const selectedFile = selection?.type === 'file' ? files.find((f) => f.id === selection.id) ?? null : null

  async function handleCreate(): Promise<void> {
    const note = await createNote(BLANK_NOTE)
    setSelection({ type: 'note', id: note.id })
  }

  async function handleDeleteNoteConfirmed(): Promise<void> {
    if (!deletingNoteId) return
    await removeNote(deletingNoteId)
    if (selection?.type === 'note' && selection.id === deletingNoteId) setSelection(null)
    setDeletingNoteId(null)
  }

  async function handleDeleteFileConfirmed(): Promise<void> {
    if (!deletingFileId) return
    await removeFile(deletingFileId)
    if (selection?.type === 'file' && selection.id === deletingFileId) setSelection(null)
    setDeletingFileId(null)
  }

  const hasContent = notes.length > 0 || files.length > 0 || groups.length > 0

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

      {!loading && !hasContent && (
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

      {hasContent && (
        <div className={'notes-page' + (listCollapsed ? ' notes-page--list-collapsed' : '')}>
          {listCollapsed ? (
            <button
              type="button"
              className="notes-page__list-show"
              onClick={toggleList}
              title="Show notes list"
              aria-label="Show notes list"
            >
              <SidebarIcon size={16} />
            </button>
          ) : (
            <div className="notes-page__sidebar">
              <div className="notes-page__list-header">
                <button
                  type="button"
                  className="notes-page__list-hide"
                  onClick={toggleList}
                  title="Minimize notes list"
                  aria-label="Minimize notes list"
                >
                  <SidebarIcon size={15} />
                </button>
              </div>
              <NoteList
                notes={notes}
                groups={groups}
                files={files}
                selection={selection}
                onSelect={setSelection}
                onDeleteNote={setDeletingNoteId}
                onDeleteFile={setDeletingFileId}
                onCreateGroup={(name) => void createGroup({ name, color: null })}
                onUpdateGroup={(id, patch) => void updateGroup(id, patch)}
                onDeleteGroup={(id) => void removeGroup(id)}
                onMoveNote={moveNote}
                onMoveFile={moveFile}
                onCreateFile={async (input) => void (await createFile(input))}
              />
            </div>
          )}
          <div className="notes-page__editor">
            {selectedNote && (
              <NoteEditor
                key={selectedNote.id}
                note={selectedNote}
                onUpdate={updateNote}
                onRequestDelete={() => setDeletingNoteId(selectedNote.id)}
                resolveFile={(id) => files.find((f) => f.id === id)}
              />
            )}
            {selectedFile && (
              <FileViewer
                key={selectedFile.id}
                file={selectedFile}
                onRename={renameFile}
                onRequestDelete={() => setDeletingFileId(selectedFile.id)}
              />
            )}
          </div>
        </div>
      )}

      {deletingNoteId && (
        <ConfirmDialog
          title="Delete this note?"
          description="This also deletes any files nested under it. This can't be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteNoteConfirmed}
          onCancel={() => setDeletingNoteId(null)}
        />
      )}

      {deletingFileId && (
        <ConfirmDialog
          title="Delete this file?"
          description="This removes it from the note tree. This can't be undone."
          confirmLabel="Delete"
          onConfirm={handleDeleteFileConfirmed}
          onCancel={() => setDeletingFileId(null)}
        />
      )}
    </>
  )
}
