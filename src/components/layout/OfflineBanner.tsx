// ============================================================
// InstaRatiba — src/components/layout/OfflineBanner.tsx
// Persistent top banner shown when the device is offline.
// Shows queued action count + "Retry now" button.
// Consumes usePwaSync from the PwaProvider context.
// ============================================================

import { AnimatePresence, motion } from 'framer-motion'
import { usePwaContext }           from './PwaProvider'

export default function OfflineBanner() {
  const { isOnline, queueSize, syncState, syncMsg, manualSync } = usePwaContext()

  // Syncing state — separate visual
  const isSyncing = syncState === 'syncing'

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline-banner"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: -48,  opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="
            fixed top-0 left-0 right-0 z-[1100]
            bg-[#37474F] text-white
            flex items-center justify-between
            px-4 py-2 gap-3 text-sm
            shadow-lg
          "
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-2 min-w-0">
            <i className="bi bi-wifi-off text-base flex-shrink-0" aria-hidden="true" />
            <span className="font-medium font-body">
              You are offline
              {queueSize > 0 && (
                <span className="ml-1 text-[#A5D6A7]">
                  — {queueSize} change{queueSize > 1 ? 's' : ''} queued
                </span>
              )}
            </span>
            {isSyncing && syncMsg && (
              <span className="text-xs text-[#A5D6A7] hidden sm:inline truncate">
                {syncMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Animated Wi-Fi pulse when syncing */}
            {isSyncing && (
              <span className="flex items-center gap-1 text-xs text-[#A5D6A7]">
                <span
                  className="inline-block w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse"
                  aria-hidden="true"
                />
                Syncing…
              </span>
            )}

            {/* Retry button — only shown when offline and not syncing */}
            {!isSyncing && (
              <button
                onClick={manualSync}
                className="
                  text-xs px-3 py-1 rounded-full
                  bg-white/10 hover:bg-white/20
                  transition-colors duration-150
                  font-body font-medium
                  focus:outline-none focus:ring-2 focus:ring-white/40
                "
                aria-label="Retry sync now"
              >
                Retry now
              </button>
            )}

            {/* Dismiss — only informational; banner returns if still offline */}
            <span className="text-[10px] text-white/50 hidden md:inline">
              Changes will sync when reconnected
            </span>
          </div>
        </motion.div>
      )}

      {/* Sync-done confirmation flash (shown briefly after going back online) */}
      {isOnline && syncState === 'done' && (
        <motion.div
          key="sync-done-banner"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: -48,  opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="
            fixed top-0 left-0 right-0 z-[1100]
            bg-[#2E7D32] text-white
            flex items-center justify-center
            px-4 py-2 gap-2 text-sm
            shadow-lg
          "
          role="status"
        >
          <i className="bi bi-check-circle-fill text-base" aria-hidden="true" />
          <span className="font-body font-medium">Back online — all changes synced.</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
