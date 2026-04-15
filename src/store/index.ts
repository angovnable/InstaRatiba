import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { School, SchoolClass, Teacher, GenerateResult, AppStep, TimetableView, DbTimetableRecord, Language } from '@/types'
import {
  db, auth, TIMETABLES_COL,
  collection, doc, setDoc, getDocs, deleteDoc,
  query, where, orderBy, serverTimestamp
} from '@/lib/firebase'
import { uid } from '@/lib/constants'
import toast from 'react-hot-toast'

interface AppState {
  // Auth
  userId: string | null
  userEmail: string | null
  userDisplayName: string | null
  userPhoto: string | null

  // Navigation
  currentStep: AppStep
  currentView: TimetableView
  selectedClassId: string | null
  isDark: boolean
  lang: Language

  // Data
  school: School
  classes: SchoolClass[]
  teachers: Teacher[]
  timetableId: string | null

  // Generated
  generatedTimetable: GenerateResult['timetable'] | null
  conflicts: GenerateResult['conflicts']
  warnings: GenerateResult['warnings']
  compliance: GenerateResult['compliance']

  // UI
  isSaving: boolean
  isSyncing: boolean
  savedTimetables: DbTimetableRecord[]
  lastSynced: number | null

  // Actions — navigation
  setStep: (step: AppStep) => void
  setView: (view: TimetableView) => void
  setSelectedClass: (id: string | null) => void
  toggleTheme: () => void
  setLang: (lang: Language) => void

  // Actions — auth
  setUser: (userId: string | null, email: string | null, displayName: string | null, photo: string | null) => void
  signOut: () => Promise<void>

  // Actions — school
  updateSchool: (patch: Partial<School>) => void

  // Actions — classes
  addClass: (cls: Omit<SchoolClass, 'id'>) => void
  deleteClass: (id: string) => void
  updateClass: (id: string, patch: Partial<SchoolClass>) => void

  // Actions — teachers
  addTeacher: (t: Omit<Teacher, 'id'>) => void
  deleteTeacher: (id: string) => void
  updateTeacher: (id: string, patch: Partial<Teacher>) => void

  // Actions — generate
  setGenerateResult: (r: GenerateResult) => void
  clearGenerated: () => void

  // Actions — Firebase
  saveTimetable: (name?: string) => Promise<void>
  loadTimetables: () => Promise<void>
  loadTimetable: (record: DbTimetableRecord) => void
  deleteTimetable: (id: string) => Promise<void>
  syncIfOnline: () => Promise<void>
}

const DEFAULT_SCHOOL: School = {
  name: '',
  county: '',
  term: 'Term 1 2026',
  level: 'jss',
  startTime: '08:20',
  endTime: '16:00',
  lessonDurationJSS: 40,
  lessonDurationPrimary: 35,
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: null,
      userEmail: null,
      userDisplayName: null,
      userPhoto: null,
      currentStep: 0,
      currentView: 'class',
      selectedClassId: null,
      isDark: true,
      lang: 'en',
      school: DEFAULT_SCHOOL,
      classes: [],
      teachers: [],
      timetableId: null,
      generatedTimetable: null,
      conflicts: [],
      warnings: [],
      compliance: {},
      isSaving: false,
      isSyncing: false,
      savedTimetables: [],
      lastSynced: null,

      setStep: (step) => set({ currentStep: step }),
      setView: (view) => set({ currentView: view }),
      setSelectedClass: (id) => set({ selectedClassId: id }),
      toggleTheme: () => {
        const isDark = !get().isDark
        set({ isDark })
        document.documentElement.classList.toggle('dark', isDark)
      },
      setLang: (lang) => set({ lang }),

      setUser: (userId, userEmail, userDisplayName, userPhoto) =>
        set({ userId, userEmail, userDisplayName, userPhoto }),

      signOut: async () => {
        await auth.signOut()
        set({ userId: null, userEmail: null, userDisplayName: null, userPhoto: null, savedTimetables: [], timetableId: null })
      },

      updateSchool: (patch) => set(s => ({ school: { ...s.school, ...patch } })),

      addClass: (cls) => set(s => ({ classes: [...s.classes, { ...cls, id: uid() }] })),
      deleteClass: (id) => set(s => ({
        classes: s.classes.filter(c => c.id !== id),
        selectedClassId: s.selectedClassId === id ? null : s.selectedClassId
      })),
      updateClass: (id, patch) => set(s => ({
        classes: s.classes.map(c => c.id === id ? { ...c, ...patch } : c)
      })),

      addTeacher: (t) => set(s => ({ teachers: [...s.teachers, { ...t, id: uid() }] })),
      deleteTeacher: (id) => set(s => ({ teachers: s.teachers.filter(t => t.id !== id) })),
      updateTeacher: (id, patch) => set(s => ({
        teachers: s.teachers.map(t => t.id === id ? { ...t, ...patch } : t)
      })),

      setGenerateResult: (r) => set({
        generatedTimetable: r.timetable,
        conflicts: r.conflicts,
        warnings: r.warnings,
        compliance: r.compliance,
      }),
      clearGenerated: () => set({ generatedTimetable: null, conflicts: [], warnings: [], compliance: {} }),

      // ── Firebase: Save ──────────────────────────────────────────────────────
      saveTimetable: async (name) => {
        const { userId, school, classes, teachers, generatedTimetable, conflicts, warnings, compliance, timetableId } = get()
        if (!userId) {
          // Save locally (already in Zustand persist) — will sync when online & logged in
          toast.success('Saved locally (sign in to sync)', { icon: '💾' })
          return
        }
        set({ isSaving: true })
        const id = timetableId || uid()
        const payload: any = {
          id,
          userId,
          name: name || `${school.name || 'My School'} — ${school.term}`,
          school, classes, teachers,
          generatedTimetable: generatedTimetable ?? null,
          conflicts: conflicts ?? [],
          warnings: warnings ?? [],
          compliance: compliance ?? {},
          updatedAt: serverTimestamp(),
        }
        if (!timetableId) payload.createdAt = serverTimestamp()

        try {
          await setDoc(doc(db, TIMETABLES_COL, id), payload, { merge: true })
          set({ timetableId: id, lastSynced: Date.now() })
          if (navigator.onLine) {
            toast.success('Synced to cloud ✓', { icon: '☁️' })
          } else {
            toast.success('Saved offline — will sync when online', { icon: '📴' })
          }
          get().loadTimetables()
        } catch (e: any) {
          toast.error('Save failed: ' + e.message)
        } finally {
          set({ isSaving: false })
        }
      },

      // ── Firebase: Load list ─────────────────────────────────────────────────
      loadTimetables: async () => {
        const { userId } = get()
        if (!userId) return
        try {
          set({ isSyncing: true })
          const q = query(
            collection(db, TIMETABLES_COL),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
          )
          const snap = await getDocs(q)
          const records: DbTimetableRecord[] = snap.docs.map(d => ({ ...d.data(), id: d.id } as DbTimetableRecord))
          set({ savedTimetables: records, lastSynced: Date.now() })
        } catch (_e) {
          // Offline — use cached data silently
        } finally {
          set({ isSyncing: false })
        }
      },

      loadTimetable: (record) => {
        set({
          timetableId: record.id,
          school: record.school,
          classes: record.classes,
          teachers: record.teachers,
          generatedTimetable: record.generatedTimetable ?? null,
          conflicts: record.conflicts ?? [],
          warnings: record.warnings ?? [],
          compliance: record.compliance ?? {},
          currentStep: 0,
        })
        toast.success(`Loaded: ${record.name}`)
      },

      deleteTimetable: async (id) => {
        try {
          await deleteDoc(doc(db, TIMETABLES_COL, id))
          set(s => ({ savedTimetables: s.savedTimetables.filter(t => t.id !== id) }))
          toast.success('Deleted')
        } catch (e: any) {
          toast.error('Delete failed: ' + e.message)
        }
      },

      // Auto-sync when coming back online
      syncIfOnline: async () => {
        if (!navigator.onLine) return
        const { userId, timetableId } = get()
        if (!userId || !timetableId) return
        get().loadTimetables()
      },
    }),
    {
      name: 'instaratiba-store-v3',
      partialize: (s) => ({
        isDark: s.isDark,
        lang: s.lang,
        school: s.school,
        classes: s.classes,
        teachers: s.teachers,
        timetableId: s.timetableId,
        generatedTimetable: s.generatedTimetable,
        conflicts: s.conflicts,
        warnings: s.warnings,
        compliance: s.compliance,
      }),
    }
  )
)
