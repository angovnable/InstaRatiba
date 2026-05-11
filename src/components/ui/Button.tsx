import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: string          // Bootstrap Icon class e.g. "bi-plus"
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const variantClass: Record<Variant, string> = {
  primary:   'bg-primary text-white shadow-sm hover:bg-primary-dark active:scale-[0.97]',
  secondary: 'bg-surface text-primary border border-accent-light hover:bg-accent-light active:scale-[0.97]',
  ghost:     'bg-transparent text-primary border border-primary hover:bg-surface active:scale-[0.97]',
  danger:    'bg-ir-error text-white hover:brightness-90 active:scale-[0.97]',
}

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-sm',
  md: 'px-5 py-2 text-sm rounded-md',
  lg: 'px-7 py-3 text-base rounded-lg',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center gap-2',
    'font-body font-semibold uppercase tracking-wide',
    'transition-all duration-200',
    'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    variantClass[variant],
    sizeClass[size],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ')

  return (
    <button className={base} disabled={disabled || loading} {...props}>
      {loading && (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
      )}
      {!loading && icon && iconPosition === 'left' && <i className={`${icon} text-base`} />}
      {children}
      {!loading && icon && iconPosition === 'right' && <i className={`${icon} text-base`} />}
    </button>
  )
}
