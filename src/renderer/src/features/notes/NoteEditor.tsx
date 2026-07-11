import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, JSX } from 'react'
import type { Note, NoteFormInput, NotePdf } from '@shared/types'
import Button from '../../components/Button'
import { CloseIcon, FileIcon, PlusIcon } from '../../components/icons'
import NoteBody from './NoteBody'
import './NoteEditor.css'

function extractImagePaths(content: string): string[] {
  const matches = content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)
  return [...new Set([...matches].map((m) => m[1]))]
}

type NoteEditorProps = {
  note: Note
  onUpdate: (id: string, patch: NoteFormInput) => Promise<Note>
  onRequestDelete: () => void
}

export default function NoteEditor({ note, onUpdate, onRequestDelete }: NoteEditorProps): JSX.Element {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [pdfs, setPdfs] = useState<NotePdf[]>(note.pdfs)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const latestRef = useRef({ title, content, pdfs })
  latestRef.current = { title, content, pdfs }

  useEffect(() => {
    const timeout = setTimeout(() => {
      const { title, content, pdfs } = latestRef.current
      void onUpdate(note.id, { title, content, images: extractImagePaths(content), pdfs })
    }, 600)
    return () => clearTimeout(timeout)
  }, [title, content, pdfs, note.id, onUpdate])

  useEffect(() => {
    return () => {
      const { title, content, pdfs } = latestRef.current
      void onUpdate(note.id, { title, content, images: extractImagePaths(content), pdfs })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handlePdfInputChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    for (const file of files) {
      const buffer = await file.arrayBuffer()
      const path = await window.api.attachments.save(file.name, new Uint8Array(buffer))
      setPdfs((prev) => [...prev, { id: crypto.randomUUID(), name: file.name, path }])
    }
  }

  function handleRemovePdf(pdf: NotePdf): void {
    window.api.attachments.delete(pdf.path).catch(() => {})
    setPdfs((prev) => prev.filter((p) => p.id !== pdf.id))
  }

  return (
    <div className="note-editor">
      <div className="note-editor__header">
        <input
          className="note-editor__title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Untitled note"
        />
        <Button variant="ghost" onClick={onRequestDelete} title="Delete note">
          <CloseIcon size={14} />
        </Button>
      </div>

      <div className="note-editor__pdfs">
        {pdfs.map((pdf) => (
          <div key={pdf.id} className="note-editor__pdf-chip">
            <button
              type="button"
              className="note-editor__pdf-open"
              onClick={() => window.api.attachments.open(pdf.path)}
            >
              <FileIcon size={14} />
              {pdf.name}
            </button>
            <span
              className="note-editor__pdf-remove"
              role="button"
              tabIndex={0}
              aria-label="Remove PDF"
              onClick={() => handleRemovePdf(pdf)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') handleRemovePdf(pdf)
              }}
            >
              <CloseIcon size={11} />
            </span>
          </div>
        ))}
        <button type="button" className="note-editor__pdf-add" onClick={() => pdfInputRef.current?.click()}>
          <PlusIcon size={13} />
          Upload PDF
        </button>
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="note-editor__file-input"
          onChange={handlePdfInputChange}
        />
      </div>

      <NoteBody content={content} onChange={setContent} onDropPdf={(pdf) => setPdfs((prev) => [...prev, pdf])} />
    </div>
  )
}
