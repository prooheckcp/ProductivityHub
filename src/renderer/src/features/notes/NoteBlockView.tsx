import { useEffect, useRef, useState } from 'react'
import type { JSX, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { DrawingStroke, NoteBlock } from '@shared/types'
import { CloseIcon, PlusIcon, TrashIcon } from '../../components/icons'
import { toFileUrl } from '../../utils/fileUrl'
import '../todo/MarkdownField.css'
import './NoteBlockView.css'

type NoteBlockViewProps = {
  block: NoteBlock
  /** Replace this block with zero (remove), one (update) or many (split) blocks. */
  onReplace: (blocks: NoteBlock[]) => void
}

// A pasted http(s)/data URL is used verbatim; a stored filesystem path is routed
// through the shiba-image:// scheme (paths with spaces — e.g. "Application
// Support" — would otherwise fail to load, which was the original render bug).
function imageSrc(src: string): string {
  return /^(https?:|data:|shiba-image:)/.test(src) ? src : toFileUrl(src)
}

const MARKDOWN_COMPONENTS = {
  img: ({ src, alt }: { src?: string; alt?: string }) => <img src={imageSrc(String(src ?? ''))} alt={alt ?? ''} />,
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

export default function NoteBlockView({ block, onReplace }: NoteBlockViewProps): JSX.Element {
  if (block.type === 'markdown') return <MarkdownBlock block={block} onReplace={onReplace} />
  if (block.type === 'table') return <TableBlock block={block} onReplace={onReplace} />
  if (block.type === 'image') return <ImageBlock block={block} onReplace={onReplace} />
  if (block.type === 'drawing') return <DrawingBlock block={block} onReplace={onReplace} />
  return <PdfBlock block={block} onReplace={onReplace} />
}

function MarkdownBlock({
  block,
  onReplace
}: {
  block: Extract<NoteBlock, { type: 'markdown' }>
  onReplace: (blocks: NoteBlock[]) => void
}): JSX.Element {
  const [editing, setEditing] = useState(block.text.trim().length === 0)
  const [draft, setDraft] = useState(block.text)

  function commit(): void {
    setEditing(false)
    // "Divide into md cells by whitespace lines": a block edited to contain
    // blank-line-separated chunks splits into one markdown block per chunk.
    const chunks = draft
      .split(/\n\s*\n/)
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0)
    if (chunks.length === 0) {
      onReplace([]) // emptied → remove the block
      return
    }
    const next: NoteBlock[] = chunks.map((text, i) =>
      i === 0 ? { ...block, text } : { id: crypto.randomUUID(), type: 'markdown', text }
    )
    onReplace(next)
  }

  if (editing) {
    return (
      <textarea
        className="note-block__textarea"
        value={draft}
        autoFocus
        onFocus={(e) => e.currentTarget.setSelectionRange(draft.length, draft.length)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          // Shift+Enter saves and exits edit mode, same as clicking outside.
          if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
        placeholder="Write Markdown… (Shift+Enter to save)"
      />
    )
  }

  return (
    <div
      className="note-block__markdown markdown-body"
      onDoubleClick={() => {
        setDraft(block.text)
        setEditing(true)
      }}
      title="Double-click to edit"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {block.text}
      </ReactMarkdown>
    </div>
  )
}

function TableBlock({
  block,
  onReplace
}: {
  block: Extract<NoteBlock, { type: 'table' }>
  onReplace: (blocks: NoteBlock[]) => void
}): JSX.Element {
  const rows = block.rows
  const colCount = rows[0]?.length ?? 0

  function update(newRows: string[][]): void {
    onReplace([{ ...block, rows: newRows }])
  }

  function setCell(r: number, c: number, value: string): void {
    update(rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row)))
  }

  function addRow(): void {
    update([...rows, Array.from({ length: colCount }, () => '')])
  }

  function addColumn(): void {
    update(rows.map((row) => [...row, '']))
  }

  function removeRow(r: number): void {
    if (rows.length <= 1) return // keep the header
    update(rows.filter((_, ri) => ri !== r))
  }

  function removeColumn(c: number): void {
    if (colCount <= 1) return
    update(rows.map((row) => row.filter((_, ci) => ci !== c)))
  }

  return (
    <div className="note-block__table-wrap">
      <table className="note-block__table">
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              <td className="note-block__table-rowctrl">
                {rows.length > 1 && (
                  <button type="button" onClick={() => removeRow(r)} aria-label="Remove row">
                    <CloseIcon size={11} />
                  </button>
                )}
              </td>
              {row.map((cell, c) => (
                <td key={c} className={r === 0 ? 'note-block__table-th' : ''}>
                  {r === 0 && colCount > 1 && (
                    <button
                      type="button"
                      className="note-block__table-colctrl"
                      onClick={() => removeColumn(c)}
                      aria-label="Remove column"
                    >
                      <CloseIcon size={10} />
                    </button>
                  )}
                  <input
                    value={cell}
                    onChange={(e) => setCell(r, c, e.target.value)}
                    placeholder={r === 0 ? 'Header' : ''}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="note-block__table-actions">
        <button type="button" onClick={addRow}>
          <PlusIcon size={12} /> Row
        </button>
        <button type="button" onClick={addColumn}>
          <PlusIcon size={12} /> Column
        </button>
        <button type="button" className="note-block__delete" onClick={() => onReplace([])}>
          <TrashIcon size={13} /> Delete table
        </button>
      </div>
    </div>
  )
}

function ImageBlock({
  block,
  onReplace
}: {
  block: Extract<NoteBlock, { type: 'image' }>
  onReplace: (blocks: NoteBlock[]) => void
}): JSX.Element {
  return (
    <div className="note-block__image">
      <img src={imageSrc(block.path)} alt="" />
      <button
        type="button"
        className="note-block__image-remove"
        onClick={() => onReplace([])}
        aria-label="Remove image"
      >
        <CloseIcon size={13} />
      </button>
    </div>
  )
}

const DRAW_COLORS = ['#111827', '#e5484d', '#2f6fed', '#12a150', '#f5a524']
const DRAW_SIZES = [2, 4, 8]

function DrawingBlock({
  block,
  onReplace
}: {
  block: Extract<NoteBlock, { type: 'drawing' }>
  onReplace: (blocks: NoteBlock[]) => void
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [strokes, setStrokes] = useState<DrawingStroke[]>(block.strokes)
  const [color, setColor] = useState(DRAW_COLORS[0])
  const [size, setSize] = useState(DRAW_SIZES[1])
  const activeRef = useRef<DrawingStroke | null>(null)
  const height = block.height ?? 240

  function redraw(): void {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const all = activeRef.current ? [...strokes, activeRef.current] : strokes
    for (const stroke of all) {
      if (stroke.points.length < 2) continue
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(stroke.points[0], stroke.points[1])
      for (let i = 2; i < stroke.points.length; i += 2) ctx.lineTo(stroke.points[i], stroke.points[i + 1])
      ctx.stroke()
    }
  }

  // Match the backing store to the displayed size for crisp lines, then repaint.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth
    canvas.height = height
    redraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes, height])

  function pointFor(event: ReactPointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = canvasRef.current!.getBoundingClientRect()
    return [event.clientX - rect.left, event.clientY - rect.top]
  }

  function commit(next: DrawingStroke[]): void {
    setStrokes(next)
    onReplace([{ ...block, strokes: next, height }])
  }

  return (
    <div className="note-block__drawing">
      <div className="note-block__draw-toolbar">
        {DRAW_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={'note-block__draw-swatch' + (c === color ? ' note-block__draw-swatch--active' : '')}
            style={{ background: c }}
            onClick={() => setColor(c)}
            aria-label={`Color ${c}`}
          />
        ))}
        <span className="note-block__draw-divider" />
        {DRAW_SIZES.map((s) => (
          <button
            key={s}
            type="button"
            className={'note-block__draw-size' + (s === size ? ' note-block__draw-size--active' : '')}
            onClick={() => setSize(s)}
            aria-label={`Brush ${s}`}
          >
            <span style={{ width: s + 2, height: s + 2 }} />
          </button>
        ))}
        <span className="note-block__draw-divider" />
        <button type="button" onClick={() => commit(strokes.slice(0, -1))} disabled={strokes.length === 0}>
          Undo
        </button>
        <button type="button" onClick={() => commit([])} disabled={strokes.length === 0}>
          Clear
        </button>
        <button type="button" className="note-block__delete" onClick={() => onReplace([])}>
          <TrashIcon size={13} />
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="note-block__draw-canvas"
        style={{ height }}
        onPointerDown={(event) => {
          canvasRef.current?.setPointerCapture(event.pointerId)
          const [x, y] = pointFor(event)
          activeRef.current = { color, size, points: [x, y] }
        }}
        onPointerMove={(event) => {
          if (!activeRef.current) return
          const [x, y] = pointFor(event)
          activeRef.current.points.push(x, y)
          redraw()
        }}
        onPointerUp={() => {
          if (!activeRef.current) return
          const finished = activeRef.current
          activeRef.current = null
          commit([...strokes, finished])
        }}
      />
    </div>
  )
}

function PdfBlock({
  block,
  onReplace
}: {
  block: Extract<NoteBlock, { type: 'pdf' }>
  onReplace: (blocks: NoteBlock[]) => void
}): JSX.Element {
  return (
    <div className="note-block__pdf">
      <div className="note-block__pdf-bar">
        <span className="note-block__pdf-name">{block.name}</span>
        <button type="button" onClick={() => window.api.attachments.open(block.path)}>
          Open externally
        </button>
        <button type="button" className="note-block__delete" onClick={() => onReplace([])} aria-label="Remove PDF">
          <TrashIcon size={13} />
        </button>
      </div>
      <iframe className="note-block__pdf-frame" src={imageSrc(block.path)} title={block.name} />
    </div>
  )
}
