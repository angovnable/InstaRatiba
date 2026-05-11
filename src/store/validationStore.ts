// ============================================================
// InstaRatiba — Segment 6
// Validation store — pre-generate review state
// §4.2.9 Screen 7 — Pre-Generate Review
// ============================================================

import { create } from 'zustand'
import type { Conflict } from '@/types'
import type { ValidationResult } from '@/lib/cbc/validators'

interface ValidationState {
  result: ValidationResult | null
  isValidating: boolean
  lastValidatedAt: number | null

  // Actions
  setResult:        (r: ValidationResult) => void
  setValidating:    (v: boolean) => void
  clearResult:      () => void
  resolveConflict:  (id: string) => void

  // Derived
  hardConflicts:   () => Conflict[]
  softConflicts:   () => Conflict[]
  canGenerate:     () => boolean
}

export const useValidationStore = create<ValidationState>((set, get) => ({
  result: null,
  isValidating: false,
  lastValidatedAt: null,

  setResult: (result) => set({ result, lastValidatedAt: Date.now() }),

  setValidating: (v) => set({ isValidating: v }),

  clearResult: () => set({ result: null, lastValidatedAt: null }),

  resolveConflict: (id) =>
    set((s) => {
      if (!s.result) return s
      const conflicts = s.result.conflicts.map((c) =>
        c.id === id ? { ...c, resolved: true } : c,
      )
      const hardCount = conflicts.filter((c) => c.severity === 'hard' && !c.resolved).length
      const softCount = conflicts.filter((c) => c.severity === 'soft' && !c.resolved).length
      return {
        result: {
          ...s.result,
          conflicts,
          hardCount,
          softCount,
          canGenerate: hardCount === 0,
        },
      }
    }),

  hardConflicts: () =>
    (get().result?.conflicts ?? []).filter((c) => c.severity === 'hard' && !c.resolved),

  softConflicts: () =>
    (get().result?.conflicts ?? []).filter((c) => c.severity === 'soft' && !c.resolved),

  canGenerate: () => get().result?.canGenerate ?? false,
}))
