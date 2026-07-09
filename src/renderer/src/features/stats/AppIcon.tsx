import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import './AppIcon.css'

const iconCache = new Map<string, string | null>()

type AppIconProps = {
  path: string | null | undefined
  label: string
  size?: number
}

export default function AppIcon({ path, label, size = 18 }: AppIconProps): JSX.Element {
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
  return (
    <span className="app-icon app-icon--fallback" style={style}>
      {label.charAt(0).toUpperCase()}
    </span>
  )
}
