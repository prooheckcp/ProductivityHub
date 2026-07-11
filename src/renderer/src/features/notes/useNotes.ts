import { useCallback, useEffect, useState } from 'react'
import type {
  Note,
  NoteFile,
  NoteFileFormInput,
  NoteFormInput,
  NoteGroup,
  NoteGroupFormInput
} from '@shared/types'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [groups, setGroups] = useState<NoteGroup[]>([])
  const [files, setFiles] = useState<NoteFile[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [noteList, groupList, fileList] = await Promise.all([
      window.api.notes.list(),
      window.api.notes.groups.list(),
      window.api.notes.files.list()
    ])
    setNotes(noteList)
    setGroups(groupList)
    setFiles(fileList)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // ---- Notes ----
  const createNote = useCallback(async (input: NoteFormInput) => {
    const note = await window.api.notes.create(input)
    setNotes((prev) => [...prev, note])
    return note
  }, [])

  const updateNote = useCallback(async (id: string, patch: NoteFormInput) => {
    const note = await window.api.notes.update(id, patch)
    setNotes((prev) => prev.map((n) => (n.id === id ? note : n)))
    return note
  }, [])

  const removeNote = useCallback(async (id: string) => {
    await window.api.notes.remove(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
    // The main process also deletes files nested under the note.
    setFiles((prev) => prev.filter((f) => f.parentNoteId !== id))
  }, [])

  const moveNote = useCallback(async (id: string, groupId: string | null, order: number) => {
    const updated = await window.api.notes.move(id, groupId, order)
    setNotes(updated)
  }, [])

  // ---- Groups ----
  const createGroup = useCallback(async (input: NoteGroupFormInput) => {
    const group = await window.api.notes.groups.create(input)
    setGroups((prev) => [...prev, group])
    return group
  }, [])

  const updateGroup = useCallback(async (id: string, patch: NoteGroupFormInput) => {
    const group = await window.api.notes.groups.update(id, patch)
    setGroups((prev) => prev.map((g) => (g.id === id ? group : g)))
    return group
  }, [])

  const removeGroup = useCallback(async (id: string) => {
    await window.api.notes.groups.remove(id)
    setGroups((prev) => prev.filter((g) => g.id !== id))
    setNotes((prev) => prev.map((n) => (n.groupId === id ? { ...n, groupId: null } : n)))
    // Loose files in the group orphan to ungrouped; files under notes are unaffected.
    setFiles((prev) =>
      prev.map((f) => (f.parentNoteId === null && f.groupId === id ? { ...f, groupId: null } : f))
    )
  }, [])

  // ---- Files ----
  const createFile = useCallback(async (input: NoteFileFormInput) => {
    const file = await window.api.notes.files.create(input)
    setFiles((prev) => [...prev, file])
    return file
  }, [])

  const renameFile = useCallback(async (id: string, name: string) => {
    const file = await window.api.notes.files.update(id, { name })
    setFiles((prev) => prev.map((f) => (f.id === id ? file : f)))
    return file
  }, [])

  const removeFile = useCallback(async (id: string) => {
    await window.api.notes.files.remove(id)
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const moveFile = useCallback(
    async (id: string, target: { groupId: string | null; parentNoteId: string | null }, order: number) => {
      const updated = await window.api.notes.files.move(id, target, order)
      setFiles(updated)
    },
    []
  )

  // Remove a file from the tree without deleting it on disk — the caller has
  // taken it over as a block inside a note.
  const detachFile = useCallback(async (id: string) => {
    await window.api.notes.files.detach(id)
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  return {
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
    moveFile,
    detachFile
  }
}
