type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  icon?: string
  className?: string
}

const variantClass: Record<BadgeVariant, string> = {
  success: 'bg-[#E8F5E9] text-primary',
  warning: 'bg-[#FFF8E1] text-[#E65100]',
  error:   'bg-[#FFEBEE] text-[#C62828]',
  info:    'bg-[#E3F2FD] text-info',
  neutral: 'bg-[#F5F5F5] text-[#616161]',
}

export default function Badge({ variant = 'neutral', children, icon, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'text-xs font-bold tracking-wide',
        variantClass[variant],
        className,
      ].join(' ')}
    >
      {icon && <i className={`${icon} text-xs`} />}
      {children}
    </span>
  )
}
