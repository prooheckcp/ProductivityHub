import { app } from 'electron'
import { join } from 'path'

export function getDataDir(): string {
  return join(app.getPath('userData'), 'data')
}

export function getImagesDir(): string {
  return join(app.getPath('userData'), 'images')
}

export function dataFile(name: string): string {
  return join(getDataDir(), name)
}
