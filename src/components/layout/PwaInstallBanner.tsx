// ============================================================
// InstaRatiba — src/components/layout/PwaInstallBanner.tsx
// Shows a dismissible install-app banner on the dashboard.
// Handles Chrome/Edge prompt AND iOS manual instructions.
// ============================================================

import { useState }                from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePwaInstall }           from '@/hooks/usePwaInstall'

const IOS_STEPS = [
  { icon: 'bi-box-arrow-up',      text: 'Tap the Share button at the bottom of your browser.' },
  { icon: 'bi-plus-square',       text: 'Scroll down and tap "Add to Home Screen".' },
  { icon: 'bi-check2-circle',     text: 'Tap "Add" — InstaRatiba will appear on your home screen.' },
]

export default function PwaInstallBanner() {
  const { status, isIos, promptInstall } = usePwaInstall()
  const [dismissed, setDismissed]        = useState(false)
  const [showIosModal, setShowIosModal]  = useState(false)
  const [installing, setInstalling]      = useState(false)

  const visible = !dismissed && (status === 'ready' || status === 'ios')

  async function handleInstall() {
    if (isIos) {
      setShowIosModal(true)
      return
    }
    setInstalling(true)
    const accepted = await promptInstall()
    if (!accepted) setInstalling(false)
  }

  return (
    <>
      {/* ── Install banner ─────────────────────────────────── */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="install-banner"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{   opacity: 0, y: 24  }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="
              mx-4 mb-4 rounded-xl border border-[#A5D6A7]
              bg-[#E8F5E9] p-4
              flex flex-col sm:flex-row items-start sm:items-center gap-3
              shadow-sm
            "
            role="region"
            aria-label="Install InstaRatiba app"
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-[#2E7D32] flex items-center justify-center flex-shrink-0">
              <i className="bi bi-phone text-white text-2xl" aria-hidden="true" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-[#1B5E20] text-sm">
                Install InstaRatiba on your device
              </p>
              <p className="text-[#37474F] text-xs mt-0.5 font-body">
                Access timetables offline, get instant updates, and open in one tap —
                no app store required.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="
                  flex items-center gap-1.5
                  bg-[#2E7D32] hover:bg-[#1B5E20]
                  text-white text-sm font-body font-semibold
                  px-4 py-2 rounded-lg
                  transition-colors duration-150
                  disabled:opacity-60
                  focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/40
                "
              >
                {installing
                  ? <><i className="bi bi-arrow-repeat animate-spin" aria-hidden="true" /> Installing…</>
                  : <><i className="bi bi-download" aria-hidden="true" /> Install App</>
                }
              </button>
              <button
                onClick={() => setDismissed(true)}
                aria-label="Dismiss install prompt"
                className="
                  w-8 h-8 rounded-lg
                  hover:bg-[#A5D6A7]/50
                  flex items-center justify-center
                  text-[#757575] hover:text-[#37474F]
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30
                "
              >
                <i className="bi bi-x-lg text-sm" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── iOS instructions modal ─────────────────────────── */}
      <AnimatePresence>
        {showIosModal && (
          <motion.div
            key="ios-modal-backdrop"
            className="fixed inset-0 z-[2000] bg-black/50 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{   opacity: 0 }}
            onClick={() => setShowIosModal(false)}
          >
            <motion.div
              className="
                bg-white rounded-2xl shadow-lg w-full max-w-sm p-6
                flex flex-col gap-5
              "
              initial={{ scale: 0.93, opacity: 0, y: 20 }}
              animate={{ scale: 1,    opacity: 1, y: 0  }}
              exit={{   scale: 0.93,  opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="ios-modal-title"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    id="ios-modal-title"
                    className="font-display font-bold text-[#1B5E20] text-lg"
                  >
                    Add to Home Screen
                  </h3>
                  <p className="text-[#757575] text-sm mt-1 font-body">
                    iOS Safari doesn't support automatic install.
                    Follow these steps:
                  </p>
                </div>
                <button
                  onClick={() => setShowIosModal(false)}
                  className="
                    w-8 h-8 rounded-full bg-[#F5F5F5]
                    flex items-center justify-center
                    text-[#757575] flex-shrink-0
                    focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30
                  "
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg text-sm" />
                </button>
              </div>

              <ol className="flex flex-col gap-4">
                {IOS_STEPS.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="
                      w-8 h-8 rounded-full bg-[#E8F5E9]
                      flex items-center justify-center flex-shrink-0
                      text-[#2E7D32]
                    ">
                      <i className={`${step.icon} text-base`} aria-hidden="true" />
                    </div>
                    <p className="text-[#37474F] text-sm font-body leading-snug pt-1">
                      {step.text}
                    </p>
                  </li>
                ))}
              </ol>

              {/* Animated bounce arrow hinting at Safari share button */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center gap-1">
                  <motion.i
                    className="bi bi-box-arrow-up text-2xl text-[#2E7D32]"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                    aria-hidden="true"
                  />
                  <p className="text-xs text-[#757575] font-body">Tap Share ↑ to begin</p>
                </div>
              </div>

              <button
                onClick={() => { setShowIosModal(false); setDismissed(true) }}
                className="
                  w-full py-2.5 rounded-xl
                  bg-[#2E7D32] hover:bg-[#1B5E20]
                  text-white font-body font-semibold text-sm
                  transition-colors duration-150
                  focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/40
                "
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
