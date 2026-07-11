import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, JSX } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { NotePdf } from '@shared/types'
import { ImageIcon, TableIcon } from '../../components/icons'
import { toFileUrl } from '../../utils/fileUrl'
import '../todo/MarkdownField.css'
import './NoteBody.css'

const TABLE_SNIPPET = '\n\n| Column 1 | Column 2 |\n| --- | --- |\n|  |  |\n\n'

type NoteBodyProps = {
  content: string
  onChange: (content: string) => void
  onDropPdf: (pdf: NotePdf) => void
}

export default function NoteBody({ content, onChange, onDropPdf }: NoteBodyProps): JSX.Element {
  const [editing, setEditing] = useState(() => content.trim().length === 0)
  const [dragOver, setDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  function insertTable(): void {
    const textarea = textareaRef.current
    if (editing && textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const next = content.slice(0, start) + TABLE_SNIPPET + content.slice(end)
      onChange(next)
      requestAnimationFrame(() => {
        textarea.focus()
        const pos = start + TABLE_SNIPPET.length
        textarea.setSelectionRange(pos, pos)
      })
    } else {
      onChange(content + TABLE_SNIPPET)
      setEditing(true)
    }
  }

  async function addImageFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const path = await window.api.images.save(file.name, new Uint8Array(buffer))
    return `\n\n![${file.name}](${path})\n\n`
  }

  async function handleImageInputChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    let next = content
    for (const file of files) {
      next += await addImageFile(file)
    }
    onChange(next)
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>): Promise<void> {
    event.preventDefault()
    setDragOver(false)
    const files = Array.from(event.dataTransfer.files)
    let next = content
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        next += await addImageFile(file)
      } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const buffer = await file.arrayBuffer()
        const path = await window.api.attachments.save(file.name, new Uint8Array(buffer))
        onDropPdf({ id: crypto.randomUUID(), name: file.name, path })
      }
    }
    if (next !== content) onChange(next)
  }

  return (
    <div className="note-body">
      <div className="note-body__toolbar">
        <button type="button" className="note-body__tool" onClick={insertTable} title="Insert table">
          <TableIcon size={15} />
          Table
        </button>
        <button
          type="button"
          className="note-body__tool"
          onClick={() => imageInputRef.current?.click()}
          title="Insert image"
        >
          <ImageIcon size={15} />
          Image
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="note-body__file-input"
          onChange={handleImageInputChange}
        />
      </div>

      <div
        className={'note-body__surface' + (dragOver ? ' note-body__surface--drag-over' : '')}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            className="note-body__textarea"
            value={content}
            autoFocus
            onChange={(event) => onChange(event.target.value)}
            onBlur={() => setEditing(false)}
            placeholder="Write in Markdown…"
          />
        ) : content.trim() ? (
          <div className="note-body__preview markdown-body" onDoubleClick={() => setEditing(true)}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ src, alt }) => <img src={toFileUrl(String(src ?? ''))} alt={alt ?? ''} />,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noreferrer">
                    {children}
                  </a>
                )
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="note-body__empty" onDoubleClick={() => setEditing(true)}>
            Double-click to start writing…
          </p>
        )}
      </div>
    </div>
  )
}
