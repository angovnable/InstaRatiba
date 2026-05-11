// ============================================================
// InstaRatiba — Segment 5
// Supabase data layer — teachers & subject allocations
// §4.2.6 Teacher Manager  |  §4.2.7 Lesson Allocation
// ============================================================

import { supabase } from './client'
import type { Teacher, TeacherSubject, SubjectAllocation } from '@/types'

// ── Teachers ─────────────────────────────────────────────────

export async function fetchTeachers(schoolId: string): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('school_id', schoolId)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Teacher[]
}

export async function upsertTeacher(teacher: Teacher): Promise<Teacher> {
  const { data, error } = await supabase
    .from('teachers')
    .upsert({
      id:                    teacher.id,
      school_id:             teacher.school_id,
      name:                  teacher.name,
      tsc_no:                teacher.tsc_no    ?? null,
      email:                 teacher.email     ?? null,
      phone:                 teacher.phone     ?? null,
      max_lessons_day:       teacher.max_lessons_day,
      max_lessons_week:      teacher.max_lessons_week ?? null,
      max_consecutive:       teacher.max_consecutive,
      min_free_periods_day:  teacher.min_free_periods_day ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Teacher
}

export async function deleteTeacher(id: string): Promise<void> {
  // Also cascade-delete teacher_subjects rows
  await supabase.from('teacher_subjects').delete().eq('teacher_id', id)
  const { error } = await supabase.from('teachers').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Teacher Subjects ─────────────────────────────────────────

export async function fetchTeacherSubjects(teacherId: string): Promise<TeacherSubject[]> {
  const { data, error } = await supabase
    .from('teacher_subjects')
    .select('*')
    .eq('teacher_id', teacherId)

  if (error) throw new Error(error.message)
  return (data ?? []) as TeacherSubject[]
}

export async function fetchAllTeacherSubjects(schoolId: string): Promise<TeacherSubject[]> {
  // Join via teachers to scope by school
  const { data: teachers } = await supabase
    .from('teachers')
    .select('id')
    .eq('school_id', schoolId)

  const ids = (teachers ?? []).map((t: { id: string }) => t.id)
  if (!ids.length) return []

  const { data, error } = await supabase
    .from('teacher_subjects')
    .select('*')
    .in('teacher_id', ids)

  if (error) throw new Error(error.message)
  return (data ?? []) as TeacherSubject[]
}

export async function upsertTeacherSubjects(
  teacherId: string,
  subjects: { subject_code: string; grades: number[] }[]
): Promise<void> {
  // Replace all subject assignments for this teacher
  await supabase.from('teacher_subjects').delete().eq('teacher_id', teacherId)

  if (!subjects.length) return

  const rows = subjects.map(s => ({
    id:           crypto.randomUUID(),
    teacher_id:   teacherId,
    subject_code: s.subject_code,
    grades:       s.grades,
  }))

  const { error } = await supabase.from('teacher_subjects').insert(rows)
  if (error) throw new Error(error.message)
}

// ── Subject Allocations ──────────────────────────────────────
// Allocation functions have moved to their own module (Issue #13 fix).
// Re-exported here for backward compatibility with existing imports.
export {
  fetchAllocations,
  upsertAllocation,
  bulkUpsertAllocations,
  deleteAllocationsForClass,
} from './allocations'
