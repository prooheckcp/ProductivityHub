import { randomUUID } from 'crypto'
import { execFile, execFileSync } from 'child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'
import { app } from 'electron'

const execFileAsync = promisify(execFile)

const cache = new Map<string, string | null>()

export async function getAppIconDataUrl(appPath: string | null): Promise<string | null> {
  if (!appPath) return null
  if (cache.has(appPath)) return cache.get(appPath) ?? null
  const dataUrl = await resolveIcon(appPath)
  cache.set(appPath, dataUrl)
  return dataUrl
}

async function resolveIcon(appPath: string): Promise<string | null> {
  if (process.platform === 'darwin') {
    // Electron's app.getFileIcon() returns a generic placeholder document icon
    // on macOS, never the app's real logo — so we pull the bundle's .icns file
    // and rasterize it ourselves. If that fails (e.g. the icon lives in an
    // asset catalog with no loose .icns), return null so the renderer falls
    // back to a category icon rather than showing a useless gray placeholder.
    if (!appPath.endsWith('.app')) return null
    const icns = findIcnsFile(appPath)
    if (!icns) return null
    return icnsToPngDataUrl(icns)
  }
  // Windows/Linux: Electron's file icon returns the real icon here.
  try {
    const icon = await app.getFileIcon(appPath, { size: 'normal' })
    return icon.isEmpty() ? null : icon.toDataURL()
  } catch {
    return null
  }
}

// Locate the .icns file inside a macOS .app bundle. Info.plist's
// CFBundleIconFile usually names it (sometimes without the .icns extension);
// if that's missing or empty (icon lives in an asset catalog), fall back to the
// first .icns we find in Contents/Resources.
function findIcnsFile(appPath: string): string | null {
  const resources = join(appPath, 'Contents', 'Resources')
  const named = readIconFileName(appPath)
  if (named) {
    const withExt = named.toLowerCase().endsWith('.icns') ? named : `${named}.icns`
    const full = join(resources, withExt)
    if (existsSync(full)) return full
  }
  try {
    const icns = readdirSync(resources).filter((f) => f.toLowerCase().endsWith('.icns'))
    if (icns.length > 0) {
      // Prefer a file that looks like an app icon over incidental doc icons.
      const preferred =
        icns.find((f) => /appicon|app-icon/i.test(f)) ??
        icns.find((f) => /icon/i.test(f)) ??
        icns[0]
      return join(resources, preferred)
    }
  } catch {
    // Resources dir unreadable — nothing to do.
  }
  return null
}

function readIconFileName(appPath: string): string | null {
  const plist = join(appPath, 'Contents', 'Info')
  try {
    const out = execFileSync('/usr/bin/defaults', ['read', plist, 'CFBundleIconFile'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    })
    return out.trim() || null
  } catch {
    return null
  }
}

async function icnsToPngDataUrl(icnsPath: string): Promise<string | null> {
  const tmp = mkdtempSync(join(tmpdir(), 'shibaicon-'))
  const out = join(tmp, `${randomUUID()}.png`)
  try {
    await execFileAsync('/usr/bin/sips', ['-s', 'format', 'png', '-z', '64', '64', icnsPath, '--out', out])
    const buf = readFileSync(out)
    if (buf.length === 0) return null
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    return null
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}
