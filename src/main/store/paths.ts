import { join } from 'path'
import { identityRoot } from './identity'

// All data dirs are resolved relative to the current identity's root (see
// identity.ts): guest data lives under `userData/`, each account under
// `userData/accounts/<userId>/`. These are functions (not constants) so a
// login/logout that switches identity is picked up immediately.
export function getDataDir(): string {
  return join(identityRoot(), 'data')
}

export function getImagesDir(): string {
  return join(identityRoot(), 'images')
}

export function getAttachmentsDir(): string {
  return join(identityRoot(), 'attachments')
}

export function dataFile(name: string): string {
  return join(getDataDir(), name)
}
