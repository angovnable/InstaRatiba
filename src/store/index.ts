// ============================================================
// InstaRatiba — Segment 6
// src/store/index.ts — store exports (S6 additions)
// Add to the existing index from S1/S5
// ============================================================

export { useValidationStore } from './validationStore'

// Re-export all existing stores (merge with S1/S5 index)
export { useAuthStore }       from './authStore'
export { useSchoolStore }     from './schoolStore'
export { useTimetableStore }  from './timetableStore'
export { useUiStore } from './uiStore'
export { useUiStore as useUIStore } from './uiStore'
export { useTeacherStore }    from './teacherStore'
export { useAllocationStore } from './allocationStore'
