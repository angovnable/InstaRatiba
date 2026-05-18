// Modal — Emil Kowalski design language
// Spring entrance from slightly below. Dark backdrop but not heavy.
// Tight header typography. No decorative chrome.

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

type ModalSize = 'sm' | 'md' | 'lg' | 'full'

export interface ModalProps {
  open?: boolean
  isOpen?: boolean
  onClose: () => void
  title?: string
  size?: ModalSize
  children: React.ReactNode
  footer?: React.ReactNode
  closeOnOverlay?: boolean
}

const MAX_W: Record<ModalSize, number> = { sm: 400, md: 540, lg: 720, full: 960 }

export function Modal({
  open, isOpen, onClose, title, size = 'md',
  children, footer, closeOnOverlay = true,
}: ModalProps) {
  const visible  = open ?? isOpen ?? false
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = '' }
  }, [visible, onClose])

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          key="modal-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            background: 'rgba(12,24,16,0.6)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={closeOnOverlay ? onClose : undefined}
          role="dialog" aria-modal="true" aria-label={title}
        >
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26, mass: 0.8 }}
            style={{
              background: 'white',
              borderRadius: 16,
              boxShadow: '0 0 0 1px rgba(13,61,35,0.06), 0 8px 40px rgba(13,61,35,0.18)',
              width: '100%',
              maxWidth: MAX_W[size],
              maxHeight: '90dvh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div style={{
                padding: '15px 20px',
                borderBottom: '1px solid #EDE7D9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexShrink: 0,
              }}>
                <h3 style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  color: '#1C2B22',
                  letterSpacing: '-0.014em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  {/* Subtle gold dot */}
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C8922A', flexShrink: 0 }} />
                  {title}
                </h3>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  aria-label="Close"
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: '1px solid #EDE7D9',
                    background: 'white',
                    color: '#7A8C82',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem',
                    transition: 'background 120ms, color 120ms, border-color 120ms',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.background = 'rgba(160,31,31,0.06)'
                    el.style.color = '#A01F1F'
                    el.style.borderColor = 'rgba(160,31,31,0.2)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.background = 'white'
                    el.style.color = '#7A8C82'
                    el.style.borderColor = '#EDE7D9'
                  }}
                >
                  <i className="bi-x-lg" />
                </motion.button>
              </div>
            )}

            {/* Body */}
            <div style={{ padding: '18px 20px', flex: 1 }}>{children}</div>

            {/* Footer */}
            {footer && (
              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #EDE7D9',
                display: 'flex', justifyContent: 'flex-end', gap: 8,
                background: 'rgba(247,245,239,0.5)',
                borderRadius: '0 0 16px 16px',
                flexShrink: 0,
              }}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
export default Modal
