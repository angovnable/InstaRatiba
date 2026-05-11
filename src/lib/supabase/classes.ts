// ============================================================
// InstaRatiba — Segment 4
// Supabase classes & teachers data layer
// ============================================================

import { supabase } from './client'
import type { SchoolClass, Teacher, TeacherSubject } from '@/types'

// ── Classes ─────────────────────────────────────────────────

export async function fetchClasses(schoolId: string): Promise<SchoolClass[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('school_id', schoolId)
    .order('grade', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as SchoolClass[]
}

export async function upsertClass(c: SchoolClass): Promise<SchoolClass> {
  const { data, error } = await supabase
    .from('classes')
    .upsert({
      id: c.id,
      school_id: c.school_id,
      grade: c.grade,
      stream: c.stream,
      class_teacher_id: c.class_teacher_id ?? null,
      size: c.size ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as SchoolClass
}

export async function deleteClass(id: string): Promise<void> {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Teachers (read-only here — full CRUD in Segment 5) ──────

export async function fetchTeachers(schoolId: string): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('school_id', schoolId)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Teacher[]
}

export async function fetchTeacherSubjects(schoolId: string): Promise<TeacherSubject[]> {
  const { data, error } = await supabase
    .from('teacher_subjects')
    .select('*')
    .in('teacher_id',
      (await supabase.from('teachers').select('id').eq('school_id', schoolId)).data?.map(r => r.id) ?? []
    )

  if (error) throw new Error(error.message)
  return (data ?? []) as TeacherSubject[]
}
