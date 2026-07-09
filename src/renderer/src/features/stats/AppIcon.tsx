import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { getCachedIcon, resolveAppIcon } from './appIconCache'
import { getCategoryIcon } from './categoryIcons'
import './AppIcon.css'

type AppIconProps = {
  path: string | null | undefined
  label: string
  category?: string | null
  size?: number
}

export default function AppIcon({ path, label, category, size = 18 }: AppIconProps): JSX.Element {
  const [icon, setIcon] = useState<string | null>(path ? getCachedIcon(path) ?? null : null)

  useEffect(() => {
    if (!path) {
      setIcon(null)
      return
    }
    const cached = getCachedIcon(path)
    if (cached !== undefined) {
      setIcon(cached)
      return
    }
    resolveAppIcon(path).then(setIcon)
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
