// ============================================================
// InstaRatiba — src/hooks/usePwaSync.ts
// Tracks online/offline status and replays the IndexedDB
// mutation queue when connectivity is restored.
// Exposes queue length for the offline banner.
// ============================================================

import { useEffect, useState, useCallback, useRef } from 'react'
import { toast }                                     from 'sonner'
import { getQueue, clearQueue }                      from '@/lib/pwa/syncQueue'
import { replayQueue }                               from '@/lib/pwa/replayQueue'

export type SyncState = 'idle' | 'syncing' | 'done' | 'error'

export function usePwaSync() {
  const [isOnline,   setIsOnline]   = useState(navigator.onLine)
  const [queueSize,  setQueueSize]  = useState(0)
  const [syncState,  setSyncState]  = useState<SyncState>('idle')
  const [syncMsg,    setSyncMsg]    = useState('')
  const isSyncing = useRef(false)

  // ── Poll queue size every 30 s ────────────────────────────
  const refreshQueueSize = useCallback(async () => {
    const q = await getQueue()
    setQueueSize(q.length)
  }, [])

  useEffect(() => {
    refreshQueueSize()
    const interval = setInterval(refreshQueueSize, 30_000)
    return () => clearInterval(interval)
  }, [refreshQueueSize])

  // ── Replay on reconnect ───────────────────────────────────
  const sync = useCallback(async () => {
    if (isSyncing.current) return
    isSyncing.current = true
    setSyncState('syncing')

    const toastId = toast.loading('Syncing offline changes…')

    try {
      const { succeeded, failed } = await replayQueue((done, total, label) => {
        setSyncMsg(`${label} (${done}/${total})`)
      })

      await refreshQueueSize()

      if (failed === 0) {
        setSyncState('done')
        toast.success(
          succeeded > 0
            ? `Sync complete — ${succeeded} change${succeeded > 1 ? 's' : ''} uploaded.`
            : 'Back online.',
          { id: toastId },
        )
      } else {
        setSyncState('error')
        toast.warning(
          `Sync partial — ${succeeded} uploaded, ${failed} failed and will retry.`,
          { id: toastId, duration: 6000 },
        )
      }
    } catch {
      setSyncState('error')
      toast.error('Sync failed — will retry when online.', { id: toastId })
    } finally {
      isSyncing.current = false
      setSyncMsg('')
      setTimeout(() => setSyncState('idle'), 3000)
    }
  }, [refreshQueueSize])

  // ── Online / offline event listeners ─────────────────────
  useEffect(() => {
    const handleOnline  = () => { setIsOnline(true);  sync() }
    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('You are offline — changes will sync when reconnected.', {
        duration: Infinity,
        id: 'offline-toast',
      })
    }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    // If we mounted while offline, reflect that immediately
    if (!navigator.onLine) handleOffline()

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
      toast.dismiss('offline-toast')
    }
  }, [sync])

  // ── Manual trigger (e.g. "Retry now" button) ─────────────
  const manualSync = useCallback(async () => {
    if (!isOnline) {
      toast.error('Still offline — cannot sync yet.')
      return
    }
    await sync()
  }, [isOnline, sync])

  // ── Clear queue (called on sign-out) ─────────────────────
  const clearOnSignOut = useCallback(async () => {
    await clearQueue()
    setQueueSize(0)
  }, [])

  return {
    isOnline,
    queueSize,
    syncState,
    syncMsg,
    manualSync,
    clearOnSignOut,
  }
}
