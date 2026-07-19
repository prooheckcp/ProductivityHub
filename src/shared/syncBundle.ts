import type { AppSettings, DataBundle } from './types'

// Settings that live only on this machine and must never sync to the cloud.
// Everything else in AppSettings (the theme fields) does sync.
export const MACHINE_ONLY_SETTING_KEYS = ['launchAtLogin', 'showTimerOverlay'] as const

// The subset of settings that syncs across devices (theme).
export type SyncedSettings = Pick<AppSettings, 'backgroundGradient' | 'font' | 'textColor'>

export function pickSyncedSettings(settings: AppSettings): SyncedSettings {
  return {
    backgroundGradient: settings.backgroundGradient,
    font: settings.font,
    textColor: settings.textColor
  }
}

// Total tracked time across every source, used as the anti-cheat aggregate the
// server validates. Summing completed sessions keeps it monotonic (it only ever
// grows), so an implausible jump is easy to detect.
export function computeTotalTrackedMs(bundle: Pick<DataBundle, 'timerSessions' | 'appUsageSessions' | 'codingSessions'>): number {
  const sum = (arr: { durationMs: number }[]): number => arr.reduce((total, s) => total + (s.durationMs || 0), 0)
  return sum(bundle.timerSessions) + sum(bundle.appUsageSessions) + sum(bundle.codingSessions)
}
