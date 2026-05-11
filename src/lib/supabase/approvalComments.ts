// ============================================================
// InstaRatiba — Segment 7
// Supabase: approval comments data layer
// ============================================================

import { supabase } from './client'
import type { ApprovalComment } from '@/types'

export async function fetchApprovalComments(timetableId: string): Promise<ApprovalComment[]> {
  const { data, error } = await supabase
    .from('approval_comments')
    .select('*')
    .eq('timetable_id', timetableId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as ApprovalComment[]
}

export async function postApprovalComment(comment: ApprovalComment): Promise<void> {
  const { error } = await supabase.from('approval_comments').insert(comment)
  if (error) throw new Error(error.message)
}

export async function deleteApprovalComment(id: string): Promise<void> {
  const { error } = await supabase.from('approval_comments').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
