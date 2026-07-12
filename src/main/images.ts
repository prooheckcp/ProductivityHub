import { randomUUID } from 'crypto'
import { copyFileSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs'
import { extname, join } from 'path'
import { getImagesDir } from './store/paths'

export function saveImage(fileName: string, data: Uint8Array): string {
  const dir = getImagesDir()
  mkdirSync(dir, { recursive: true })
  const ext = extname(fileName || '').toLowerCase()
  const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : '.png'
  const destPath = join(dir, `${randomUUID()}${safeExt}`)
  writeFileSync(destPath, data)
  return destPath
}

/** Duplicates an existing image into a fresh file (own path) and returns it. */
export function copyImage(srcPath: string): string {
  const dir = getImagesDir()
  mkdirSync(dir, { recursive: true })
  const ext = extname(srcPath || '').toLowerCase()
  const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : '.png'
  const destPath = join(dir, `${randomUUID()}${safeExt}`)
  copyFileSync(srcPath, destPath)
  return destPath
}

export function deleteImageIfExists(path: string | null | undefined): void {
  if (!path) return
  try {
    if (existsSync(path)) unlinkSync(path)
  } catch (error) {
    console.error('Failed to delete image file:', error)
  }
}
