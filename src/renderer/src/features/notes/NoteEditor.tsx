import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, JSX } from 'react'
import type { Note, NoteBlock, NoteFile, NoteFormInput } from '@shared/types'
import {
  DrawIcon,
  FileIcon,
  GripIcon,
  ImageIcon,
  MusicIcon,
  NoteIcon,
  PaletteIcon,
  TableIcon,
  TrashIcon
} from '../../components/icons'
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
  // The currently focused block — new blocks are inserted right after it.
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Which block is being dragged (dimmed) and where a drop would land.
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropGap, setDropGap] = useState<number | null>(null)
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

  /** Insert blocks directly after the selected block (or at the end). */
  function insertAfterSelected(newBlocks: NoteBlock[]): void {
    if (newBlocks.length === 0) return
    setBlocks((prev) => {
      const i = selectedId ? prev.findIndex((b) => b.id === selectedId) : -1
      const at = i >= 0 ? i + 1 : prev.length
      return [...prev.slice(0, at), ...newBlocks, ...prev.slice(at)]
    })
    setSelectedId(newBlocks[newBlocks.length - 1].id)
  }

  /** Insert blocks at an absolute gap index (used for positioned drops). */
  function insertAtIndex(index: number, newBlocks: NoteBlock[]): void {
    if (newBlocks.length === 0) return
    setBlocks((prev) => {
      const at = Math.max(0, Math.min(index, prev.length))
      return [...prev.slice(0, at), ...newBlocks, ...prev.slice(at)]
    })
    setSelectedId(newBlocks[newBlocks.length - 1].id)
  }

  /** Move an existing block to a gap index (0..len). */
  function moveBlock(id: string, toGap: number): void {
    setBlocks((prev) => {
      const from = prev.findIndex((b) => b.id === id)
      if (from < 0) return prev
      const moved = prev[from]
      const without = prev.filter((_, i) => i !== from)
      let at = from < toGap ? toGap - 1 : toGap
      at = Math.max(0, Math.min(at, without.length))
      return [...without.slice(0, at), moved, ...without.slice(at)]
    })
  }

  // Build a note block from a freshly uploaded / OS-dropped file (saved to disk).
  async function blockFromUpload(file: File): Promise<NoteBlock | null> {
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (file.type.startsWith('image/')) {
      const path = await window.api.images.save(file.name, bytes)
      return { id: crypto.randomUUID(), type: 'image', path }
    }
    if (file.type.startsWith('audio/')) {
      const path = await window.api.attachments.save(file.name, bytes)
      return { id: crypto.randomUUID(), type: 'audio', name: file.name, path }
    }
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const path = await window.api.attachments.save(file.name, bytes)
      return { id: crypto.randomUUID(), type: 'pdf', name: file.name, path }
    }
    return null
  }

  // Build a note block from a sidebar file — duplicated on disk so the tree
  // entry keeps its own copy and deleting either side never breaks the other.
  async function blockFromSidebarFile(file: NoteFile): Promise<NoteBlock> {
    if (file.kind === 'image') {
      const path = await window.api.images.copy(file.path)
      return { id: crypto.randomUUID(), type: 'image', path }
    }
    if (file.kind === 'audio') {
      const path = await window.api.attachments.copy(file.path)
      return { id: crypto.randomUUID(), type: 'audio', name: file.name, path }
    }
    const path = await window.api.attachments.copy(file.path)
    return { id: crypto.randomUUID(), type: 'pdf', name: file.name, path }
  }

  async function handleFilesFromInput(files: File[]): Promise<void> {
    const built = (await Promise.all(files.map(blockFromUpload))).filter((b): b is NoteBlock => b !== null)
    insertAfterSelected(built)
  }

  function onImageInput(event: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    void handleFilesFromInput(files)
  }
  function onPdfInput(event: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    void handleFilesFromInput(files)
  }
  function onAudioInput(event: ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    void handleFilesFromInput(files)
  }

  // Resolve a drop (OS files, a sidebar file, or a block being reordered) into
  // the block list at the given gap index.
  async function handleDropPayload(event: DragEvent, index: number): Promise<void> {
    const osFiles = Array.from(event.dataTransfer.files)
    if (osFiles.length > 0) {
      const built = (await Promise.all(osFiles.map(blockFromUpload))).filter((b): b is NoteBlock => b !== null)
      insertAtIndex(index, built)
      return
    }
    const payload = event.dataTransfer.getData('text/plain')
    if (payload.startsWith('block:')) {
      moveBlock(payload.slice('block:'.length), index)
      return
    }
    if (payload.startsWith('file:')) {
      const file = resolveFile(payload.slice('file:'.length))
      if (!file) return
      insertAtIndex(index, [await blockFromSidebarFile(file)])
    }
  }

  function isDragPayload(event: DragEvent): boolean {
    return event.dataTransfer.types.includes('Files') || event.dataTransfer.types.includes('text/plain')
  }

  // Gap index for a drop landing on the block at `index` (top half → before it).
  function gapForBlock(event: DragEvent, index: number): number {
    const rect = event.currentTarget.getBoundingClientRect()
    return index + (event.clientY - rect.top > rect.height / 2 ? 1 : 0)
  }

  function onRootDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    setDragOver(false)
    setDropGap(null)
    setDraggingId(null)
    void handleDropPayload(event, blocks.length)
  }

  return (
    <div
      className={'note-editor' + (dragOver ? ' note-editor--drag-over' : '')}
      onDragEnter={(e) => {
        if (isDragPayload(e)) {
          e.preventDefault()
          setDragOver(true)
        }
      }}
      onDragOver={(e) => {
        if (!isDragPayload(e)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        setDragOver(true)
        setDropGap(blocks.length) // fallback target when not over a specific block
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setDragOver(false)
          setDropGap(null)
        }
      }}
      onDrop={onRootDrop}
    >
      {dragOver && blocks.length === 0 && (
        <div className="note-editor__drop-overlay">Drop to add to this note</div>
      )}
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
        <button type="button" onClick={() => insertAfterSelected([{ id: crypto.randomUUID(), type: 'markdown', text: '' }])}>
          <NoteIcon size={14} /> Text
        </button>
        <button type="button" onClick={() => insertAfterSelected([newTableBlock()])}>
          <TableIcon size={14} /> Table
        </button>
        <button
          type="button"
          onClick={() => insertAfterSelected([{ id: crypto.randomUUID(), type: 'drawing', strokes: [], height: 240 }])}
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
        className="note-editor__blocks"
        style={color ? { background: color } : undefined}
        onClick={(e) => {
          // Click empty space to deselect — the next added block goes to the end.
          if (e.target === e.currentTarget) setSelectedId(null)
        }}
      >
        {blocks.length === 0 ? (
          <p className="note-editor__empty">
            This note is empty. Add a block above, or drag an image or PDF here.
          </p>
        ) : (
          blocks.map((block, index) => (
            <div
              key={block.id}
              className={
                'note-editor__block' +
                (block.id === selectedId ? ' note-editor__block--selected' : '') +
                (block.id === draggingId ? ' note-editor__block--dragging' : '') +
                (dropGap === index ? ' note-editor__block--drop-above' : '') +
                (dropGap === index + 1 ? ' note-editor__block--drop-below' : '')
              }
              onClick={() => setSelectedId(block.id)}
              onDragOver={(e) => {
                if (!isDragPayload(e)) return
                e.preventDefault()
                e.stopPropagation()
                e.dataTransfer.dropEffect = 'copy'
                setDragOver(true)
                setDropGap(gapForBlock(e, index))
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const gap = gapForBlock(e, index)
                setDragOver(false)
                setDropGap(null)
                setDraggingId(null)
                void handleDropPayload(e, gap)
              }}
            >
              <span
                className="note-editor__block-grip"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', `block:${block.id}`)
                  // Must include 'copy' — the drop zones set dropEffect 'copy',
                  // and Chromium rejects the drop if the effect isn't allowed.
                  e.dataTransfer.effectAllowed = 'copyMove'
                  setDraggingId(block.id)
                }}
                onDragEnd={() => {
                  setDraggingId(null)
                  setDropGap(null)
                }}
                title="Drag to reorder"
                aria-label="Drag to reorder"
              >
                <GripIcon size={14} />
              </span>
              <div className="note-editor__block-content">
                <NoteBlockView block={block} onReplace={(next) => replaceBlock(block.id, next)} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
