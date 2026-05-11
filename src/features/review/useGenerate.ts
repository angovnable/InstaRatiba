// ============================================================
// InstaRatiba — Segment 6
// useGenerate hook
// Orchestrates: validate → generate → post-scan → persist
// §7.1 Algorithm Overview  |  §5.4 Conflict Detection
// ============================================================

import { useCallback } from 'react'
import { toast } from 'sonner'
import { useSchoolStore }     from '@/store/schoolStore'
import { useTeacherStore }    from '@/store/teacherStore'
import { useAllocationStore } from '@/store/allocationStore'
import { useTimetableStore }  from '@/store/timetableStore'
import { useValidationStore } from '@/store/validationStore'
import { useAuthStore }       from '@/store/authStore'

import { runFullValidation }   from '@/lib/cbc/validators'
import { buildDayLayout, getSlotsBeforeBreak, getLastLessonSlotIndex, gradeToLevel, DEFAULT_TIMINGS } from '@/lib/cbc/timing'
import { generateTimetable }   from '@/lib/generator/engine'
import { scanGeneratedSlots }  from '@/lib/generator/postConflicts'
import {
  createTimetable,
  clearSlots,
  bulkInsertSlots,
  saveConflicts,
} from '@/lib/supabase/timetable'

import type { SchoolLevel, LevelTiming } from '@/types'

// ── Timing context helper ─────────────────────────────────────

function getTimings(school: ReturnType<typeof useSchoolStore.getState>['school']): Partial<Record<SchoolLevel, LevelTiming>> {
  // schoolStore holds timings keyed by level; fall back to MoE defaults
  const stored = (school as unknown as { timings?: Partial<Record<SchoolLevel, LevelTiming>> })?.timings ?? {}
  return {
    lower_primary:    stored.lower_primary    ?? DEFAULT_TIMINGS.lower_primary,
    upper_primary:    stored.upper_primary    ?? DEFAULT_TIMINGS.upper_primary,
    junior_secondary: stored.junior_secondary ?? DEFAULT_TIMINGS.junior_secondary,
  }
}

// ── Hook ──────────────────────────────────────────────────────

export function useGenerate() {
  const { school, classes, rooms } = useSchoolStore()
  const { teachers, teacherSubjects } = useTeacherStore()
  const { allocations } = useAllocationStore()
  const timetableStore  = useTimetableStore()
  const validationStore = useValidationStore()
  const { user }        = useAuthStore()

  // ── 1. Validate only (for Pre-Generate Review screen) ──────

  const validate = useCallback(() => {
    if (!school) { toast.error('School not configured'); return }

    validationStore.setValidating(true)
    try {
      const result = runFullValidation({
        timetableId: timetableStore.current?.id ?? 'preview',
        allocations,
        teachers,
        teacherSubjects,
        classes,
        rooms,
        timings: getTimings(school),
      })
      validationStore.setResult(result)
      if (result.hardCount === 0) {
        toast.success(`Validation passed — ${result.softCount} warning(s)`)
      } else {
        toast.error(`${result.hardCount} hard conflict(s) must be resolved before generating`)
      }
    } catch (err) {
      toast.error('Validation error: ' + (err as Error).message)
    } finally {
      validationStore.setValidating(false)
    }
  }, [school, allocations, teachers, teacherSubjects, classes, rooms, timetableStore, validationStore])

  // ── 2. Full generate flow ───────────────────────────────────

  const generate = useCallback(async () => {
    if (!school) { toast.error('School not configured'); return }
    if (!validationStore.canGenerate()) {
      toast.error('Resolve all hard conflicts before generating')
      return
    }

    timetableStore.setGenerating(true)
    timetableStore.setGenerationProgress(0)

    try {
      const timings = getTimings(school)

      // Create (or reuse) timetable record
      let tt = timetableStore.current
      if (!tt) {
        tt = await createTimetable({
          school_id: school.id,
          term_id:   school.id + '_term',   // placeholder until academic_terms wired in S9
          name:      `Term ${school.current_term} ${school.academic_year}`,
          status:    'draft',
        })
        timetableStore.setCurrentTimetable(tt)
      }

      // Clear old slots if regenerating
      await clearSlots(tt.id)
      timetableStore.setSlots([])
      timetableStore.clearConflicts()

      // Run generator
      const result = await generateTimetable({
        timetableId: tt.id,
        schoolId:    school.id,
        classes,
        teachers,
        rooms,
        allocations,
        timings,
        onProgress: (pct) => timetableStore.setGenerationProgress(pct),
      })

      // Post-generation conflict scan
      const level: SchoolLevel = classes[0] ? gradeToLevel(classes[0].grade) : 'lower_primary'
      const timing  = timings[level] ?? DEFAULT_TIMINGS[level]
      const layout  = buildDayLayout(timing)
      const beforeBreakSet = new Set(getSlotsBeforeBreak(layout))
      const lastLessonIdx  = getLastLessonSlotIndex(layout)

      const postConflicts = scanGeneratedSlots({
        timetableId: tt.id,
        slots: result.slots,
        teachers,
        classes,
        rooms,
        beforeBreakSlotIndexes: beforeBreakSet,
        lastLessonSlotIndex: lastLessonIdx,
      })

      // Merge pre-validation soft warnings + post-scan conflicts
      const allConflicts = [
        ...(validationStore.result?.conflicts.filter(c => c.severity === 'soft') ?? []),
        ...postConflicts,
      ]

      // Persist
      await bulkInsertSlots(result.slots)
      await saveConflicts(allConflicts)

      // Push to store
      timetableStore.setSlots(result.slots)
      for (const c of allConflicts) timetableStore.addConflict(c)

      const hardPost = postConflicts.filter(c => c.severity === 'hard').length
      if (result.success && hardPost === 0) {
        toast.success('Timetable generated successfully!')
      } else if (!result.success) {
        toast.warning(
          `Generated with ${result.unscheduled.length} unscheduled subject(s). ` +
          `Review conflicts for details.`,
        )
      } else {
        toast.warning(`Generated — ${hardPost} post-generation conflict(s) detected.`)
      }
    } catch (err) {
      toast.error('Generation failed: ' + (err as Error).message)
    } finally {
      timetableStore.setGenerating(false)
      timetableStore.setGenerationProgress(0)
    }
  }, [school, classes, teachers, rooms, allocations, timetableStore, validationStore])

  return {
    validate,
    generate,
    isValidating:    validationStore.isValidating,
    isGenerating:    timetableStore.isGenerating,
    progress:        timetableStore.generationProgress,
    validationResult: validationStore.result,
    canGenerate:     validationStore.canGenerate(),
  }
}
