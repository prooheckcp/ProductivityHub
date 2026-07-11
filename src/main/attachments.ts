import { randomUUID } from 'crypto'
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs'
import { extname, join } from 'path'
import { getAttachmentsDir } from './store/paths'

export function saveAttachment(fileName: string, data: Uint8Array): string {
  const dir = getAttachmentsDir()
  mkdirSync(dir, { recursive: true })
  const ext = extname(fileName || '').toLowerCase()
  const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : ''
  const destPath = join(dir, `${randomUUID()}${safeExt}`)
  writeFileSync(destPath, data)
  return destPath
}

export function deleteAttachmentIfExists(path: string | null | undefined): void {
  if (!path) return
  try {
    if (existsSync(path)) unlinkSync(path)
  } catch (error) {
    console.error('Failed to delete attachment file:', error)
  }
}
