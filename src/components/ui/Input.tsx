// Input — Emil Kowalski design language
// Clean, tight labels. Focus state that feels physical.
// Error states with precise red, not garish.

import React, { useState } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helper?: string
  error?: string
  iconLeft?: string
  iconRight?: string
  wrapperClass?: string
  wrapperStyle?: React.CSSProperties
}

export default function Input({
  label,
  helper,
  error,
  iconLeft,
  iconRight,
  wrapperClass = '',
  wrapperStyle = {},
  className = '',
  id,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false)
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  const borderColor = error ? '#A01F1F' : focused ? '#0D3D23' : '#EDE7D9'
  const shadow      = error
    ? '0 0 0 3px rgba(160,31,31,0.08)'
    : focused
    ? '0 0 0 3px rgba(13,61,35,0.08)'
    : 'none'

  return (
    <div className={wrapperClass} style={{ marginBottom: 14, ...wrapperStyle }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 5,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 500,
            fontSize: '0.78rem',
            color: error ? '#A01F1F' : '#1C2B22',
            letterSpacing: '-0.005em',
            transition: 'color 120ms',
          }}
        >
          {label}
          {props.required && (
            <span style={{ color: '#A01F1F', fontSize: '0.65rem' }}>*</span>
          )}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {iconLeft && (
          <span style={{
            position: 'absolute', left: 10, top: '50%',
            transform: 'translateY(-50%)',
            color: focused ? '#0D3D23' : '#7A8C82',
            fontSize: '0.9rem',
            pointerEvents: 'none',
            transition: 'color 120ms',
          }}>
            <i className={iconLeft} />
          </span>
        )}

        <input
          id={inputId}
          onFocus={e => { setFocused(true); props.onFocus?.(e) }}
          onBlur={e => { setFocused(false); props.onBlur?.(e) }}
          style={{
            width: '100%',
            background: props.disabled ? '#F7F5EF' : 'white',
            border: `1.5px solid ${borderColor}`,
            borderRadius: 7,
            padding: iconLeft
              ? '8px 12px 8px 34px'
              : iconRight
              ? '8px 34px 8px 12px'
              : '8px 12px',
            fontFamily: "'Figtree', sans-serif",
            fontSize: '0.875rem',
            color: '#1C2B22',
            boxShadow: shadow,
            outline: 'none',
            transition: 'border-color 120ms, box-shadow 120ms, background 120ms',
            cursor: props.disabled ? 'not-allowed' : 'text',
          }}
          className={className}
          {...props}
        />

        {iconRight && !error && (
          <span style={{
            position: 'absolute', right: 10, top: '50%',
            transform: 'translateY(-50%)',
            color: '#7A8C82', fontSize: '0.9rem', pointerEvents: 'none',
          }}>
            <i className={iconRight} />
          </span>
        )}

        {error && (
          <span style={{
            position: 'absolute', right: 10, top: '50%',
            transform: 'translateY(-50%)',
            color: '#A01F1F', fontSize: '0.85rem', pointerEvents: 'none',
          }}>
            <i className="bi-exclamation-circle-fill" />
          </span>
        )}
      </div>

      {(error || helper) && (
        <p style={{
          marginTop: 4,
          fontSize: '0.72rem',
          fontFamily: "'Figtree', sans-serif",
          color: error ? '#A01F1F' : '#7A8C82',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          lineHeight: 1.4,
        }}>
          {error ?? helper}
        </p>
      )}
    </div>
  )
}
