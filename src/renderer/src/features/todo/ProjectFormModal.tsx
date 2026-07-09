import { useState } from 'react'
import type { JSX } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import type { Project, ProjectFormInput } from '@shared/types'

type ProjectFormModalProps = {
  initial?: Project
  onClose: () => void
  onSubmit: (values: ProjectFormInput) => Promise<void>
  onDelete?: () => void
}

export default function ProjectFormModal({ initial, onClose, onSubmit, onDelete }: ProjectFormModalProps): JSX.Element {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(): Promise<void> {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSubmit({ name: name.trim(), description: description.trim() })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={initial ? 'Edit project' : 'New project'}
      onClose={onClose}
      footer={
        <>
          {initial && onDelete && (
            <Button variant="ghost" type="button" onClick={onDelete} style={{ marginRight: 'auto', color: 'var(--danger)' }}>
              Delete
            </Button>
          )}
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={handleSubmit} disabled={saving || !name.trim()}>
            {initial ? 'Save changes' : 'Create project'}
          </Button>
        </>
      }
    >
      <div className="form-fields">
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
      </div>
    </Modal>
  )
}
