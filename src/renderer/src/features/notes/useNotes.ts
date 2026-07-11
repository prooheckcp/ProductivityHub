import { useCallback, useEffect, useState } from 'react'
import type { Note, NoteFormInput } from '@shared/types'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const noteList = await window.api.notes.list()
    setNotes(noteList)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

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
  }, [])

  return { notes, loading, createNote, updateNote, removeNote }
}
