// Card — InstaRatiba Kenyan/EAC Theme
// Warm accent-light borders, green-tinted shadows, gold accent bar on CardHeader

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  lift?: boolean
  flat?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

export function Card({ children, className = '', lift = false, flat = false, onClick, style }: CardProps) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(lift)}
      onMouseLeave={() => setHovered(false)}
      className={`overflow-hidden ${className}`}
      style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #EDE7D9',
        boxShadow: hovered
          ? '0 8px 24px rgba(200,146,42,0.12)'
          : flat ? 'none' : '0 2px 12px rgba(13,61,35,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function CardHeader({ children, action, className = '' }: CardHeaderProps) {
  return (
    <div
      className={`px-5 py-4 flex items-center justify-between ${className}`}
      style={{ borderBottom: '1px solid #F5F0E8' }}
    >
      <div
        className="flex items-center gap-2 font-semibold text-sm"
        style={{ fontFamily: 'var(--font-ui)', color: '#1C2B22', fontWeight: 700 }}
      >
        {/* Gold left accent bar */}
        <span
          className="flex-shrink-0 rounded-full"
          style={{ width: 3, height: 16, background: '#C8922A', display: 'block' }}
        />
        {children}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`px-5 py-3 flex items-center gap-2 ${className}`}
      style={{ borderTop: '1px solid #F5F0E8', background: 'rgba(247,245,239,0.6)' }}
    >
      {children}
    </div>
  )
}
