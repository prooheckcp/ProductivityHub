import { useMemo, useRef, useState } from 'react'
import type { DragEvent, JSX } from 'react'
import type { Note, NoteFile, NoteFileFormInput, NoteGroup } from '@shared/types'
import {
  ChevronDownIcon,
  CloseIcon,
  FileIcon,
  FolderIcon,
  ImageIcon,
  PaperclipIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon
} from '../../components/icons'
import './NoteList.css'

export type NoteSelection = { type: 'note' | 'file'; id: string }

type NoteListProps = {
  notes: Note[]
  groups: NoteGroup[]
  files: NoteFile[]
  selection: NoteSelection | null
  onSelect: (selection: NoteSelection) => void
  onDeleteNote: (id: string) => void
  onDeleteFile: (id: string) => void
  onCreateGroup: (name: string) => void
  onRenameGroup: (id: string, name: string) => void
  onDeleteGroup: (id: string) => void
  onMoveNote: (id: string, groupId: string | null, order: number) => void
  onMoveFile: (id: string, target: { groupId: string | null; parentNoteId: string | null }, order: number) => void
  onCreateFile: (input: NoteFileFormInput) => Promise<void>
}

const END = Number.MAX_SAFE_INTEGER
const byOrder = <T extends { order: number }>(a: T, b: T): number => a.order - b.order
const COLLAPSED_KEY = 'noteGroupsCollapsed'

function loadCollapsed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

export default function NoteList({
  notes,
  groups,
  files,
  selection,
  onSelect,
  onDeleteNote,
  onDeleteFile,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onMoveNote,
  onMoveFile,
  onCreateFile
}: NoteListProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingGroupName, setEditingGroupName] = useState('')
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(loadCollapsed)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachTargetRef = useRef<{ groupId: string | null; parentNoteId: string | null } | null>(null)

  const searching = query.trim().length > 0

  const filteredNotes = useMemo(() => {
    if (!searching) return notes
    const q = query.trim().toLowerCase()
    return notes.filter((n) => n.title.toLowerCase().includes(q))
  }, [notes, query, searching])
  const filteredFiles = useMemo(() => {
    if (!searching) return files
    const q = query.trim().toLowerCase()
    return files.filter((f) => f.name.toLowerCase().includes(q))
  }, [files, query, searching])

  function toggleCollapsed(groupId: string): void {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...next]))
      return next
    })
  }

  function notesIn(groupId: string | null): Note[] {
    return filteredNotes.filter((n) => n.groupId === groupId).sort(byOrder)
  }
  function looseFilesIn(groupId: string | null): NoteFile[] {
    return filteredFiles.filter((f) => f.parentNoteId === null && f.groupId === groupId).sort(byOrder)
  }
  function filesUnder(noteId: string): NoteFile[] {
    return filteredFiles.filter((f) => f.parentNoteId === noteId).sort(byOrder)
  }

  // ---- Upload ----
  function beginAttach(target: { groupId: string | null; parentNoteId: string | null }): void {
    attachTargetRef.current = target
    fileInputRef.current?.click()
  }
  async function uploadInto(
    picked: File[],
    target: { groupId: string | null; parentNoteId: string | null }
  ): Promise<void> {
    for (const file of picked) {
      const isImage = file.type.startsWith('image/')
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      const path = isImage
        ? await window.api.images.save(file.name, bytes)
        : await window.api.attachments.save(file.name, bytes)
      const kind = isImage
        ? 'image'
        : file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
          ? 'pdf'
          : 'other'
      await onCreateFile({ name: file.name, path, kind, groupId: target.groupId, parentNoteId: target.parentNoteId })
    }
  }
  async function onFileInput(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const picked = Array.from(event.target.files ?? [])
    event.target.value = ''
    const target = attachTargetRef.current
    if (target) await uploadInto(picked, target)
  }
  /** Returns true if the drop carried OS files (and were uploaded into `target`). */
  function tryOsDrop(event: DragEvent, target: { groupId: string | null; parentNoteId: string | null }): boolean {
    const osFiles = Array.from(event.dataTransfer.files)
    if (osFiles.length === 0) return false
    void uploadInto(osFiles, target)
    return true
  }

  // ---- DnD ----
  function onDropNote(event: DragEvent, target: Note): void {
    event.preventDefault()
    event.stopPropagation()
    setDropTarget(null)
    if (tryOsDrop(event, { groupId: target.groupId, parentNoteId: target.id })) return
    const [kind, id] = (event.dataTransfer.getData('text/plain') || '').split(':')
    if (!id) return
    if (kind === 'note' && id !== target.id) onMoveNote(id, target.groupId, target.order)
    if (kind === 'file') onMoveFile(id, { groupId: target.groupId, parentNoteId: target.id }, END)
  }
  function onDropFile(event: DragEvent, target: NoteFile): void {
    event.preventDefault()
    event.stopPropagation()
    setDropTarget(null)
    if (tryOsDrop(event, { groupId: target.groupId, parentNoteId: target.parentNoteId })) return
    const [kind, id] = (event.dataTransfer.getData('text/plain') || '').split(':')
    if (kind === 'file' && id && id !== target.id) {
      onMoveFile(id, { groupId: target.groupId, parentNoteId: target.parentNoteId }, target.order)
    }
  }
  function onDropSection(event: DragEvent, groupId: string | null): void {
    event.preventDefault()
    event.stopPropagation()
    setDropTarget(null)
    if (tryOsDrop(event, { groupId, parentNoteId: null })) return
    const [kind, id] = (event.dataTransfer.getData('text/plain') || '').split(':')
    if (!id) return
    if (kind === 'note') onMoveNote(id, groupId, END)
    if (kind === 'file') onMoveFile(id, { groupId, parentNoteId: null }, END)
  }

  function commitNewGroup(): void {
    if (newGroupName.trim()) onCreateGroup(newGroupName.trim())
    setNewGroupName('')
    setAddingGroup(false)
  }

  function renderFile(file: NoteFile, nested: boolean): JSX.Element {
    const active = selection?.type === 'file' && selection.id === file.id
    return (
      <div
        key={file.id}
        className={
          'note-list__file' +
          (nested ? ' note-list__file--nested' : '') +
          (active ? ' note-list__item--active' : '') +
          (dropTarget === `f:${file.id}` ? ' note-list__item--drop' : '')
        }
        draggable={!searching}
        onDragStart={(e) => e.dataTransfer.setData('text/plain', `file:${file.id}`)}
        onDragOver={(e) => {
          if (searching) return
          e.preventDefault()
          e.stopPropagation()
          setDropTarget(`f:${file.id}`)
        }}
        onDragLeave={() => setDropTarget((t) => (t === `f:${file.id}` ? null : t))}
        onDrop={(e) => onDropFile(e, file)}
        onClick={() => onSelect({ type: 'file', id: file.id })}
      >
        <span className="note-list__file-icon">
          {file.kind === 'image' ? <ImageIcon size={13} /> : <FileIcon size={13} />}
        </span>
        <span className="note-list__file-name">{file.name}</span>
        <span
          className="note-list__item-delete"
          role="button"
          tabIndex={0}
          aria-label="Delete file"
          onClick={(e) => {
            e.stopPropagation()
            onDeleteFile(file.id)
          }}
        >
          <CloseIcon size={11} />
        </span>
      </div>
    )
  }

  function renderNote(note: Note): JSX.Element {
    const active = selection?.type === 'note' && selection.id === note.id
    const children = filesUnder(note.id)
    return (
      <div key={note.id} className="note-list__note-wrap">
        <div
          className={
            'note-list__item' +
            (active ? ' note-list__item--active' : '') +
            (dropTarget === `n:${note.id}` ? ' note-list__item--drop' : '')
          }
          draggable={!searching}
          onDragStart={(e) => e.dataTransfer.setData('text/plain', `note:${note.id}`)}
          onDragOver={(e) => {
            if (searching) return
            e.preventDefault()
            setDropTarget(`n:${note.id}`)
          }}
          onDragLeave={() => setDropTarget((t) => (t === `n:${note.id}` ? null : t))}
          onDrop={(e) => onDropNote(e, note)}
          onClick={() => onSelect({ type: 'note', id: note.id })}
        >
          {note.color && <span className="note-list__dot" style={{ background: note.color }} />}
          <div className="note-list__item-text">
            <span className="note-list__item-title">{note.title || 'Untitled note'}</span>
            <span className="note-list__item-date">{new Date(note.updatedAt).toLocaleDateString()}</span>
          </div>
          <span
            className="note-list__row-action"
            role="button"
            tabIndex={0}
            aria-label="Attach file to note"
            title="Attach file under this note"
            onClick={(e) => {
              e.stopPropagation()
              beginAttach({ groupId: note.groupId, parentNoteId: note.id })
            }}
          >
            <PaperclipIcon size={13} />
          </span>
          <span
            className="note-list__item-delete"
            role="button"
            tabIndex={0}
            aria-label="Delete note"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteNote(note.id)
            }}
          >
            <CloseIcon size={12} />
          </span>
        </div>
        {children.map((file) => renderFile(file, true))}
      </div>
    )
  }

  function renderGroupHeaderControls(groupId: string | null): JSX.Element {
    return (
      <span
        className="note-list__row-action"
        role="button"
        tabIndex={0}
        aria-label="Add file to group"
        title="Add file to this group"
        onClick={(e) => {
          e.stopPropagation()
          beginAttach({ groupId, parentNoteId: null })
        }}
      >
        <PaperclipIcon size={13} />
      </span>
    )
  }

  return (
    <div
      className="note-list"
      onDragOver={(e) => {
        // Allow OS files to be dropped onto empty space (→ ungrouped).
        if (e.dataTransfer.types.includes('Files')) e.preventDefault()
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDropTarget(null)
        tryOsDrop(e, { groupId: null, parentNoteId: null })
      }}
    >
      <div className="note-list__search">
        <SearchIcon size={14} />
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes…" />
        {searching && (
          <button
            type="button"
            className="note-list__search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <CloseIcon size={12} />
          </button>
        )}
      </div>

      <input ref={fileInputRef} type="file" multiple hidden onChange={onFileInput} />

      {searching ? (
        <div className="note-list__section">
          {filteredNotes.sort(byOrder).map(renderNote)}
          {filteredFiles.sort(byOrder).map((f) => renderFile(f, false))}
          {filteredNotes.length === 0 && filteredFiles.length === 0 && (
            <p className="note-list__empty">No matches for “{query.trim()}”.</p>
          )}
        </div>
      ) : (
        <>
          {groups.map((group) => {
            const isCollapsed = collapsed.has(group.id)
            return (
              <div key={group.id} className="note-list__group">
                <div
                  className={
                    'note-list__group-header' + (dropTarget === `g:${group.id}` ? ' note-list__group-header--drop' : '')
                  }
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDropTarget(`g:${group.id}`)
                  }}
                  onDragLeave={() => setDropTarget((t) => (t === `g:${group.id}` ? null : t))}
                  onDrop={(e) => onDropSection(e, group.id)}
                >
                  <button
                    type="button"
                    className={'note-list__chevron' + (isCollapsed ? '' : ' note-list__chevron--open')}
                    onClick={() => toggleCollapsed(group.id)}
                    aria-label={isCollapsed ? 'Expand group' : 'Collapse group'}
                  >
                    <ChevronDownIcon size={12} />
                  </button>
                  <FolderIcon size={13} />
                  {editingGroupId === group.id ? (
                    <input
                      className="note-list__group-rename"
                      value={editingGroupName}
                      autoFocus
                      onChange={(e) => setEditingGroupName(e.target.value)}
                      onBlur={() => {
                        onRenameGroup(group.id, editingGroupName)
                        setEditingGroupId(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur()
                      }}
                    />
                  ) : (
                    <span
                      className="note-list__group-name"
                      onDoubleClick={() => {
                        setEditingGroupId(group.id)
                        setEditingGroupName(group.name)
                      }}
                      title="Double-click to rename"
                    >
                      {group.name}
                    </span>
                  )}
                  {renderGroupHeaderControls(group.id)}
                  <button
                    type="button"
                    className="note-list__group-delete"
                    onClick={() => onDeleteGroup(group.id)}
                    aria-label="Delete group"
                    title="Delete group (contents move to Ungrouped)"
                  >
                    <TrashIcon size={13} />
                  </button>
                </div>
                {!isCollapsed && (
                  <div className="note-list__section">
                    {notesIn(group.id).map(renderNote)}
                    {looseFilesIn(group.id).map((f) => renderFile(f, false))}
                  </div>
                )}
              </div>
            )
          })}

          <div
            className={
              'note-list__group-header note-list__group-header--ungrouped' +
              (dropTarget === 'g:null' ? ' note-list__group-header--drop' : '')
            }
            onDragOver={(e) => {
              e.preventDefault()
              setDropTarget('g:null')
            }}
            onDragLeave={() => setDropTarget((t) => (t === 'g:null' ? null : t))}
            onDrop={(e) => onDropSection(e, null)}
          >
            <span className="note-list__group-name">Ungrouped</span>
            {renderGroupHeaderControls(null)}
          </div>
          <div className="note-list__section">
            {notesIn(null).map(renderNote)}
            {looseFilesIn(null).map((f) => renderFile(f, false))}
          </div>

          {addingGroup ? (
            <input
              className="note-list__new-group-input"
              value={newGroupName}
              autoFocus
              placeholder="Group name…"
              onChange={(e) => setNewGroupName(e.target.value)}
              onBlur={commitNewGroup}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitNewGroup()
                if (e.key === 'Escape') {
                  setNewGroupName('')
                  setAddingGroup(false)
                }
              }}
            />
          ) : (
            <button type="button" className="note-list__new-group" onClick={() => setAddingGroup(true)}>
              <PlusIcon size={13} /> New group
            </button>
          )}
        </>
      )}
    </div>
  )
}
