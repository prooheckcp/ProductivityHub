import { useCallback, useEffect, useState } from 'react'
import type { Timer, TimerFormInput } from '@shared/types'

export function useTimers() {
  const [timers, setTimers] = useState<Timer[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    window.api.timers.list().then((list) => {
      setTimers(list)
      setLoading(false)
    })
  }, [])

  // Drive the live clock with requestAnimationFrame, sampling Date.now() every
  // frame and *immediately* on start. setInterval was stale on the first render
  // after pressing start (it only ticked while something was already running)
  // and drifts/gets throttled in the background — that caused skipped seconds
  // and, for countdown timers, a huge wrong value flashing on start.
  useEffect(() => {
    const hasRunning = timers.some((timer) => timer.runningSince !== null)
    if (!hasRunning) return
    let raf = 0
    const tick = (): void => {
      setNow(Date.now())
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [timers])

  const createTimer = useCallback(async (input: TimerFormInput) => {
    const timer = await window.api.timers.create(input)
    setTimers((prev) => [...prev, timer])
    return timer
  }, [])

  const updateTimer = useCallback(async (id: string, patch: TimerFormInput) => {
    const timer = await window.api.timers.update(id, patch)
    setTimers((prev) => prev.map((t) => (t.id === id ? timer : t)))
    return timer
  }, [])

  const removeTimer = useCallback(async (id: string) => {
    await window.api.timers.remove(id)
    setTimers((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const startTimer = useCallback(async (id: string) => {
    const timer = await window.api.timers.start(id)
    setTimers((prev) => prev.map((t) => (t.id === id ? timer : t)))
    return timer
  }, [])

  const pauseTimer = useCallback(async (id: string) => {
    const timer = await window.api.timers.pause(id)
    setTimers((prev) => prev.map((t) => (t.id === id ? timer : t)))
    return timer
  }, [])

  const resetTimer = useCallback(async (id: string) => {
    const timer = await window.api.timers.reset(id)
    setTimers((prev) => prev.map((t) => (t.id === id ? timer : t)))
    return timer
  }, [])

  const setManualTime = useCallback(async (id: string, ms: number) => {
    const timer = await window.api.timers.setManualTime(id, ms)
    setTimers((prev) => prev.map((t) => (t.id === id ? timer : t)))
    return timer
  }, [])

  return {
    timers,
    loading,
    now,
    createTimer,
    updateTimer,
    removeTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    setManualTime
  }
}
