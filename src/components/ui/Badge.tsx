// Badge — InstaRatiba Kenyan/EAC Theme
// bi-circle-fill dot + label, Outfit 500, semantic colours

import React from 'react'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gold'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  icon?: string
  dot?: boolean          // show coloured dot instead of icon
  className?: string
  style?: React.CSSProperties
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string; dot: string }> = {
  success: { bg: 'rgba(13,61,35,0.08)',   color: '#0D3D23', dot: '#0D3D23' },
  warning: { bg: 'rgba(200,146,42,0.10)', color: '#8A6010', dot: '#C8922A' },
  error:   { bg: 'rgba(160,31,31,0.08)',  color: '#A01F1F', dot: '#A01F1F' },
  info:    { bg: 'rgba(30,92,138,0.08)',  color: '#1E5C8A', dot: '#1E5C8A' },
  neutral: { bg: 'rgba(122,140,130,0.10)', color: '#4A5E52', dot: '#7A8C82' },
  gold:    { bg: 'rgba(200,146,42,0.10)', color: '#C8922A', dot: '#C8922A' },
}

export default function Badge({ variant = 'neutral', children, icon, dot, className = '', style }: BadgeProps) {
  const vs = variantStyles[variant]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${className}`}
      style={{
        background: vs.bg,
        color: vs.color,
        fontFamily: 'var(--font-ui)',
        fontSize: '0.72rem',
        fontWeight: 500,
        letterSpacing: '0.02em',
        ...style,
      }}
    >
      {dot && (
        <i className="bi-circle-fill text-[6px]" style={{ color: vs.dot }} />
      )}
      {icon && !dot && <i className={`${icon} text-xs`} />}
      {children}
    </span>
  )
}
