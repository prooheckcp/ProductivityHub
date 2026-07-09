import type { AppSettings } from '../../shared/types'
import { dataFile } from './paths'
import { readJsonFile, writeJsonFile } from './jsonFile'

const settingsFile = (): string => dataFile('settings.json')

const DEFAULT_SETTINGS: AppSettings = {
  backgroundGradient: 'indigo',
  font: 'system',
  textColor: null
}

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...readJsonFile<Partial<AppSettings>>(settingsFile(), {}) }
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const merged = { ...getSettings(), ...patch }
  writeJsonFile(settingsFile(), merged)
  return merged
}

export function setSettings(settings: AppSettings): void {
  writeJsonFile(settingsFile(), settings)
}
