import { createContext, useContext } from 'react'
import type { JSX, ReactNode } from 'react'
import { useTimers as useTimersState } from './useTimers'

type TimersContextValue = ReturnType<typeof useTimersState>

const TimersContext = createContext<TimersContextValue | null>(null)

export function TimersProvider({ children }: { children: ReactNode }): JSX.Element {
  const value = useTimersState()
  return <TimersContext.Provider value={value}>{children}</TimersContext.Provider>
}

export function useTimersContext(): TimersContextValue {
  const ctx = useContext(TimersContext)
  if (!ctx) throw new Error('useTimersContext must be used within a TimersProvider')
  return ctx
}
