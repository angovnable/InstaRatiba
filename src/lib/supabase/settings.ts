// ============================================================
// InstaRatiba — Segment 9
// src/lib/supabase/settings.ts
// Data layer for Settings screen.
// §5.13 Settings Screen  |  §6.4 Supabase Auth Configuration
// ============================================================

import { supabase } from './client'
import type { School } from '@/types'

// ── Update school profile ─────────────────────────────────────

export async function updateSchool(
  id: string,
  patch: Partial<Pick<School, 'name' | 'motto' | 'nemis_code' | 'county' | 'logo_url'> & { meta?: Record<string, string> }>
): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as School
}

// ── Upload school logo to Supabase Storage ────────────────────

export async function uploadSchoolLogo(
  schoolId: string,
  file: File,
): Promise<string> {
  const ext  = file.name.split('.').pop()
  const path = `logos/${schoolId}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('school-assets')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadErr) throw new Error(uploadErr.message)

  const { data } = supabase.storage.from('school-assets').getPublicUrl(path)
  return data.publicUrl
}

// ── Share token helpers (re-exported from timetable.ts) ───────
// Settings tab uses the same token CRUD as the timetable viewer.

export async function createShareToken(timetableId: string): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, '')

  const { error } = await supabase.from('timetable_share_tokens').insert({
    id:           crypto.randomUUID(),
    timetable_id: timetableId,
    token,
    created_at:   new Date().toISOString(),
    revoked_at:   null,
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
    .maybeSingle()

  return data?.token ?? null
}
