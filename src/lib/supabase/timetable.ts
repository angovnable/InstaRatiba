// ============================================================
// InstaRatiba — Segment 6
// Supabase data layer — timetables, slots, conflicts
// §6.3 Database Schema  |  §5.5 Versioning
// ============================================================

import { supabase } from './client'
import type { Timetable, TimetableSlot, TimetableOverride, Conflict } from '@/types'

// ── Timetable CRUD ────────────────────────────────────────────

export async function fetchTimetables(schoolId: string): Promise<Timetable[]> {
  const { data, error } = await supabase
    .from('timetables')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Timetable[]
}

export async function fetchTimetableById(id: string): Promise<Timetable> {
  const { data, error } = await supabase
    .from('timetables')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as Timetable
}

export async function createTimetable(
  timetable: Omit<Timetable, 'id' | 'created_at' | 'approved_at' | 'approved_by'>
): Promise<Timetable> {
  const { data, error } = await supabase
    .from('timetables')
    .insert({
      id:         crypto.randomUUID(),
      school_id:  timetable.school_id,
      term_id:    timetable.term_id,
      name:       timetable.name,
      status:     timetable.status,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Timetable
}

export async function updateTimetableStatus(
  id: string,
  status: Timetable['status'],
  approvedBy?: string,
): Promise<void> {
  const patch: Record<string, unknown> = { status }
  if (status === 'published' && approvedBy) {
    patch.approved_at = new Date().toISOString()
    patch.approved_by = approvedBy
  }

  const { error } = await supabase.from('timetables').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteTimetable(id: string): Promise<void> {
  // Cascade handled by DB foreign keys; also clean up slots locally
  await supabase.from('timetable_slots').delete().eq('timetable_id', id)
  await supabase.from('conflicts').delete().eq('timetable_id', id)
  const { error } = await supabase.from('timetables').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Slots ─────────────────────────────────────────────────────

export async function fetchSlots(timetableId: string): Promise<TimetableSlot[]> {
  const { data, error } = await supabase
    .from('timetable_slots')
    .select('*')
    .eq('timetable_id', timetableId)
    .order('slot_index', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as TimetableSlot[]
}

export async function bulkInsertSlots(slots: TimetableSlot[]): Promise<void> {
  if (!slots.length) return

  // Supabase has row limits per insert; batch in chunks of 500
  const CHUNK = 500
  for (let i = 0; i < slots.length; i += CHUNK) {
    const chunk = slots.slice(i, i + CHUNK)
    const { error } = await supabase.from('timetable_slots').insert(chunk)
    if (error) throw new Error(error.message)
  }
}

export async function clearSlots(timetableId: string): Promise<void> {
  const { error } = await supabase
    .from('timetable_slots')
    .delete()
    .eq('timetable_id', timetableId)
  if (error) throw new Error(error.message)
}

export async function updateSlot(slot: Partial<TimetableSlot> & { id: string }): Promise<void> {
  const { error } = await supabase
    .from('timetable_slots')
    .update({
      teacher_id:   slot.teacher_id ?? null,
      subject_code: slot.subject_code ?? null,
      room_id:      slot.room_id ?? null,
    })
    .eq('id', slot.id)
  if (error) throw new Error(error.message)
}

// ── Conflicts ─────────────────────────────────────────────────

export async function saveConflicts(conflicts: Conflict[]): Promise<void> {
  if (!conflicts.length) return
  // Clear old conflicts first
  if (conflicts[0]) {
    await supabase.from('conflicts').delete().eq('timetable_id', conflicts[0].timetable_id)
  }
  const { error } = await supabase.from('conflicts').insert(conflicts)
  if (error) throw new Error(error.message)
}

export async function fetchConflicts(timetableId: string): Promise<Conflict[]> {
  const { data, error } = await supabase
    .from('conflicts')
    .select('*')
    .eq('timetable_id', timetableId)
    .order('severity', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Conflict[]
}

export async function resolveConflict(id: string): Promise<void> {
  const { error } = await supabase
    .from('conflicts')
    .update({ resolved: true })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Overrides ─────────────────────────────────────────────────

export async function saveOverride(override: TimetableOverride): Promise<void> {
  const { error } = await supabase
    .from('timetable_overrides')
    .upsert({
      id:                  override.id,
      timetable_slot_id:   override.timetable_slot_id,
      reason:              override.reason,
      override_teacher_id: override.override_teacher_id ?? null,
      date:                override.date,
    })
  if (error) throw new Error(error.message)
}

export async function fetchOverrides(timetableId: string): Promise<TimetableOverride[]> {
  // Join via timetable_slots to scope by timetable
  const { data: slotIds } = await supabase
    .from('timetable_slots')
    .select('id')
    .eq('timetable_id', timetableId)

  const ids = (slotIds ?? []).map((s: { id: string }) => s.id)
  if (!ids.length) return []

  const { data, error } = await supabase
    .from('timetable_overrides')
    .select('*')
    .in('timetable_slot_id', ids)

  if (error) throw new Error(error.message)
  return (data ?? []) as TimetableOverride[]
}

// ── Share tokens ──────────────────────────────────────────────

export async function createShareToken(timetableId: string): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, '')
  const { error } = await supabase.from('timetable_share_tokens').insert({
    id:           crypto.randomUUID(),
    timetable_id: timetableId,
    token,
    created_at:   new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
  return token
}

export async function revokeShareToken(timetableId: string): Promise<void> {
  const { error } = await supabase
    .from('timetable_share_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('timetable_id', timetableId)
    .is('revoked_at', null)
  if (error) throw new Error(error.message)
}

export async function fetchActiveShareToken(timetableId: string): Promise<string | null> {
  const { data } = await supabase
    .from('timetable_share_tokens')
    .select('token')
    .eq('timetable_id', timetableId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data?.token ?? null
}
