// Card — Emil Kowalski design language
// Hairline borders, precise layering, no heavy drop shadows

import React from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  lift?: boolean
  flat?: boolean
  onClick?: () => void
  padding?: number | string
}

export function Card({ children, className = '', style = {}, lift = false, flat = false, onClick, padding = 20 }: CardProps) {
  const base: React.CSSProperties = {
    background: 'white',
    border: '1px solid #EDE7D9',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: flat ? 'none' : '0 1px 3px rgba(13,61,35,0.05), 0 4px 12px rgba(13,61,35,0.04)',
    cursor: onClick ? 'pointer' : undefined,
    ...style,
  }

  if (lift || onClick) {
    return (
      <motion.div
        whileHover={{ y: -1, boxShadow: '0 2px 8px rgba(13,61,35,0.07), 0 8px 24px rgba(13,61,35,0.07)', borderColor: 'rgba(200,146,42,0.25)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        onClick={onClick}
        style={base}
        className={className}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div style={base} className={className} onClick={onClick}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
  icon?: string
}

export function CardHeader({ children, action, className = '', icon }: CardHeaderProps) {
  return (
    <div
      className={className}
      style={{
        padding: '14px 18px',
        borderBottom: '1px solid #EDE7D9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {icon && (
          <i className={icon} style={{ color: '#C8922A', fontSize: '0.9rem', flexShrink: 0 }} />
        )}
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 600,
            fontSize: '0.855rem',
            color: '#1C2B22',
            letterSpacing: '-0.012em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {children}
        </span>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}

export function CardBody({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={className} style={{ padding: 18, ...style }}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        padding: '11px 18px',
        borderTop: '1px solid #EDE7D9',
        background: 'rgba(247,245,239,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {children}
    </div>
  )
}
