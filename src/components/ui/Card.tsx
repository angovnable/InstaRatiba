import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  lift?: boolean      // hover lift effect
  flat?: boolean      // border only, no shadow
  onClick?: () => void
}

export function Card({ children, className = '', lift = false, flat = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-white rounded-lg border border-[#e4ece6] overflow-hidden',
        flat ? '' : 'shadow-sm',
        lift ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : '',
        onClick ? 'cursor-pointer' : '',
        className,
      ].join(' ')}
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
    <div className={`px-5 py-4 border-b border-[#f0f5f1] flex items-center justify-between ${className}`}>
      <div className="font-display font-semibold text-sm text-ir-text">{children}</div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-5 py-3 border-t border-[#f0f5f1] bg-[#fafcfb] flex items-center gap-2 ${className}`}>
      {children}
    </div>
  )
}
