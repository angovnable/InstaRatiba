// ============================================================
// InstaRatiba
// src/lib/supabase/allocations.ts
// Dedicated Supabase data layer for subject allocations (Issue #13 fix)
// §4.2.7 Lesson Allocation | §6.2 Module structure
// ============================================================

import { supabase } from './client'
import type { SubjectAllocation } from '@/types'

export async function fetchAllocations(schoolId: string): Promise<SubjectAllocation[]> {
  const { data, error } = await supabase
    .from('subject_allocations')
    .select('*')
    .eq('school_id', schoolId)

  if (error) throw new Error(error.message)
  return (data ?? []) as SubjectAllocation[]
}

export async function upsertAllocation(alloc: SubjectAllocation): Promise<SubjectAllocation> {
  const { data, error } = await supabase
    .from('subject_allocations')
    .upsert({
      id:               alloc.id,
      school_id:        alloc.school_id,
      class_id:         alloc.class_id,
      subject_code:     alloc.subject_code,
      lessons_per_week: alloc.lessons_per_week,
      requires_double:  alloc.requires_double,
      teacher_id:       alloc.teacher_id ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as SubjectAllocation
}

export async function bulkUpsertAllocations(
  allocations: SubjectAllocation[]
): Promise<void> {
  if (!allocations.length) return

  const rows = allocations.map(a => ({
    id:               a.id,
    school_id:        a.school_id,
    class_id:         a.class_id,
    subject_code:     a.subject_code,
    lessons_per_week: a.lessons_per_week,
    requires_double:  a.requires_double,
    teacher_id:       a.teacher_id ?? null,
  }))

  const { error } = await supabase
    .from('subject_allocations')
    .upsert(rows)

  if (error) throw new Error(error.message)
}

export async function deleteAllocationsForClass(classId: string): Promise<void> {
  const { error } = await supabase
    .from('subject_allocations')
    .delete()
    .eq('class_id', classId)
  if (error) throw new Error(error.message)
}
