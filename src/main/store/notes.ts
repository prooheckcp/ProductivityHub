import { randomUUID } from 'crypto'
import type { Note, NoteFormInput } from '../../shared/types'
import { dataFile } from './paths'
import { readJsonFile, writeJsonFile } from './jsonFile'

const notesFile = (): string => dataFile('notes.json')

function loadNotes(): Note[] {
  return readJsonFile<Note[]>(notesFile(), [])
}
function saveNotes(notes: Note[]): void {
  writeJsonFile(notesFile(), notes)
}

function mustFind(notes: Note[], id: string): Note {
  const note = notes.find((n) => n.id === id)
  if (!note) throw new Error(`Note not found: ${id}`)
  return note
}

export function listNotes(): Note[] {
  return loadNotes()
}

export function createNote(input: NoteFormInput): Note {
  const now = Date.now()
  const note: Note = {
    id: randomUUID(),
    title: input.title.trim() || 'Untitled note',
    content: input.content,
    images: input.images,
    pdfs: input.pdfs,
    createdAt: now,
    updatedAt: now
  }
  const notes = loadNotes()
  notes.push(note)
  saveNotes(notes)
  return note
}

export function updateNote(id: string, patch: NoteFormInput): Note {
  const notes = loadNotes()
  const note = mustFind(notes, id)
  note.title = patch.title.trim() || note.title
  note.content = patch.content
  note.images = patch.images
  note.pdfs = patch.pdfs
  note.updatedAt = Date.now()
  saveNotes(notes)
  return note
}

export function deleteNote(id: string): void {
  saveNotes(loadNotes().filter((n) => n.id !== id))
}

export function restoreNotesData(notes: Note[]): void {
  saveNotes(notes)
}
