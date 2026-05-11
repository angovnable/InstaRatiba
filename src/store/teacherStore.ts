// ============================================================
// InstaRatiba — Segment 5
// Teacher store — CRUD state + teacher-subject assignments
// §4.2.6 Teacher Manager
// ============================================================

import { create } from 'zustand'
import type { Teacher, TeacherSubject } from '@/types'

interface TeacherState {
  teachers: Teacher[]
  teacherSubjects: TeacherSubject[]   // all subjects across all teachers for this school
  isLoading: boolean

  // Actions
  setTeachers:        (teachers: Teacher[]) => void
  addTeacher:         (teacher: Teacher) => void
  updateTeacher:      (teacher: Teacher) => void
  removeTeacher:      (id: string) => void
  setTeacherSubjects: (subjects: TeacherSubject[]) => void
  setSubjectsForTeacher: (teacherId: string, subjects: TeacherSubject[]) => void
  setLoading:         (v: boolean) => void

  // Selectors
  getTeacherById:      (id: string) => Teacher | undefined
  getSubjectsForTeacher: (teacherId: string) => TeacherSubject[]
  /** Teachers who can teach a given subject + grade */
  getEligibleTeachers: (subjectCode: string, grade: number) => Teacher[]
}

export const useTeacherStore = create<TeacherState>((set, get) => ({
  teachers: [],
  teacherSubjects: [],
  isLoading: false,

  setTeachers: (teachers) => set({ teachers }),

  addTeacher: (teacher) =>
    set((s) => ({ teachers: [...s.teachers, teacher] })),

  updateTeacher: (teacher) =>
    set((s) => ({
      teachers: s.teachers.map((t) => (t.id === teacher.id ? teacher : t)),
    })),

  removeTeacher: (id) =>
    set((s) => ({
      teachers: s.teachers.filter((t) => t.id !== id),
      teacherSubjects: s.teacherSubjects.filter((ts) => ts.teacher_id !== id),
    })),

  setTeacherSubjects: (subjects) => set({ teacherSubjects: subjects }),

  setSubjectsForTeacher: (teacherId, subjects) =>
    set((s) => ({
      teacherSubjects: [
        ...s.teacherSubjects.filter((ts) => ts.teacher_id !== teacherId),
        ...subjects,
      ],
    })),

  setLoading: (v) => set({ isLoading: v }),

  getTeacherById: (id) => get().teachers.find((t) => t.id === id),

  getSubjectsForTeacher: (teacherId) =>
    get().teacherSubjects.filter((ts) => ts.teacher_id === teacherId),

  getEligibleTeachers: (subjectCode, grade) => {
    const { teachers, teacherSubjects } = get()
    const eligibleIds = new Set(
      teacherSubjects
        .filter((ts) => ts.subject_code === subjectCode && ts.grades.includes(grade))
        .map((ts) => ts.teacher_id)
    )
    return teachers.filter((t) => eligibleIds.has(t.id))
  },
}))
