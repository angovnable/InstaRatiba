import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helper?: string
  error?: string
  iconLeft?: string
  iconRight?: string
  wrapperClass?: string
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
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  const inputBase = [
    'w-full rounded-md border bg-white font-body text-sm text-ir-text',
    'transition-all duration-200 outline-none',
    'focus:border-primary focus:ring-2 focus:ring-primary/10',
    'placeholder:text-muted/60',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    error
      ? 'border-ir-error focus:border-ir-error focus:ring-ir-error/10'
      : 'border-[#d4e0d6]',
    iconLeft  ? 'pl-9 pr-3 py-2'  : '',
    iconRight ? 'pl-3 pr-9 py-2'  : '',
    !iconLeft && !iconRight ? 'px-3 py-2' : '',
    className,
  ].join(' ')

  return (
    <div className={`mb-4 ${wrapperClass}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-1 text-xs font-semibold text-ir-text tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {iconLeft && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            <i className={`${iconLeft} text-base`} />
          </span>
        )}

        <input id={inputId} className={inputBase} {...props} />

        {iconRight && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            <i className={`${iconRight} text-base`} />
          </span>
        )}
      </div>

      {(helper || error) && (
        <p className={`mt-1 text-xs ${error ? 'text-ir-error' : 'text-muted'}`}>
          {error ?? helper}
        </p>
      )}
    </div>
  )
}
