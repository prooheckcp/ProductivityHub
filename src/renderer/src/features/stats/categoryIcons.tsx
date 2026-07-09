import type { JSX } from 'react'
import {
  ChatIcon,
  ChecklistIcon,
  CodeIcon,
  GlobeIcon,
  PaletteIcon,
  PlayIcon,
  TagIcon,
  WrenchIcon,
  type IconProps
} from '../../components/icons'

type IconComponent = (props: IconProps) => JSX.Element

const CATEGORY_ICONS: Record<string, IconComponent> = {
  'Developer Tools': CodeIcon,
  'Web Browser': GlobeIcon,
  Communication: ChatIcon,
  'Social Networking': ChatIcon,
  Design: PaletteIcon,
  'Graphics & Design': PaletteIcon,
  Productivity: ChecklistIcon,
  Business: ChecklistIcon,
  Entertainment: PlayIcon,
  Music: PlayIcon,
  Games: PlayIcon,
  Utilities: WrenchIcon
}

export function getCategoryIcon(category: string): IconComponent {
  return CATEGORY_ICONS[category] ?? TagIcon
}
