// ============================================================
// InstaRatiba — src/components/layout/PwaProvider.tsx
// Wraps the app to provide PWA sync state (online status,
// queue size, sync functions) via context.
// Also mounts the <OfflineBanner /> globally.
// ============================================================

import { createContext, useContext, type ReactNode } from 'react'
import { usePwaSync }                                from '@/hooks/usePwaSync'
import OfflineBanner                                 from './OfflineBanner'
import type { SyncState }                            from '@/hooks/usePwaSync'

type PwaContextValue = {
  isOnline:     boolean
  queueSize:    number
  syncState:    SyncState
  syncMsg:      string
  manualSync:   () => Promise<void>
  clearOnSignOut: () => Promise<void>
}

const PwaContext = createContext<PwaContextValue | null>(null)

export function PwaProvider({ children }: { children: ReactNode }) {
  const pwa = usePwaSync()

  return (
    <PwaContext.Provider value={pwa}>
      <OfflineBanner />
      {children}
    </PwaContext.Provider>
  )
}

// ── Convenience hook ─────────────────────────────────────────
export function usePwaContext(): PwaContextValue {
  const ctx = useContext(PwaContext)
  if (!ctx) throw new Error('usePwaContext must be used inside <PwaProvider>')
  return ctx
}
