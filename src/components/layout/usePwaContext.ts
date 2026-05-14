// ============================================================
// InstaRatiba — src/components/layout/usePwaContext.ts
// Extracted from PwaProvider.tsx to satisfy fast-refresh rule:
// a file must only export components OR hooks, not both.
// ============================================================

import { useContext, createContext } from 'react'
import type { SyncState } from '@/hooks/usePwaSync'

export type PwaContextValue = {
  isOnline:       boolean
  queueSize:      number
  syncState:      SyncState
  syncMsg:        string
  manualSync:     () => Promise<void>
  clearOnSignOut: () => Promise<void>
}

export const PwaContext = createContext<PwaContextValue | null>(null)

export function usePwaContext(): PwaContextValue {
  const ctx = useContext(PwaContext)
  if (!ctx) throw new Error('usePwaContext must be used inside <PwaProvider>')
  return ctx
}
