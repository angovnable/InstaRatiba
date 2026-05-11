// ============================================================
// InstaRatiba — Segment 5
// Allocation store — subject lesson counts + teacher assignments
// §4.2.7 Lesson Allocation & Subject-Teacher Assignment
// ============================================================

import { create } from 'zustand'
import type { SubjectAllocation } from '@/types'

interface AllocationState {
  allocations: SubjectAllocation[]
  isDirty: boolean        // unsaved changes flag
  isLoading: boolean

  // Actions
  setAllocations:     (allocations: SubjectAllocation[]) => void
  upsertAllocation:   (alloc: SubjectAllocation) => void
  bulkSetAllocations: (allocs: SubjectAllocation[]) => void
  setLoading:         (v: boolean) => void
  markClean:          () => void

  // Selectors
  getAllocationsForClass: (classId: string) => SubjectAllocation[]
  getAllocationForSubject: (classId: string, subjectCode: string) => SubjectAllocation | undefined
  getTotalLessonsForClass: (classId: string) => number
  hasUnassignedTeachers:  (classId: string) => boolean
}

export const useAllocationStore = create<AllocationState>((set, get) => ({
  allocations: [],
  isDirty: false,
  isLoading: false,

  setAllocations: (allocations) => set({ allocations, isDirty: false }),

  upsertAllocation: (alloc) =>
    set((s) => {
      const exists = s.allocations.find(
        (a) => a.class_id === alloc.class_id && a.subject_code === alloc.subject_code
      )
      return {
        isDirty: true,
        allocations: exists
          ? s.allocations.map((a) =>
              a.class_id === alloc.class_id && a.subject_code === alloc.subject_code
                ? alloc
                : a
            )
          : [...s.allocations, alloc],
      }
    }),

  bulkSetAllocations: (allocs) =>
    set((s) => {
      // Replace by class/subject key, preserve others
      const toReplaceKeys = new Set(allocs.map((a) => `${a.class_id}::${a.subject_code}`))
      const kept = s.allocations.filter(
        (a) => !toReplaceKeys.has(`${a.class_id}::${a.subject_code}`)
      )
      return { allocations: [...kept, ...allocs], isDirty: true }
    }),

  setLoading: (v) => set({ isLoading: v }),

  markClean: () => set({ isDirty: false }),

  getAllocationsForClass: (classId) =>
    get().allocations.filter((a) => a.class_id === classId),

  getAllocationForSubject: (classId, subjectCode) =>
    get().allocations.find(
      (a) => a.class_id === classId && a.subject_code === subjectCode
    ),

  getTotalLessonsForClass: (classId) =>
    get()
      .allocations.filter((a) => a.class_id === classId)
      .reduce((sum, a) => sum + a.lessons_per_week, 0),

  hasUnassignedTeachers: (classId) =>
    get()
      .allocations.filter((a) => a.class_id === classId)
      .some((a) => !a.teacher_id),
}))
