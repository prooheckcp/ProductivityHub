import { createContext, useContext } from 'react'
import type { JSX, ReactNode } from 'react'
import { useClock as useClockState } from './useClock'

type ClockContextValue = ReturnType<typeof useClockState>

const ClockContext = createContext<ClockContextValue | null>(null)

export function ClockProvider({ children }: { children: ReactNode }): JSX.Element {
  const value = useClockState()
  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>
}

export function useClockContext(): ClockContextValue {
  const ctx = useContext(ClockContext)
  if (!ctx) throw new Error('useClockContext must be used within a ClockProvider')
  return ctx
}
