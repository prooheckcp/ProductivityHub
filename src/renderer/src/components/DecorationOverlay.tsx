import type { JSX } from 'react'
import { useTheme } from '../theme/ThemeContext'
import './DecorationOverlay.css'

export default function DecorationOverlay(): JSX.Element | null {
  const { backgroundGradient } = useTheme()
  const Decoration = backgroundGradient.Decoration
  if (!Decoration) return null
  return <Decoration tint={backgroundGradient.contrast} />
}
