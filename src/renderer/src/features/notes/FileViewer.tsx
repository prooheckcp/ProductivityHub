import { useState } from 'react'
import type { JSX } from 'react'
import type { NoteFile } from '@shared/types'
import Button from '../../components/Button'
import { CloseIcon } from '../../components/icons'
import { toFileUrl } from '../../utils/fileUrl'
import './FileViewer.css'

type FileViewerProps = {
  file: NoteFile
  onRename: (id: string, name: string) => void
  onRequestDelete: () => void
}

export default function FileViewer({ file, onRename, onRequestDelete }: FileViewerProps): JSX.Element {
  const [name, setName] = useState(file.name)

  return (
    <div className="file-viewer">
      <div className="file-viewer__header">
        <input
          className="file-viewer__name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name.trim() && name !== file.name && onRename(file.id, name.trim())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
        />
        <Button variant="secondary" onClick={() => window.api.attachments.open(file.path)}>
          Open externally
        </Button>
        <Button variant="ghost" onClick={onRequestDelete} title="Delete file">
          <CloseIcon size={14} />
        </Button>
      </div>

      <div className="file-viewer__body">
        {file.kind === 'image' ? (
          <img className="file-viewer__image" src={toFileUrl(file.path)} alt={file.name} />
        ) : file.kind === 'pdf' ? (
          <iframe className="file-viewer__frame" src={toFileUrl(file.path)} title={file.name} />
        ) : file.kind === 'audio' ? (
          <div className="file-viewer__audio">
            <audio controls src={toFileUrl(file.path)} />
          </div>
        ) : (
          <div className="file-viewer__other">
            <p>Preview isn’t available for this file type.</p>
            <Button variant="primary" onClick={() => window.api.attachments.open(file.path)}>
              Open externally
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
