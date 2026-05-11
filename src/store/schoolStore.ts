import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { School, LevelTiming, AcademicTerm, SchoolLevel, SchoolClass, Room } from '@/types'
import { DEFAULT_TIMINGS } from '@/lib/cbc/timing'
export { DEFAULT_TIMINGS } from '@/lib/cbc/timing'

export interface SchoolState {
  school: School | null
  timings: Record<SchoolLevel, LevelTiming>
  activeTerm: AcademicTerm | null
  classes: SchoolClass[]
  rooms: Room[]

  // Actions
  setSchool: (school: School) => void
  updateSchool: (partial: Partial<School>) => void
  setTiming: (level: SchoolLevel, timing: LevelTiming) => void
  resetTiming: (level: SchoolLevel) => void
  setActiveTerm: (term: AcademicTerm) => void
  setClasses: (classes: SchoolClass[]) => void
  setRooms: (rooms: Room[]) => void
  clearSchool: () => void
  setHasCompletedSetup: (v: boolean) => void
}

export const useSchoolStore = create<SchoolState>()(
  persist(
    (set) => ({
      school: null,
      timings: { ...DEFAULT_TIMINGS },
      activeTerm: null,
      classes: [],
      rooms: [],

      setSchool: (school) => set({ school }),

      updateSchool: (partial) =>
        set((s) => ({ school: s.school ? { ...s.school, ...partial } : null })),

      setTiming: (level, timing) =>
        set((s) => ({ timings: { ...s.timings, [level]: timing } })),

      resetTiming: (level) =>
        set((s) => ({ timings: { ...s.timings, [level]: DEFAULT_TIMINGS[level] } })),

      setActiveTerm: (term) => set({ activeTerm: term }),
      setClasses: (classes) => set({ classes }),
      setRooms: (rooms) => set({ rooms }),

      // setHasCompletedSetup is kept for backward compat (SchoolSetupPage uses it)
      setHasCompletedSetup: (_v) => {
        // hasCompletedSetup lives in authStore; this is a no-op shim
      },

      clearSchool: () =>
        set({ school: null, timings: { ...DEFAULT_TIMINGS }, activeTerm: null, classes: [], rooms: [] }),
    }),
    {
      name: 'instaratiba-school',
    }
  )
)
