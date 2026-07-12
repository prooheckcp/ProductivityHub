import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, JSX } from 'react'
import type { Note, NoteBlock, NoteFile, NoteFormInput } from '@shared/types'
import { DrawIcon, FileIcon, ImageIcon, MusicIcon, NoteIcon, PaletteIcon, TableIcon, TrashIcon } from '../../components/icons'
import NoteBlockView from './NoteBlockView'
import { NOTE_COLORS } from './noteColors'
import './NoteEditor.css'

function newTableBlock(): NoteBlock {
  return { id: crypto.randomUUID(), type: 'table', rows: [['Column 1', 'Column 2'], ['', '']] }
}

type NoteEditorProps = {
  note: Note
  onUpdate: (id: string, patch: NoteFormInput) => Promise<Note>
  onRequestDelete: () => void
  /** Look up a sidebar file when one is dragged into the note body. */
  resolveFile: (id: string) => NoteFile | undefined
}

export default function NoteEditor({ note, onUpdate, onRequestDelete, resolveFile }: NoteEditorProps): JSX.Element {
  const [title, setTitle] = useState(note.title)
  const [color, setColor] = useState<string | null>(note.color)
  const [blocks, setBlocks] = useState<NoteBlock[]>(note.blocks)
  const [dragOver, setDragOver] = useState(false)
  const [colorOpen, setColorOpen] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  // Autosave: keep the latest values in a ref so the debounce + unmount-flush
  // always persist what's on screen (same pattern the first version used).
  const latestRef = useRef({ title, color, blocks })
  latestRef.current = { title, color, blocks }

  useEffect(() => {
    const timeout = setTimeout(() => {
      const { title, color, blocks } = latestRef.current
      void onUpdate(note.id, { title, color, groupId: note.groupId, blocks })
    }, 600)
    return () => clearTimeout(timeout)
  }, [title, color, blocks, note.id, note.groupId, onUpdate])

  useEffect(() => {
    return () => {
      const { title, color, blocks } = latestRef.current
      void onUpdate(note.id, { title, color, groupId: note.groupId, blocks })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function replaceBlock(id: string, next: NoteBlock[]): void {
    setBlocks((prev) => prev.flatMap((b) => (b.id === id ? next : [b])))
  }

  function appendBlock(block: NoteBlock): void {
    setBlocks((prev) => [...prev, block])
  }

  async function handleImageFiles(files: File[]): Promise<void> {
    for (const file of files) {
      const buffer = await file.arrayBuffer()
      const path = await window.api.images.save(file.name, new Uint8Array(buffer))
      appendBlock({ id: crypto.randomUUID(), type: 'image', path })
    }
  }

  async function handlePdfFiles(files: File[]): Promise<void> {
    for (const file of files) {
      const buffer = await file.arrayBuffer()
      const path = await window.api.attachments.save(file.name, new Uint8Array(buffer))
      appendBlock({ id: crypto.randomUUID(), type: 'pdf', name: file.name, path })
    }
  }

  async function handleAudioFiles(files: File[]): Promise<void> {
    for (const file of files) {
      const buffer = await file.arrayBuffer()
      const path = await window.api.attachments.save(file.name, new Uint8Array(buffer))
      appendBlock({ id: crypto.randomUUID(), type: 'audio', name: file.name, path })
    }
  }

  async function onImageInput(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    await handleImageFiles(files)
  }

  async function onPdfInput(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    await handlePdfFiles(files)
  }

  async function onAudioInput(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    await handleAudioFiles(files)
  }

  async function onDrop(event: DragEvent<HTMLDivElement>): Promise<void> {
    event.preventDefault()
    setDragOver(false)

    // Files dragged from the OS (Finder) or from the app's file inputs.
    const files = Array.from(event.dataTransfer.files)
    if (files.length > 0) {
      await handleImageFiles(files.filter((f) => f.type.startsWith('image/')))
      await handleAudioFiles(files.filter((f) => f.type.startsWith('audio/')))
      await handlePdfFiles(
        files.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
      )
      return
    }

    // A file dragged in from the notes sidebar tree — copy it into the body as a
    // block. The original stays in the sidebar (the block gets its own copy on
    // disk, so deleting either side never breaks the other).
    const payload = event.dataTransfer.getData('text/plain')
    if (payload.startsWith('file:')) {
      const file = resolveFile(payload.slice('file:'.length))
      if (!file) return
      if (file.kind === 'image') {
        const path = await window.api.images.copy(file.path)
        appendBlock({ id: crypto.randomUUID(), type: 'image', path })
      } else if (file.kind === 'audio') {
        const path = await window.api.attachments.copy(file.path)
        appendBlock({ id: crypto.randomUUID(), type: 'audio', name: file.name, path })
      } else {
        const path = await window.api.attachments.copy(file.path)
        appendBlock({ id: crypto.randomUUID(), type: 'pdf', name: file.name, path })
      }
    }
  }

  return (
    <div
      className={'note-editor' + (dragOver ? ' note-editor--drag-over' : '')}
      onDragEnter={(e) => {
        // Only react to real drags (OS files or a sidebar tree item), never text.
        if (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('text/plain')) {
          e.preventDefault()
          setDragOver(true)
        }
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes('text/plain')) {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
          setDragOver(true)
        }
      }}
      onDragLeave={(e) => {
        // Ignore leaves into descendant elements — only clear when the pointer
        // actually leaves the editor.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false)
      }}
      onDrop={onDrop}
    >
      {dragOver && <div className="note-editor__drop-overlay">Drop to add to this note</div>}
      <div className="note-editor__header">
        <input
          className="note-editor__title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled note"
        />
        <div className="note-editor__color-picker">
          <button
            type="button"
            className="note-editor__color-button"
            onClick={() => setColorOpen((v) => !v)}
            title="Note color"
            aria-label="Note color"
          >
            <PaletteIcon size={15} />
            <span className="note-editor__color-current" style={color ? { background: color } : undefined} />
          </button>
          {colorOpen && (
            <>
              <div className="note-editor__color-backdrop" onClick={() => setColorOpen(false)} />
              <div className="note-editor__color-pop" role="group" aria-label="Choose note color">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c ?? 'none'}
                    type="button"
                    className={
                      'note-editor__color' +
                      (c === null ? ' note-editor__color--none' : '') +
                      (c === color ? ' note-editor__color--active' : '')
                    }
                    style={c ? { background: c } : undefined}
                    onClick={() => {
                      setColor(c)
                      setColorOpen(false)
                    }}
                    aria-label={c ? `Color ${c}` : 'No color'}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          className="note-editor__delete"
          onClick={onRequestDelete}
          title="Delete note"
          aria-label="Delete note"
        >
          <TrashIcon size={15} />
        </button>
      </div>

      <div className="note-editor__toolbar">
        <button type="button" onClick={() => appendBlock({ id: crypto.randomUUID(), type: 'markdown', text: '' })}>
          <NoteIcon size={14} /> Text
        </button>
        <button type="button" onClick={() => appendBlock(newTableBlock())}>
          <TableIcon size={14} /> Table
        </button>
        <button
          type="button"
          onClick={() => appendBlock({ id: crypto.randomUUID(), type: 'drawing', strokes: [], height: 240 })}
        >
          <DrawIcon size={14} /> Draw
        </button>
        <button type="button" onClick={() => imageInputRef.current?.click()}>
          <ImageIcon size={14} /> Image
        </button>
        <button type="button" onClick={() => pdfInputRef.current?.click()}>
          <FileIcon size={14} /> PDF
        </button>
        <button type="button" onClick={() => audioInputRef.current?.click()}>
          <MusicIcon size={14} /> Audio
        </button>
        <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={onImageInput} />
        <input ref={pdfInputRef} type="file" accept="application/pdf" multiple hidden onChange={onPdfInput} />
        <input ref={audioInputRef} type="file" accept="audio/*" multiple hidden onChange={onAudioInput} />
      </div>

      <div
        className={'note-editor__blocks' + (dragOver ? ' note-editor__blocks--drag-over' : '')}
        style={color ? { background: color } : undefined}
      >
        {blocks.length === 0 ? (
          <p className="note-editor__empty">
            This note is empty. Add a block above, or drag an image or PDF here.
          </p>
        ) : (
          blocks.map((block) => (
            <NoteBlockView key={block.id} block={block} onReplace={(next) => replaceBlock(block.id, next)} />
          ))
        )}
      </div>
    </div>
  )
}
