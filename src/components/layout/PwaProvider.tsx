// ============================================================
// InstaRatiba — src/components/layout/PwaProvider.tsx
// Wraps the app to provide PWA sync state (online status,
// queue size, sync functions) via context.
// Also mounts the <OfflineBanner /> globally.
// ============================================================

import { type ReactNode } from 'react'
import { usePwaSync }     from '@/hooks/usePwaSync'
import OfflineBanner      from './OfflineBanner'
import { PwaContext }     from './usePwaContext'

export function PwaProvider({ children }: { children: ReactNode }) {
  const pwa = usePwaSync()

  return (
    <PwaContext.Provider value={pwa}>
      <OfflineBanner />
      {children}
    </PwaContext.Provider>
  )
}
