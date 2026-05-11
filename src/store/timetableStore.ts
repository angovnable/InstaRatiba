import { create } from 'zustand'
import type { Timetable, TimetableSlot, Conflict, TimetableStatus } from '@/types'

type ViewMode = 'master' | 'class' | 'teacher'

interface TimetableState {
  current: Timetable | null
  slots: TimetableSlot[]
  conflicts: Conflict[]
  viewMode: ViewMode
  selectedClassId: string | null
  selectedTeacherId: string | null
  isGenerating: boolean
  generationProgress: number // 0–100

  // Actions
  setCurrentTimetable: (tt: Timetable | null) => void
  setCurrent: (tt: Timetable | null) => void  // alias used by DashboardPage
  setSlots: (slots: TimetableSlot[]) => void
  addConflict: (c: Conflict) => void
  clearConflicts: () => void
  resolveConflict: (id: string) => void
  setViewMode: (mode: ViewMode) => void
  setSelectedClass: (id: string | null) => void
  setSelectedTeacher: (id: string | null) => void
  setGenerating: (v: boolean) => void
  setGenerationProgress: (pct: number) => void
  updateStatus: (status: TimetableStatus) => void

  // Derived
  hardConflictCount: () => number
  softConflictCount: () => number
  canGenerate: () => boolean
}

export const useTimetableStore = create<TimetableState>()((set, get) => ({
  current: null,
  slots: [],
  conflicts: [],
  viewMode: 'master',
  selectedClassId: null,
  selectedTeacherId: null,
  isGenerating: false,
  generationProgress: 0,

  setCurrentTimetable: (tt) => set({ current: tt }),
  setCurrent:          (tt) => set({ current: tt }),  // alias for DashboardPage compatibility

  setSlots: (slots) => set({ slots }),

  addConflict: (c) =>
    set((s) => ({ conflicts: [...s.conflicts.filter((x) => x.id !== c.id), c] })),

  clearConflicts: () => set({ conflicts: [] }),

  resolveConflict: (id) =>
    set((s) => ({
      conflicts: s.conflicts.map((c) => (c.id === id ? { ...c, resolved: true } : c)),
    })),

  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedClass: (id) => set({ selectedClassId: id }),
  setSelectedTeacher: (id) => set({ selectedTeacherId: id }),
  setGenerating: (v) => set({ isGenerating: v }),
  setGenerationProgress: (pct) => set({ generationProgress: pct }),

  updateStatus: (status) =>
    set((s) => ({ current: s.current ? { ...s.current, status } : null })),

  hardConflictCount: () =>
    get().conflicts.filter((c) => c.severity === 'hard' && !c.resolved).length,

  softConflictCount: () =>
    get().conflicts.filter((c) => c.severity === 'soft' && !c.resolved).length,

  canGenerate: () => get().hardConflictCount() === 0,
}))
