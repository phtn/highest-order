'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type EviDebugEntry = {
  ts: string
  msg: string
}

type EviDebugContextValue = {
  logs: EviDebugEntry[]
  log: (msg: string) => void
  clear: () => void
}

const EviDebugContext = createContext<EviDebugContextValue | null>(null)

export function EviDebugProvider({children}: {children: ReactNode}) {
  const [logs, setLogs] = useState<EviDebugEntry[]>([])

  const log = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    setLogs((prev) => [...prev.slice(-99), {ts, msg}])
  }, [])

  const clear = useCallback(() => setLogs([]), [])

  const value = useMemo(() => ({logs, log, clear}), [logs, log, clear])

  return (
    <EviDebugContext.Provider value={value}>
      {children}
    </EviDebugContext.Provider>
  )
}

export function useEviDebug() {
  const ctx = useContext(EviDebugContext)
  return ctx ?? {logs: [], log: () => {}, clear: () => {}}
}
