import { useCallback, useEffect, useState } from 'react'
import type { Timer, TimerFormInput } from '@shared/types'

export function useTimers() {
  const [timers, setTimers] = useState<Timer[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())

  // Re-fetch from the main store, but keep the SAME array reference when nothing
  // relevant changed — otherwise every poll would restart the RAF clock effect
  // below. This is also what keeps the page in sync with the floating overlay
  // window (a separate renderer): pausing/starting there updates the store, and
  // this poll reflects it here within ~1s instead of the page ticking a phantom
  // time and then "reverting" when you press pause on the page.
  const refresh = useCallback(async () => {
    const list = await window.api.timers.list()
    setTimers((prev) => {
      const unchanged =
        prev.length === list.length &&
        prev.every((t, i) => {
          const n = list[i]
          return (
            n &&
            t.id === n.id &&
            t.runningSince === n.runningSince &&
            t.accumulatedMs === n.accumulatedMs &&
            t.updatedAt === n.updatedAt
          )
        })
      return unchanged ? prev : list
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const poll = setInterval(refresh, 1000)
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(poll)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

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
