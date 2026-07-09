import { ElectronAPI } from '@electron-toolkit/preload'
import type { Timer, StatsResult, StatsRangeKey, TimerFormInput } from '../shared/types'

export type Api = {
  timers: {
    list: () => Promise<Timer[]>
    create: (input: TimerFormInput) => Promise<Timer>
    update: (id: string, patch: TimerFormInput) => Promise<Timer>
    remove: (id: string) => Promise<void>
    start: (id: string) => Promise<Timer>
    pause: (id: string) => Promise<Timer>
    reset: (id: string) => Promise<Timer>
    setManualTime: (id: string, ms: number) => Promise<Timer>
  }
  images: {
    saveTimerImage: (fileName: string, data: Uint8Array) => Promise<string>
    deleteImage: (path: string) => Promise<void>
  }
  stats: {
    get: (range: StatsRangeKey) => Promise<StatsResult>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
