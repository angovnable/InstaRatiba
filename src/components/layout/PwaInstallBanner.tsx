// PwaInstallBanner — Emil Kowalski: dark card, gold action,
// precise copy. No excessive illustration.

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePwaInstall } from '@/hooks/usePwaInstall'

const IOS_STEPS = [
  { icon: 'bi-box-arrow-up',  text: 'Tap Share in Safari.' },
  { icon: 'bi-plus-square',   text: 'Scroll to "Add to Home Screen".' },
  { icon: 'bi-check2-circle', text: 'Tap Add — done.' },
]

export default function PwaInstallBanner() {
  const { status, isIos, promptInstall } = usePwaInstall()
  const [dismissed, setDismissed] = useState(false)
  const [showIos, setShowIos] = useState(false)
  const [installing, setInstalling] = useState(false)
  const visible = !dismissed && (status === 'ready' || status === 'ios')

  async function install() {
    if (isIos) { setShowIos(true); return }
    setInstalling(true)
    const ok = await promptInstall()
    if (!ok) setInstalling(false)
  }

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="pwa-banner"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            style={{
              margin: '0 16px 12px',
              borderRadius: 12,
              border: '1px solid rgba(200,146,42,0.18)',
              background: '#0F1B14',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 2px 12px rgba(13,61,35,0.12)',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'rgba(200,146,42,0.15)',
              border: '1px solid rgba(200,146,42,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <i className="bi-phone" style={{ color: '#C8922A', fontSize: '1rem' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, color: 'white', fontSize: '0.82rem', letterSpacing: '-0.01em' }}>
                Install InstaRatiba
              </p>
              <p style={{ fontFamily: "'Figtree', sans-serif", color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: 1 }}>
                Offline access · one-tap open
              </p>
            </div>
            <button
              onClick={install}
              disabled={installing}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: '#C8922A', color: '#0F1B14',
                fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                fontSize: '0.75rem', cursor: installing ? 'wait' : 'pointer',
                flexShrink: 0, transition: 'filter 120ms',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.9)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)' }}
            >
              {installing ? '…' : 'Install'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              style={{
                width: 24, height: 24, borderRadius: 5,
                border: 'none', background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', flexShrink: 0,
              }}
            >
              <i className="bi-x-lg" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS guide modal */}
      <AnimatePresence>
        {showIos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 2000,
              background: 'rgba(12,24,16,0.6)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              padding: 16,
            }}
            onClick={() => setShowIos(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              style={{
                background: 'white', borderRadius: 16, padding: 24,
                width: '100%', maxWidth: 360,
                boxShadow: '0 0 0 1px rgba(13,61,35,0.06), 0 8px 40px rgba(13,61,35,0.18)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.92rem', color: '#1C2B22', letterSpacing: '-0.014em' }}>
                  Add to Home Screen
                </h3>
                <button onClick={() => setShowIos(false)} style={{
                  width: 26, height: 26, borderRadius: 5,
                  border: '1px solid #EDE7D9', background: 'white',
                  color: '#7A8C82', cursor: 'pointer', fontSize: '0.72rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="bi-x-lg" />
                </button>
              </div>
              <ol style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {IOS_STEPS.map((s, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: 'rgba(200,146,42,0.09)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#C8922A', fontSize: '0.82rem', flexShrink: 0,
                    }}>
                      <i className={s.icon} />
                    </div>
                    <p style={{ fontFamily: "'Figtree', sans-serif", fontSize: '0.82rem', color: '#1C2B22', paddingTop: 4, lineHeight: 1.5 }}>
                      {s.text}
                    </p>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => { setShowIos(false); setDismissed(true) }}
                style={{
                  marginTop: 18, width: '100%', padding: '10px',
                  borderRadius: 8, border: 'none',
                  background: '#0D3D23', color: 'white',
                  fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                  fontSize: '0.875rem', cursor: 'pointer', letterSpacing: '-0.01em',
                }}
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
