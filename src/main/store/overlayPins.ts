import { dataFile } from './paths'
import { readJsonFile, writeJsonFile } from './jsonFile'

// Timers pinned to the floating overlay (and the in-app corner). Keys are
// `t:<id>` for count-up timers and `c:<id>` for countdown timers, so both kinds
// share one persisted list. Pinning is explicit (the pin button in the app) and
// survives restarts.
const pinsFile = (): string => dataFile('overlay-pins.json')

export function listOverlayPins(): string[] {
  return readJsonFile<string[]>(pinsFile(), [])
}

export function setOverlayPin(key: string, pinned: boolean): string[] {
  const current = new Set(listOverlayPins())
  if (pinned) current.add(key)
  else current.delete(key)
  const next = [...current]
  writeJsonFile(pinsFile(), next)
  return next
}

/** Drop a pin when its timer is deleted (called from the delete handlers). */
export function removeOverlayPin(key: string): void {
  const current = listOverlayPins()
  if (!current.includes(key)) return
  writeJsonFile(pinsFile(), current.filter((k) => k !== key))
}
