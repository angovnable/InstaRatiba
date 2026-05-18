// Badge — Emil Kowalski: no borders by default, just colour fields.
// Tiny, precise. Never shouts.

import React from 'react'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  icon?: string
  dot?: boolean
  className?: string
}

const STYLES: Record<BadgeVariant, React.CSSProperties> = {
  success: { background: 'rgba(13,61,35,0.08)',   color: '#0D3D23' },
  warning: { background: 'rgba(200,146,42,0.10)', color: '#9B6E1A' },
  error:   { background: 'rgba(160,31,31,0.08)',  color: '#A01F1F' },
  info:    { background: 'rgba(30,92,138,0.08)',  color: '#1E5C8A' },
  neutral: { background: 'rgba(13,61,35,0.04)',   color: '#7A8C82' },
}

const DOT_COLORS: Record<BadgeVariant, string> = {
  success: '#0D3D23',
  warning: '#C8922A',
  error:   '#A01F1F',
  info:    '#1E5C8A',
  neutral: '#7A8C82',
}

export default function Badge({ variant = 'neutral', children, icon, dot = false, className = '' }: BadgeProps) {
  const s = STYLES[variant]
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: 99,
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 500,
        fontSize: '0.68rem',
        letterSpacing: '0.01em',
        ...s,
      }}
    >
      {dot && (
        <span style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: DOT_COLORS[variant],
          flexShrink: 0,
        }} />
      )}
      {icon && <i className={icon} style={{ fontSize: '0.7rem' }} />}
      {children}
    </span>
  )
}
