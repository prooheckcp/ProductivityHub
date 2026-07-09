const iconCache = new Map<string, string | null>()

export function getCachedIcon(path: string): string | null | undefined {
  return iconCache.get(path)
}

export async function resolveAppIcon(path: string): Promise<string | null> {
  if (iconCache.has(path)) return iconCache.get(path) ?? null
  const dataUrl = await window.api.apps.getIcon(path)
  iconCache.set(path, dataUrl)
  return dataUrl
}
