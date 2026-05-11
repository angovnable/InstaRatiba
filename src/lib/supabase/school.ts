// ============================================================
// InstaRatiba — Segment 3
// Supabase school data layer
// ============================================================

import { supabase } from './client'
import type { School, LevelTiming, SchoolLevel } from '@/types'

// ── Upsert school profile ───────────────────────────────────
export async function upsertSchool(data: Partial<School>): Promise<School> {
  const { data: rows, error } = await supabase
    .from('schools')
    .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return rows as School
}

// ── Fetch school by user ────────────────────────────────────
export async function fetchSchoolByUser(userId: string): Promise<School | null> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as School | null
}

// ── Level timings ───────────────────────────────────────────
export async function upsertTimings(
  schoolId: string,
  timings: Record<SchoolLevel, LevelTiming>
): Promise<void> {
  const rows = Object.values(timings).map(t => ({
    school_id: schoolId,
    level: t.level,
    lesson_start: t.lesson_start,
    lesson_duration_min: t.lesson_duration_min,
    break1_after_lesson: t.break1_after_lesson,
    break1_duration_min: t.break1_duration_min,
    break2_after_lesson: t.break2_after_lesson,
    break2_duration_min: t.break2_duration_min,
    lunch_enabled: t.lunch_enabled,
    lunch_after_lesson: t.lunch_after_lesson ?? null,
    lunch_duration_min: t.lunch_duration_min ?? null,
    non_formal_start: t.non_formal_start ?? null,
    non_formal_end: t.non_formal_end ?? null,
  }))

  const { error } = await supabase
    .from('level_timings')
    .upsert(rows, { onConflict: 'school_id,level' })

  if (error) throw new Error(error.message)
}

export async function fetchTimings(schoolId: string): Promise<LevelTiming[]> {
  const { data, error } = await supabase
    .from('level_timings')
    .select('*')
    .eq('school_id', schoolId)

  if (error) throw new Error(error.message)
  return (data ?? []) as LevelTiming[]
}
