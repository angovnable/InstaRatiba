// ============================================================
// useOnboardingTour — extracted from OnboardingTour.tsx
// Satisfies fast-refresh rule: hooks and components must be
// in separate files when both are exported.
// ============================================================

import { useState, useCallback } from 'react'

const TOUR_STORAGE_KEY = 'instaratiba-tour-done'
const TOTAL_STEPS = 7 // keep in sync with STEPS in OnboardingTour.tsx

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
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }, [])

  const prev = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0))
  }, [])

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, '1')
    setVisible(false)
  }, [])

  const skip = finish

  return { visible, step, start, next, prev, finish, skip, total: TOTAL_STEPS }
}
