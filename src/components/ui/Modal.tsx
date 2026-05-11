import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type ModalSize = 'sm' | 'md' | 'lg' | 'full'

export interface ModalProps {
  open?: boolean
  isOpen?: boolean  // alias accepted by some pages
  onClose: () => void
  title?: string
  size?: ModalSize
  children: React.ReactNode
  footer?: React.ReactNode
  closeOnOverlay?: boolean
}

const sizeClass: Record<ModalSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  full: 'max-w-5xl',
}

export function Modal({
  open,
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  closeOnOverlay = true,
}: ModalProps) {
  const isVisible = open ?? isOpen ?? false
  const panelRef = useRef<HTMLDivElement>(null)

  // Trap focus & ESC key
  useEffect(() => {
    if (!isVisible) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    // Lock body scroll
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.38)' }}
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        className={`bg-white rounded-lg shadow-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in ${sizeClass[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-[#edf2ef] flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-ir-text">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md bg-ir-bg text-muted flex items-center justify-center
                         hover:bg-red-50 hover:text-ir-error transition-colors duration-150"
              aria-label="Close modal"
            >
              <i className="bi-x-lg text-sm" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[#edf2ef] flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
export default Modal
