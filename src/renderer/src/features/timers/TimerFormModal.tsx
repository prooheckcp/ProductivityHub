import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, JSX } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import { ImageIcon } from '../../components/icons'
import { toFileUrl } from '../../utils/fileUrl'
import type { Timer, TimerFormInput } from '@shared/types'
import './TimerFormModal.css'

type TimerFormModalProps = {
  initial?: Timer
  onClose: () => void
  onSubmit: (values: TimerFormInput) => Promise<void>
  onDelete?: () => void
}

export default function TimerFormModal({
  initial,
  onClose,
  onSubmit,
  onDelete
}: TimerFormModalProps): JSX.Element {
  const initialImagePath = initial?.imagePath ?? null
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [imagePath, setImagePath] = useState<string | null>(initialImagePath)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function discardUnsavedUpload(path: string | null): void {
    if (path && path !== initialImagePath) {
      window.api.images.delete(path).catch(() => {})
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const buffer = await file.arrayBuffer()
      const savedPath = await window.api.images.save(file.name, new Uint8Array(buffer))
      discardUnsavedUpload(imagePath)
      setImagePath(savedPath)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  function handleCancel(): void {
    discardUnsavedUpload(imagePath)
    onClose()
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), imagePath })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={initial ? 'Edit timer' : 'New timer'}
      onClose={handleCancel}
      footer={
        <>
          {initial && onDelete && (
            <Button variant="ghost" type="button" onClick={onDelete} className="timer-form__delete">
              Delete
            </Button>
          )}
          <Button variant="ghost" type="button" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="timer-form" disabled={saving || !name.trim()}>
            {initial ? 'Save changes' : 'Create timer'}
          </Button>
        </>
      }
    >
      <form id="timer-form" className="form-fields" onSubmit={handleSubmit}>
        <button
          type="button"
          className="timer-form__image-picker"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {imagePath ? (
            <img src={toFileUrl(imagePath)} alt="" className="timer-form__image-preview" />
          ) : (
            <span className="timer-form__image-placeholder">
              <ImageIcon size={22} />
              <span>{uploading ? 'Uploading…' : 'Add photo'}</span>
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="timer-form__file-input"
          onChange={handleFileChange}
        />

        <label className="form-field">
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Deep work"
            autoFocus
          />
        </label>

        <label className="form-field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What are you tracking?"
            rows={3}
          />
        </label>
      </form>
    </Modal>
  )
}
