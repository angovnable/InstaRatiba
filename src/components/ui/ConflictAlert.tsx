// ConflictAlert — Emil Kowalski: left-rule accent, tight copy,
// no heavy red fills. Severity communicated through restraint.

import type { Conflict } from '@/types'

interface ConflictAlertProps {
  conflict: Conflict
  onJumpTo?: () => void
  onResolve?: () => void
}

export default function ConflictAlert({ conflict, onJumpTo, onResolve }: ConflictAlertProps) {
  const hard = conflict.severity === 'hard'
  const rule  = hard ? '#A01F1F' : '#C8922A'
  const bg    = hard ? 'rgba(160,31,31,0.04)' : 'rgba(200,146,42,0.05)'
  const icon  = hard ? 'bi-x-circle-fill' : 'bi-exclamation-triangle-fill'

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 8,
        borderLeft: `2px solid ${rule}`,
        background: bg,
        marginBottom: 8,
      }}
    >
      <i
        className={icon}
        style={{ color: rule, fontSize: '0.85rem', marginTop: 1, flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 600,
          fontSize: '0.68rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: rule,
          marginBottom: 3,
        }}>
          {hard ? 'Hard Conflict' : 'Warning'}
        </p>
        <p style={{
          fontFamily: "'Figtree', sans-serif",
          fontSize: '0.8rem',
          color: '#1C2B22',
          lineHeight: 1.5,
        }}>
          {conflict.description}
        </p>
        {(onJumpTo || onResolve) && (
          <div style={{ display: 'flex', gap: 14, marginTop: 7 }}>
            {onJumpTo && (
              <button onClick={onJumpTo} style={{
                fontFamily: "'Outfit', sans-serif", fontSize: '0.72rem', fontWeight: 600,
                color: rule, background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, textDecoration: 'underline', textUnderlineOffset: 2,
              }}>
                Jump to →
              </button>
            )}
            {onResolve && !hard && (
              <button onClick={onResolve} style={{
                fontFamily: "'Outfit', sans-serif", fontSize: '0.72rem', fontWeight: 500,
                color: '#7A8C82', background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, textDecoration: 'underline', textUnderlineOffset: 2,
              }}>
                Mark resolved
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
