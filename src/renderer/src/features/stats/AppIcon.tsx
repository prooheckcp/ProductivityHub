import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { getCategoryIcon } from './categoryIcons'
import './AppIcon.css'

const iconCache = new Map<string, string | null>()

type AppIconProps = {
  path: string | null | undefined
  label: string
  category?: string | null
  size?: number
}

export default function AppIcon({ path, label, category, size = 18 }: AppIconProps): JSX.Element {
  const [icon, setIcon] = useState<string | null>(path ? iconCache.get(path) ?? null : null)

  useEffect(() => {
    if (!path) {
      setIcon(null)
      return
    }
    if (iconCache.has(path)) {
      setIcon(iconCache.get(path) ?? null)
      return
    }
    window.api.apps.getIcon(path).then((dataUrl) => {
      iconCache.set(path, dataUrl)
      setIcon(dataUrl)
    })
  }, [path])

  const style = { width: size, height: size }

  if (icon) {
    return <img className="app-icon" style={style} src={icon} alt="" />
  }

  // The real app icon isn't always resolvable (background/helper processes,
  // apps without a Launch Services entry...) — fall back to the same icon
  // used for that app's category in the filter pills, which is at least
  // meaningful, instead of a bare letter.
  const CategoryIcon = getCategoryIcon(category ?? 'Uncategorized')
  return (
    <span className="app-icon app-icon--fallback" style={style} title={label}>
      <CategoryIcon size={Math.round(size * 0.65)} />
    </span>
  )
}
