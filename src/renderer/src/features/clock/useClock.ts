import { useCallback, useEffect, useState } from 'react'
import type { Alarm, AlarmFormInput, CountdownTimer, CountdownTimerFormInput } from '@shared/types'

// The background watcher can auto-finish a countdown timer or auto-disable a
// one-time alarm on its own, with no renderer action involved — poll on this
// interval (on top of optimistic local updates from user actions) to pick
// that up.
const LIST_POLL_MS = 3000

export function useClock() {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [countdownTimers, setCountdownTimers] = useState<CountdownTimer[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())

  const refresh = useCallback(async () => {
    const [alarmList, timerList] = await Promise.all([window.api.clock.alarms.list(), window.api.clock.timers.list()])
    setAlarms(alarmList)
    setCountdownTimers(timerList)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const interval = setInterval(refresh, LIST_POLL_MS)
    return () => clearInterval(interval)
  }, [refresh])

  useEffect(() => {
    const hasRunning = countdownTimers.some((t) => t.status === 'running')
    if (!hasRunning) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [countdownTimers])

  const createAlarm = useCallback(async (input: AlarmFormInput) => {
    const alarm = await window.api.clock.alarms.create(input)
    setAlarms((prev) => [...prev, alarm])
    return alarm
  }, [])

  const updateAlarm = useCallback(async (id: string, patch: AlarmFormInput) => {
    const alarm = await window.api.clock.alarms.update(id, patch)
    setAlarms((prev) => prev.map((a) => (a.id === id ? alarm : a)))
    return alarm
  }, [])

  const removeAlarm = useCallback(async (id: string) => {
    await window.api.clock.alarms.remove(id)
    setAlarms((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const setAlarmEnabled = useCallback(async (alarm: Alarm, enabled: boolean) => {
    const updated = await window.api.clock.alarms.update(alarm.id, {
      name: alarm.name,
      hour: alarm.hour,
      minute: alarm.minute,
      repeat: alarm.repeat,
      daysOfWeek: alarm.daysOfWeek,
      enabled
    })
    setAlarms((prev) => prev.map((a) => (a.id === alarm.id ? updated : a)))
    return updated
  }, [])

  const createCountdownTimer = useCallback(async (input: CountdownTimerFormInput) => {
    const timer = await window.api.clock.timers.create(input)
    setCountdownTimers((prev) => [...prev, timer])
    return timer
  }, [])

  const removeCountdownTimer = useCallback(async (id: string) => {
    await window.api.clock.timers.remove(id)
    setCountdownTimers((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const startCountdownTimer = useCallback(async (id: string) => {
    const timer = await window.api.clock.timers.start(id)
    setCountdownTimers((prev) => prev.map((t) => (t.id === id ? timer : t)))
    return timer
  }, [])

  const pauseCountdownTimer = useCallback(async (id: string) => {
    const timer = await window.api.clock.timers.pause(id)
    setCountdownTimers((prev) => prev.map((t) => (t.id === id ? timer : t)))
    return timer
  }, [])

  const restartCountdownTimer = useCallback(async (id: string) => {
    const timer = await window.api.clock.timers.restart(id)
    setCountdownTimers((prev) => prev.map((t) => (t.id === id ? timer : t)))
    return timer
  }, [])

  return {
    alarms,
    countdownTimers,
    loading,
    now,
    createAlarm,
    updateAlarm,
    removeAlarm,
    setAlarmEnabled,
    createCountdownTimer,
    removeCountdownTimer,
    startCountdownTimer,
    pauseCountdownTimer,
    restartCountdownTimer
  }
}
