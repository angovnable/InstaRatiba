// OnboardingTour — §4.2.2
// First-time user guided walkthrough using a lightweight custom implementation
// (Shepherd.js-compatible API — install shepherd.js or use this built-in version)
// Shown once after first login, skippable at any time.

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const TOUR_STORAGE_KEY = 'instaratiba-tour-done'

// ── Tour step definitions ────────────────────────────────────
const STEPS = [
  {
    id: 'welcome',
    title: '👋 Welcome to InstaRatiba!',
    body: "You're just a few steps away from generating your school's CBC-compliant timetable. Let us show you around.",
    icon: 'bi-stars',
    anchor: null, // centre-screen
  },
  {
    id: 'school-setup',
    title: '🏫 Step 1: School Setup',
    body: 'Start by entering your school name, county, and which grade levels you teach — Lower Primary, Upper Primary, or Junior Secondary.',
    icon: 'bi-buildings',
    anchor: null,
  },
  {
    id: 'classes',
    title: '👥 Step 2: Classes & Streams',
    body: 'Add your classes and streams (e.g. Grade 4A, 4B, 4C). You can customise stream names and assign class teachers.',
    icon: 'bi-people',
    anchor: null,
  },
  {
    id: 'teachers',
    title: '👨‍🏫 Step 3: Teachers',
    body: 'Add all your teachers, assign the subjects they teach, and set their maximum lessons per day. You can also bulk-import from CSV.',
    icon: 'bi-person-badge',
    anchor: null,
  },
  {
    id: 'allocation',
    title: '📋 Step 4: Lesson Allocation',
    body: 'Review CBC lesson counts per subject and assign a specific teacher to each subject for each class. MoE defaults are pre-filled.',
    icon: 'bi-grid-3x3',
    anchor: null,
  },
  {
    id: 'generate',
    title: '⚡ Step 5: Generate!',
    body: "Once everything is set, hit Generate. InstaRatiba checks all CBC rules and produces your timetable — usually in under 5 seconds.",
    icon: 'bi-lightning-charge-fill',
    anchor: null,
  },
  {
    id: 'export',
    title: '🖨️ Step 6: Export',
    body: 'Export print-ready black-and-white PDFs for notice boards, teachers, and admin offices. Share a read-only link with staff instantly.',
    icon: 'bi-file-earmark-arrow-down',
    anchor: null,
  },
]

// ── Hook: controls tour state ────────────────────────────────
export function useOnboardingTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  const start = useCallback(() => {
    const done = localStorage.getItem(TOUR_STORAGE_KEY)
    if (!done) {
      setStep(0)
      setVisible(true)
    }
  }, [])

  const next = useCallback(() => {
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }, [])

  const prev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, '1')
    setVisible(false)
  }, [])

  const skip = finish

  return { visible, step, start, next, prev, finish, skip, total: STEPS.length }
}

// ── OnboardingTour component ─────────────────────────────────
interface OnboardingTourProps {
  visible: boolean
  step: number
  total: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onFinish: () => void
}

export default function OnboardingTour({
  visible, step, total, onNext, onPrev, onSkip, onFinish,
}: OnboardingTourProps) {
  const navigate = useNavigate()
  const current = STEPS[step]
  const isLast = step === total - 1

  // Handle keyboard navigation
  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') isLast ? onFinish() : onNext()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'Escape') onSkip()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [visible, isLast, onNext, onPrev, onFinish, onSkip])

  const handleFinish = () => {
    onFinish()
    navigate('/setup')
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(3px)',
              zIndex: 9000,
            }}
            onClick={onSkip}
            aria-hidden="true"
          />

          {/* Tour card */}
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Tour step ${step + 1} of ${total}: ${current.title}`}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9001,
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
              padding: '32px 28px 24px',
              width: 'min(460px, calc(100vw - 32px))',
              border: '1px solid rgba(165,214,167,0.4)',
            }}
          >
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <i className={`${current.icon} text-2xl`} style={{ color: '#2E7D32' }} />
            </div>

            {/* Title */}
            <h2 style={{
              fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
              fontSize: '1.1rem', color: '#1B5E20', marginBottom: 10,
            }}>
              {current.title}
            </h2>

            {/* Body */}
            <p style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.88rem',
              color: '#546E7A', lineHeight: 1.65, marginBottom: 24,
            }}>
              {current.body}
            </p>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === step ? 20 : 7, height: 7, borderRadius: 999,
                    background: i === step ? '#2E7D32' : i < step ? '#A5D6A7' : '#E0E0E0',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              {/* Skip */}
              <button
                onClick={onSkip}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem',
                  color: '#9E9E9E', padding: '4px 0',
                }}
              >
                Skip tour
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                {/* Back */}
                {step > 0 && (
                  <button
                    onClick={onPrev}
                    style={{
                      background: '#F5F5F5', border: 'none', borderRadius: 10,
                      padding: '9px 18px', cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
                      fontSize: '0.85rem', color: '#546E7A',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <i className="bi-arrow-left" /> Back
                  </button>
                )}

                {/* Next / Finish */}
                <button
                  onClick={isLast ? handleFinish : onNext}
                  style={{
                    background: '#2E7D32', border: 'none', borderRadius: 10,
                    padding: '9px 22px', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                    fontSize: '0.85rem', color: '#fff',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 2px 10px rgba(46,125,50,0.28)',
                  }}
                >
                  {isLast ? (
                    <><i className="bi-rocket-takeoff-fill" /> Let's Go!</>
                  ) : (
                    <>Next <i className="bi-arrow-right" /></>
                  )}
                </button>
              </div>
            </div>

            {/* Keyboard hint */}
            <p style={{
              textAlign: 'center', marginTop: 14,
              fontSize: '0.68rem', color: '#BDBDBD',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              Use ← → arrow keys to navigate · Esc to skip
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
