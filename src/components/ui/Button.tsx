// Button — Emil Kowalski design language
// Spring physics, precise shadows, tactile press feel
// Every variant feels like a distinct material

import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: string
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
  style?: React.CSSProperties
  form?: string
  'aria-label'?: string
}

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { padding: '5px 12px', fontSize: '0.78rem', borderRadius: 5, gap: 5 },
  md: { padding: '8px 16px', fontSize: '0.855rem', borderRadius: 7, gap: 6 },
  lg: { padding: '11px 22px', fontSize: '0.925rem', borderRadius: 8, gap: 7 },
}

// Spring config — Emil's signature feel
const SPRING = { type: 'spring' as const, stiffness: 500, damping: 28, mass: 0.6 }

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
  style = {},
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  const variantClass = {
    primary:   'btn-base btn-primary',
    secondary: 'btn-base btn-secondary',
    ghost:     'btn-base btn-ghost',
    danger:    'btn-base btn-danger',
    gold:      'btn-base btn-gold',
  }[variant]

  return (
    <motion.button
      whileTap={isDisabled ? {} : { scale: 0.965 }}
      transition={SPRING}
      disabled={isDisabled}
      className={`${variantClass} ${className}`}
      style={{
        ...SIZE_STYLES[size],
        width: fullWidth ? '100%' : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 600,
        letterSpacing: '-0.01em',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.45 : 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...(rest as HTMLMotionProps<'button'>)}
    >
      {loading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
          style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.25)',
            borderTop: '2px solid currentColor',
          }}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <i className={`${icon}`} style={{ fontSize: '0.9em', lineHeight: 1 }} />
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <i className={`${icon}`} style={{ fontSize: '0.9em', lineHeight: 1 }} />
          )}
        </>
      )}
    </motion.button>
  )
}
