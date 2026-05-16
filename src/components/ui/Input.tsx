// Input — InstaRatiba Kenyan/EAC Theme
// Outfit labels, Mau Forest focus ring, Rift Red errors, Savanna Mist border at rest

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helper?: string
  error?: string
  iconLeft?: string
  iconRight?: string
  wrapperClass?: string
  success?: boolean
}

export default function Input({
  label,
  helper,
  error,
  iconLeft,
  iconRight,
  wrapperClass = '',
  className = '',
  id,
  success,
  ...props
}: InputProps) {
  const [focused, setFocused] = React.useState(false)
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  const borderColor = error
    ? '#A01F1F'
    : focused
    ? '#0D3D23'
    : '#EDE7D9'

  const focusRing = error
    ? '0 0 0 3px rgba(160,31,31,0.12)'
    : focused
    ? '0 0 0 3px rgba(13,61,35,0.12)'
    : 'none'

  return (
    <div className={`mb-4 ${wrapperClass}`}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            marginBottom: 4,
            fontSize: '0.8rem',
            fontWeight: 500,
            color: '#1C2B22',
            fontFamily: 'var(--font-ui)',
          }}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {iconLeft && (
          <span
            className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: '#7A8C82' }}
          >
            <i className={`${iconLeft} text-base`} />
          </span>
        )}

        <input
          id={inputId}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: iconLeft ? '8px 12px 8px 36px' : iconRight ? '8px 36px 8px 12px' : '8px 12px',
            borderRadius: '8px',
            border: `1.5px solid ${borderColor}`,
            boxShadow: focusRing,
            outline: 'none',
            background: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: '#1C2B22',
            transition: 'border-color 0.18s, box-shadow 0.18s',
          }}
          className={`placeholder:text-[#7A8C82]/70 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />

        {/* Success checkmark */}
        {success && !error && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <i className="bi-check-circle-fill text-base" style={{ color: '#0D3D23' }} />
          </span>
        )}

        {/* Error icon */}
        {error && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <i className="bi-exclamation-circle text-base" style={{ color: '#A01F1F' }} />
          </span>
        )}

        {iconRight && !success && !error && (
          <span
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: '#7A8C82' }}
          >
            <i className={`${iconRight} text-base`} />
          </span>
        )}
      </div>

      {(helper || error) && (
        <p
          className="mt-1 text-xs flex items-center gap-1"
          style={{
            color: error ? '#A01F1F' : '#7A8C82',
            fontFamily: 'var(--font-body)',
          }}
        >
          {error && <i className="bi-exclamation-circle text-xs" />}
          {error ?? helper}
        </p>
      )}
    </div>
  )
}
