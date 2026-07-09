import { spawn } from 'child_process'
import { platform } from 'process'

// macOS bundles ship an App Store category in Info.plist (LSApplicationCategoryType),
// readable via Spotlight metadata without extra permissions. Windows has no equivalent
// standard metadata for arbitrary installed programs, so category breakdown is mac-only.
export const CATEGORY_SUPPORTED = platform === 'darwin'

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

export async function getAppCategory(appPath: string | null): Promise<string | null> {
  if (!CATEGORY_SUPPORTED || !appPath) return null
  if (cache.has(appPath)) return cache.get(appPath) ?? null
  const raw = await runCommand('mdls', ['-raw', '-name', 'kMDItemAppStoreCategory', appPath])
  const category = raw && raw !== '(null)' ? formatCategory(raw) : null
  cache.set(appPath, category)
  return category
}
