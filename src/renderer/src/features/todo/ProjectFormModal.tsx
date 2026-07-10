import { useRef, useState } from 'react'
import type { ChangeEvent, JSX } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import { ImageIcon } from '../../components/icons'
import { toFileUrl } from '../../utils/fileUrl'
import type { Project, ProjectFormInput } from '@shared/types'
import './ProjectFormModal.css'

type ProjectFormModalProps = {
  initial?: Project
  onClose: () => void
  onSubmit: (values: ProjectFormInput) => Promise<void>
  onDelete?: () => void
}

function toDateInputValue(ms: number | null): string {
  if (ms === null) return ''
  return new Date(ms).toISOString().slice(0, 10)
}

function fromDateInputValue(value: string): number | null {
  if (!value) return null
  const ms = new Date(`${value}T00:00:00`).getTime()
  return Number.isNaN(ms) ? null : ms
}

export default function ProjectFormModal({ initial, onClose, onSubmit, onDelete }: ProjectFormModalProps): JSX.Element {
  const initialImagePath = initial?.imagePath ?? null
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [imagePath, setImagePath] = useState<string | null>(initialImagePath)
  const [sprintSizeDays, setSprintSizeDays] = useState(initial?.sprintSizeDays?.toString() ?? '')
  const [sprintStartDate, setSprintStartDate] = useState(toDateInputValue(initial?.sprintStartDate ?? null))
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

  async function handleSubmit(): Promise<void> {
    if (!name.trim()) return
    setSaving(true)
    try {
      const parsedSize = parseInt(sprintSizeDays, 10)
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        imagePath,
        sprintSizeDays: Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : null,
        sprintStartDate: fromDateInputValue(sprintStartDate)
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={initial ? 'Project settings' : 'New project'}
      onClose={handleCancel}
      footer={
        <>
          {initial && onDelete && (
            <Button variant="ghost" type="button" onClick={onDelete} style={{ marginRight: 'auto', color: 'var(--danger)' }}>
              Delete
            </Button>
          )}
          <Button variant="ghost" type="button" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={handleSubmit} disabled={saving || !name.trim()}>
            {initial ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <div className="form-fields">
        <button
          type="button"
          className="project-form__image-picker"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {imagePath ? (
            <img src={toFileUrl(imagePath)} alt="" className="project-form__image-preview" />
          ) : (
            <span className="project-form__image-placeholder">
              <ImageIcon size={22} />
              <span>{uploading ? 'Uploading…' : 'Add picture'}</span>
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="project-form__file-input"
          onChange={handleFileChange}
        />

        <label className="form-field">
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Website redesign"
            autoFocus
          />
        </label>
        <label className="form-field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What's this project about?"
            rows={3}
          />
        </label>

        <p className="project-form__section-label">Sprints</p>
        <p className="project-form__hint">
          Optional — set a sprint length and start date to enable sprint numbers on tasks. Leave blank to keep every
          task in Backlog.
        </p>
        <div className="project-form__sprint-row">
          <label className="form-field">
            <span>Sprint length (days)</span>
            <input
              type="number"
              min={1}
              value={sprintSizeDays}
              onChange={(event) => setSprintSizeDays(event.target.value)}
              placeholder="14"
            />
          </label>
          <label className="form-field">
            <span>First sprint starts</span>
            <input
              type="date"
              value={sprintStartDate}
              onChange={(event) => setSprintStartDate(event.target.value)}
            />
          </label>
        </div>
      </div>
    </Modal>
  )
}
