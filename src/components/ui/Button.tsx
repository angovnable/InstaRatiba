// Button — InstaRatiba Kenyan/EAC Theme
// Primary: Mau Forest | Gold: Savanna Gold | Danger: Rift Red | Ghost: outlined

import React from 'react'
import { motion } from 'framer-motion'

type Variant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: string
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: '#0D3D23',
    color: '#fff',
    border: 'none',
    boxShadow: '0 4px 14px rgba(13,61,35,0.30)',
  },
  gold: {
    background: '#C8922A',
    color: '#0F1B14',
    border: 'none',
    boxShadow: '0 4px 14px rgba(200,146,42,0.30)',
  },
  secondary: {
    background: '#F7F5EF',
    color: '#0D3D23',
    border: '1px solid #EDE7D9',
    boxShadow: 'none',
  },
  ghost: {
    background: 'transparent',
    color: '#0D3D23',
    border: '1.5px solid #0D3D23',
    boxShadow: 'none',
  },
  danger: {
    background: '#A01F1F',
    color: '#fff',
    border: 'none',
    boxShadow: '0 4px 14px rgba(160,31,31,0.25)',
  },
}

const hoverStyles: Record<Variant, React.CSSProperties> = {
  primary:   { background: '#1A5C3A' },
  gold:      { background: '#B57E21' },
  secondary: { background: '#EDE7D9' },
  ghost:     { background: 'rgba(13,61,35,0.06)' },
  danger:    { background: '#8B1A1A' },
}

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 14px', fontSize: '0.75rem', borderRadius: '6px' },
  md: { padding: '9px 20px', fontSize: '0.875rem', borderRadius: '8px' },
  lg: { padding: '13px 28px', fontSize: '0.95rem', borderRadius: '10px' },
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
  style,
  ...props
}: ButtonProps) {
  const [hovered, setHovered] = React.useState(false)

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'var(--font-ui)',
    fontWeight: 600,
    letterSpacing: '0.01em',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.45 : 1,
    transition: 'all 0.18s ease',
    width: fullWidth ? '100%' : undefined,
    ...variantStyles[variant],
    ...(hovered && !disabled && !loading ? hoverStyles[variant] : {}),
    ...sizeStyles[size],
    ...style,
  }

  return (
    <motion.button
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      className={className}
      style={baseStyle}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {loading && (
        <span
          className="rounded-full border-2 animate-spin-slow"
          style={{
            width: 14, height: 14,
            borderColor: variant === 'primary' || variant === 'danger' || variant === 'gold'
              ? 'rgba(255,255,255,0.3)'
              : 'rgba(13,61,35,0.2)',
            borderTopColor: variant === 'primary' || variant === 'danger'
              ? '#fff'
              : variant === 'gold' ? '#0F1B14' : '#0D3D23',
          }}
        />
      )}
      {!loading && icon && iconPosition === 'left' && <i className={`${icon} text-base`} />}
      {children}
      {!loading && icon && iconPosition === 'right' && <i className={`${icon} text-base`} />}
    </motion.button>
  )
}
