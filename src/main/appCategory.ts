import { spawn } from 'child_process'
import { platform } from 'process'
import { lookupKnownCategory } from '../shared/appCategories'

// macOS bundles ship an App Store category in Info.plist (LSApplicationCategoryType),
// readable via Spotlight metadata without extra permissions. Windows has no equivalent
// standard metadata for arbitrary installed programs, so automatic detection is mac-only —
// everywhere else (and any mac app missing the metadata) falls back to a locally-known map.
export const CATEGORY_AUTO_DETECT_SUPPORTED = platform === 'darwin'

const cache = new Map<string, string | null>()

function runCommand(command: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    let output = ''
    let child
    try {
      child = spawn(command, args)
    } catch {
      resolve(null)
      return
    }
    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString()
    })
    child.on('error', () => resolve(null))
    child.on('close', (code) => resolve(code === 0 ? output.trim() : null))
  })
}

function formatCategory(raw: string): string {
  const last = raw.split('.').pop() ?? raw
  return last.charAt(0).toUpperCase() + last.slice(1)
}

export async function getAppCategory(appName: string, appPath: string | null): Promise<string | null> {
  const cacheKey = appPath ?? `name:${appName.toLowerCase()}`
  if (cache.has(cacheKey)) return cache.get(cacheKey) ?? null

  let category: string | null = null
  if (CATEGORY_AUTO_DETECT_SUPPORTED && appPath) {
    const raw = await runCommand('mdls', ['-raw', '-name', 'kMDItemAppStoreCategory', appPath])
    category = raw && raw !== '(null)' ? formatCategory(raw) : null
  }
  if (!category) category = lookupKnownCategory(appName)

  cache.set(cacheKey, category)
  return category
}
