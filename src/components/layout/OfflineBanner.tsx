import { AnimatePresence, motion } from 'framer-motion'
import { usePwaContext } from './usePwaContext'

export default function OfflineBanner() {
  const { isOnline, queueSize, syncState, syncMsg, manualSync } = usePwaContext()
  const isSyncing = syncState === 'syncing'

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline-banner"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            zIndex: 1100,
            background: '#1C2B22',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            gap: 12,
            boxShadow: '0 2px 12px rgba(13,61,35,0.2)',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <i className="bi bi-wifi-off text-base flex-shrink-0" style={{ color: '#C8922A' }} aria-hidden="true" />
            <span style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 500, fontSize: '0.875rem' }}>
              You are offline
              {queueSize > 0 && (
                <span style={{ marginLeft: 6, color: '#C8922A', fontSize: '0.8rem' }}>
                  — {queueSize} change{queueSize > 1 ? 's' : ''} queued
                </span>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {isSyncing && (
              <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: '0.75rem', color: '#C8922A', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C8922A', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                {syncMsg || 'Syncing…'}
              </span>
            )}
            {!isSyncing && (
              <button
                onClick={manualSync}
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  padding: '4px 12px',
                  borderRadius: 999,
                  background: 'rgba(200,146,42,0.15)',
                  border: '1px solid rgba(200,146,42,0.3)',
                  color: '#C8922A',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                aria-label="Retry sync now"
              >
                Retry now
              </button>
            )}
          </div>
        </motion.div>
      )}

      {isOnline && syncState === 'done' && (
        <motion.div
          key="sync-done-banner"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            zIndex: 1100,
            background: '#0D3D23',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 16px',
            gap: 8,
            boxShadow: '0 2px 12px rgba(13,61,35,0.2)',
          }}
          role="status"
        >
          <i className="bi bi-check-circle-fill" style={{ color: '#C8922A' }} aria-hidden="true" />
          <span style={{ fontFamily: "'Figtree', sans-serif", fontWeight: 500, fontSize: '0.875rem' }}>
            Back online — all changes synced.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
