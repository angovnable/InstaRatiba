// ============================================================
// InstaRatiba — Segment 4
// Supabase rooms data layer
// ============================================================

import { supabase } from './client'
import type { Room } from '@/types'

export async function fetchRooms(schoolId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('school_id', schoolId)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Room[]
}

export async function upsertRoom(room: Room): Promise<Room> {
  const { data, error } = await supabase
    .from('rooms')
    .upsert({
      id:            room.id,
      school_id:     room.school_id,
      name:          room.name,
      capacity:      room.capacity ?? null,
      subject_codes: room.subject_codes,
      levels:        room.levels,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Room
}

export async function deleteRoom(id: string): Promise<void> {
  const { error } = await supabase.from('rooms').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
