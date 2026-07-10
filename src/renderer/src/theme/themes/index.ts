// One file per theme (this directory) so adding or tweaking a theme never
// means hunting through a shared switch-statement — each file owns its own
// colors, card tint, and (for effect themes) its animated decoration.
import { indigo } from './indigo'
import { ocean } from './ocean'
import { sunset } from './sunset'
import { forest } from './forest'
import { grape } from './grape'
import { rose } from './rose'
import { gold } from './gold'
import { midnight } from './midnight'
import { doge } from './doge'
import { sakura } from './sakura'
import { underwater } from './underwater'
import { snow } from './snow'
import { summer } from './summer'
import { hacker } from './hacker'
import { antigravity } from './antigravity'
import type { Gradient } from './types'

export const THEMES: Gradient[] = [
  indigo,
  ocean,
  sunset,
  forest,
  grape,
  rose,
  gold,
  midnight,
  doge,
  sakura,
  underwater,
  snow,
  summer,
  hacker,
  antigravity
]

export type { Decoration, DecorationProps, Gradient, GradientKind } from './types'
