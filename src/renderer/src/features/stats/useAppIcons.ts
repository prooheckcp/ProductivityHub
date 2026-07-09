import { useEffect, useState } from 'react'
import type { StatsEntry } from '@shared/types'
import { getCachedIcon, resolveAppIcon } from './appIconCache'

/** Resolves each entry's app icon (keyed by label, since that's what chart
 * ticks/legends have on hand) using the same cache AppIcon draws from. */
export function useAppIcons(entries: StatsEntry[]): Record<string, string | null> {
  const depKey = entries.map((e) => `${e.label}${e.appPath ?? ''}`).join('')
  const [icons, setIcons] = useState<Record<string, string | null>>({})

  useEffect(() => {
    let cancelled = false
    for (const entry of entries) {
      if (!entry.appPath) continue
      const cached = getCachedIcon(entry.appPath)
      if (cached !== undefined) {
        setIcons((prev) => (prev[entry.label] === cached ? prev : { ...prev, [entry.label]: cached }))
        continue
      }
      resolveAppIcon(entry.appPath).then((url) => {
        if (!cancelled) setIcons((prev) => ({ ...prev, [entry.label]: url }))
      })
    }
    return () => {
      cancelled = true
    }
  }, [depKey])

  return icons
}
