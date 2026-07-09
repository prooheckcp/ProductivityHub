import { useRef, useState } from 'react'
import type { ChangeEvent, JSX } from 'react'
import { CloseIcon, ImageIcon, PlusIcon } from '../../components/icons'
import { toFileUrl } from '../../utils/fileUrl'
import './ImageGallery.css'

type ImageGalleryProps = {
  images: string[]
  onChange: (images: string[]) => void
}

export default function ImageGallery({ images, onChange }: ImageGalleryProps): JSX.Element {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const savedPaths: string[] = []
      for (const file of files) {
        const buffer = await file.arrayBuffer()
        savedPaths.push(await window.api.images.save(file.name, new Uint8Array(buffer)))
      }
      onChange([...images, ...savedPaths])
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  function handleRemove(path: string): void {
    window.api.images.delete(path).catch(() => {})
    onChange(images.filter((p) => p !== path))
  }

  return (
    <div className="image-gallery">
      {images.map((path) => (
        <div key={path} className="image-gallery__item">
          <img src={toFileUrl(path)} alt="" />
          <button
            type="button"
            className="image-gallery__remove"
            onClick={() => handleRemove(path)}
            aria-label="Remove photo"
          >
            <CloseIcon size={12} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="image-gallery__add"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? <ImageIcon size={18} /> : <PlusIcon size={18} />}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="image-gallery__file-input"
        onChange={handleFileChange}
      />
    </div>
  )
}
