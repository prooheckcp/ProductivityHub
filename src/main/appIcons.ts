import { app } from 'electron'

const cache = new Map<string, string | null>()

export async function getAppIconDataUrl(appPath: string | null): Promise<string | null> {
  if (!appPath) return null
  if (cache.has(appPath)) return cache.get(appPath) ?? null
  try {
    const icon = await app.getFileIcon(appPath, { size: 'normal' })
    const dataUrl = icon.isEmpty() ? null : icon.toDataURL()
    cache.set(appPath, dataUrl)
    return dataUrl
  } catch {
    cache.set(appPath, null)
    return null
  }
}
