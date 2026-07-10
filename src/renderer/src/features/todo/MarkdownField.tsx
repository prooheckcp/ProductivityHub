import { useState } from 'react'
import type { JSX } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './MarkdownField.css'

type MarkdownFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function MarkdownField({ value, onChange, placeholder }: MarkdownFieldProps): JSX.Element {
  // Opening an existing task should land on Preview (read the rendered
  // description first); a brand-new task has nothing to preview yet, so
  // start it in Write instead of showing an empty "nothing to preview" state.
  const [previewing, setPreviewing] = useState(() => value.trim().length > 0)

  return (
    <div className="markdown-field">
      <div className="markdown-field__toolbar">
        <button
          type="button"
          className={'markdown-field__tab' + (!previewing ? ' markdown-field__tab--active' : '')}
          onClick={() => setPreviewing(false)}
        >
          Write
        </button>
        <button
          type="button"
          className={'markdown-field__tab' + (previewing ? ' markdown-field__tab--active' : '')}
          onClick={() => setPreviewing(true)}
        >
          Preview
        </button>
      </div>

      {previewing ? (
        <div className="markdown-field__preview markdown-body">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="markdown-field__empty">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          className="markdown-field__textarea"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={6}
        />
      )}
    </div>
  )
}
