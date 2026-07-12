import { useEffect, useState } from 'react'

// Single shared source of truth for "which timers are pinned to the overlay",
// mirrored from the main process. All consumers (the app's pin buttons, the
// in-app corner display, and the overlay window) share one fetch + one
// 'overlay:pins-changed' subscription instead of each opening their own.
let pins = new Set<string>()
const listeners = new Set<() => void>()
let started = false

function notify(): void {
  for (const l of listeners) l()
}

async function reload(): Promise<void> {
  const list = await window.api.overlay.pins.list()
  pins = new Set(list)
  notify()
}

function start(): void {
  if (started) return
  started = true
  void reload()
  window.api.overlay.onPinsChanged(() => void reload())
}

export type OverlayPins = {
  pins: Set<string>
  isPinned: (key: string) => boolean
  setPinned: (key: string, pinned: boolean) => void
  toggle: (key: string) => void
}

export function useOverlayPins(): OverlayPins {
  const [, force] = useState(0)
  useEffect(() => {
    start()
    const l = (): void => force((n) => n + 1)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])

  const setPinned = (key: string, pinned: boolean): void => {
    // Optimistic local update so the button flips instantly; the broadcast
    // reload confirms it (and syncs the other window).
    pins = new Set(pins)
    if (pinned) pins.add(key)
    else pins.delete(key)
    notify()
    void window.api.overlay.pins.set(key, pinned)
  }

  return {
    pins,
    isPinned: (key) => pins.has(key),
    setPinned,
    toggle: (key) => setPinned(key, !pins.has(key))
  }
}
