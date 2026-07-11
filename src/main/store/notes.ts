import { randomUUID } from 'crypto'
import type {
  Note,
  NoteBlock,
  NoteFile,
  NoteFileFormInput,
  NoteFormInput,
  NoteGroup,
  NoteGroupFormInput
} from '../../shared/types'
import { dataFile } from './paths'
import { readJsonFile, writeJsonFile } from './jsonFile'

const notesFile = (): string => dataFile('notes.json')
const groupsFile = (): string => dataFile('note-groups.json')
const filesFile = (): string => dataFile('note-files.json')

// Notes predate the block model — they used to be { content, images, pdfs }.
// Convert legacy shapes to blocks on read (no formal migration; matches the
// normalize-on-read approach used by store/todo.ts).
type LegacyNote = Note & {
  content?: string
  images?: string[]
  pdfs?: { id: string; name: string; path: string }[]
}

function contentToBlocks(content: string): NoteBlock[] {
  return content
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map((text) => ({ id: randomUUID(), type: 'markdown' as const, text }))
}

function normalizeNote(note: LegacyNote, index: number): Note {
  let blocks: NoteBlock[]
  if (Array.isArray(note.blocks)) {
    blocks = note.blocks
  } else {
    blocks = contentToBlocks(note.content ?? '')
    for (const img of note.images ?? []) {
      blocks.push({ id: randomUUID(), type: 'image', path: img })
    }
    for (const pdf of note.pdfs ?? []) {
      blocks.push({ id: randomUUID(), type: 'pdf', name: pdf.name, path: pdf.path })
    }
  }
  return {
    id: note.id,
    title: note.title,
    color: note.color ?? null,
    groupId: note.groupId ?? null,
    order: typeof note.order === 'number' ? note.order : index,
    blocks,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  }
}

function loadNotes(): Note[] {
  return readJsonFile<LegacyNote[]>(notesFile(), []).map(normalizeNote)
}
function saveNotes(notes: Note[]): void {
  writeJsonFile(notesFile(), notes)
}
function loadGroups(): NoteGroup[] {
  return readJsonFile<NoteGroup[]>(groupsFile(), [])
}
function saveGroups(groups: NoteGroup[]): void {
  writeJsonFile(groupsFile(), groups)
}
function loadFiles(): NoteFile[] {
  return readJsonFile<NoteFile[]>(filesFile(), [])
}
function saveFiles(files: NoteFile[]): void {
  writeJsonFile(filesFile(), files)
}

function mustFind(notes: Note[], id: string): Note {
  const note = notes.find((n) => n.id === id)
  if (!note) throw new Error(`Note not found: ${id}`)
  return note
}

/** All filesystem paths referenced by a note's blocks (images + pdfs), for cleanup. */
export function noteFilePaths(note: Note): string[] {
  const paths: string[] = []
  for (const block of note.blocks) {
    if (block.type === 'image' || block.type === 'pdf') paths.push(block.path)
  }
  return paths
}

// ---- Notes ----

export function listNotes(): Note[] {
  return loadNotes()
}

export function createNote(input: NoteFormInput): Note {
  const now = Date.now()
  const notes = loadNotes()
  const order = notes.filter((n) => n.groupId === (input.groupId ?? null)).length
  const note: Note = {
    id: randomUUID(),
    title: input.title.trim() || 'Untitled note',
    color: input.color ?? null,
    groupId: input.groupId ?? null,
    order,
    blocks: input.blocks,
    createdAt: now,
    updatedAt: now
  }
  notes.push(note)
  saveNotes(notes)
  return note
}

export function updateNote(id: string, patch: NoteFormInput): Note {
  const notes = loadNotes()
  const note = mustFind(notes, id)
  note.title = patch.title.trim() || note.title
  note.color = patch.color ?? null
  note.groupId = patch.groupId ?? null
  note.blocks = patch.blocks
  note.updatedAt = Date.now()
  saveNotes(notes)
  return note
}

/** Deleting a note also removes any files nested under it. Returns removed file paths for disk cleanup. */
export function deleteNote(id: string): string[] {
  saveNotes(loadNotes().filter((n) => n.id !== id))
  const files = loadFiles()
  const removed = files.filter((f) => f.parentNoteId === id)
  if (removed.length > 0) saveFiles(files.filter((f) => f.parentNoteId !== id))
  return removed.map((f) => f.path)
}

/** Move a note into a group (or ungrouped) at a specific position, resequencing siblings. */
export function moveNote(id: string, groupId: string | null, order: number): Note[] {
  const notes = loadNotes()
  const note = mustFind(notes, id)
  note.groupId = groupId
  note.updatedAt = Date.now()
  // Resequence the destination section: place the moved note at `order`, keep
  // the rest in their existing relative order.
  const siblings = notes
    .filter((n) => n.groupId === groupId && n.id !== id)
    .sort((a, b) => a.order - b.order)
  const clamped = Math.max(0, Math.min(order, siblings.length))
  siblings.splice(clamped, 0, note)
  siblings.forEach((n, i) => {
    n.order = i
  })
  saveNotes(notes)
  return notes
}

// ---- Note groups ----

export function listNoteGroups(): NoteGroup[] {
  return [...loadGroups()].sort((a, b) => a.order - b.order)
}

export function createNoteGroup(input: NoteGroupFormInput): NoteGroup {
  const now = Date.now()
  const groups = loadGroups()
  const group: NoteGroup = {
    id: randomUUID(),
    name: input.name.trim() || 'Untitled group',
    order: groups.length,
    createdAt: now,
    updatedAt: now
  }
  groups.push(group)
  saveGroups(groups)
  return group
}

export function updateNoteGroup(id: string, patch: NoteGroupFormInput): NoteGroup {
  const groups = loadGroups()
  const group = groups.find((g) => g.id === id)
  if (!group) throw new Error(`Note group not found: ${id}`)
  group.name = patch.name.trim() || group.name
  group.updatedAt = Date.now()
  saveGroups(groups)
  return group
}

/** Deleting a group orphans its notes (and loose files) back into the ungrouped section. */
export function deleteNoteGroup(id: string): void {
  saveGroups(loadGroups().filter((g) => g.id !== id))
  const notes = loadNotes()
  let notesChanged = false
  for (const note of notes) {
    if (note.groupId === id) {
      note.groupId = null
      note.updatedAt = Date.now()
      notesChanged = true
    }
  }
  if (notesChanged) saveNotes(notes)

  const files = loadFiles()
  let filesChanged = false
  for (const file of files) {
    // Only loose files carry a groupId; files under notes follow their note.
    if (file.parentNoteId === null && file.groupId === id) {
      file.groupId = null
      file.updatedAt = Date.now()
      filesChanged = true
    }
  }
  if (filesChanged) saveFiles(files)
}

// ---- Note files ----

export function listNoteFiles(): NoteFile[] {
  return loadFiles()
}

export function createNoteFile(input: NoteFileFormInput): NoteFile {
  const now = Date.now()
  const files = loadFiles()
  const order = files.filter(
    (f) => f.parentNoteId === input.parentNoteId && f.groupId === input.groupId
  ).length
  const file: NoteFile = {
    id: randomUUID(),
    name: input.name.trim() || 'Untitled file',
    path: input.path,
    kind: input.kind,
    groupId: input.groupId,
    parentNoteId: input.parentNoteId,
    order,
    createdAt: now,
    updatedAt: now
  }
  files.push(file)
  saveFiles(files)
  return file
}

export function updateNoteFile(id: string, patch: { name: string }): NoteFile {
  const files = loadFiles()
  const file = files.find((f) => f.id === id)
  if (!file) throw new Error(`Note file not found: ${id}`)
  file.name = patch.name.trim() || file.name
  file.updatedAt = Date.now()
  saveFiles(files)
  return file
}

/** Returns the deleted file's path (for disk cleanup) or null if it was missing. */
export function deleteNoteFile(id: string): { path: string; kind: NoteFile['kind'] } | null {
  const files = loadFiles()
  const file = files.find((f) => f.id === id)
  if (!file) return null
  saveFiles(files.filter((f) => f.id !== id))
  return { path: file.path, kind: file.kind }
}

/** Removes the tree record WITHOUT deleting the file on disk — used when a file
 *  is moved into a note as a block, which takes over ownership of the path. */
export function detachNoteFile(id: string): void {
  saveFiles(loadFiles().filter((f) => f.id !== id))
}

export function moveNoteFile(
  id: string,
  target: { groupId: string | null; parentNoteId: string | null },
  order: number
): NoteFile[] {
  const files = loadFiles()
  const file = files.find((f) => f.id === id)
  if (!file) throw new Error(`Note file not found: ${id}`)
  file.groupId = target.groupId
  file.parentNoteId = target.parentNoteId
  file.updatedAt = Date.now()
  const siblings = files
    .filter((f) => f.groupId === target.groupId && f.parentNoteId === target.parentNoteId && f.id !== id)
    .sort((a, b) => a.order - b.order)
  const clamped = Math.max(0, Math.min(order, siblings.length))
  siblings.splice(clamped, 0, file)
  siblings.forEach((f, i) => {
    f.order = i
  })
  saveFiles(files)
  return files
}

export function restoreNotesData(notes: Note[], groups: NoteGroup[], files: NoteFile[]): void {
  saveNotes(notes)
  saveGroups(groups)
  saveFiles(files)
}
