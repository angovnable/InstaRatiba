// ============================================================
// InstaRatiba — Segment 7
// useTimetable hook
// Loads timetable + slots + conflicts + overrides from Supabase.
// Provides override editing, approval workflow actions, share link.
// §4.2.10 Timetable Generator & Viewer  |  §4.2.11 Approval
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTimetableStore }  from '@/store/timetableStore'
import { useAuthStore }       from '@/store/authStore'
import { useSchoolStore }     from '@/store/schoolStore'
import {
  fetchSlots,
  fetchConflicts,
  fetchOverrides,
  updateSlot,
  saveOverride,
  updateTimetableStatus,
  createShareToken,
  revokeShareToken,
  fetchActiveShareToken,
} from '@/lib/supabase/timetable'
import type { TimetableSlot, TimetableOverride, TimetableStatus } from '@/types'

export function useTimetable() {
  const store       = useTimetableStore()
  const { user }    = useAuthStore()
  const { school }  = useSchoolStore()

  const [overrides, setOverrides]         = useState<TimetableOverride[]>([])
  const [shareToken, setShareToken]       = useState<string | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // ── Load slots + conflicts + overrides on mount ─────────────
  useEffect(() => {
    if (!store.current) return

    const load = async () => {
      setIsLoadingData(true)
      try {
        // Slots: skip fetch if bootstrap already hydrated them for this timetable
        const slotsPromise = store.slots.length > 0
          ? Promise.resolve(store.slots)
          : fetchSlots(store.current!.id)

        const [slots, conflicts, ovr] = await Promise.all([
          slotsPromise,
          fetchConflicts(store.current!.id),
          fetchOverrides(store.current!.id),
        ])
        store.setSlots(slots)
        store.clearConflicts()
        conflicts.forEach(c => store.addConflict(c))
        setOverrides(ovr)

        const token = await fetchActiveShareToken(store.current!.id)
        setShareToken(token)
      } catch (err) {
        toast.error('Failed to load timetable data')
      } finally {
        setIsLoadingData(false)
      }
    }
    load()
  }, [store.current?.id]) // eslint-disable-line

  // ── Override a slot (manual edit) ──────────────────────────
  const overrideSlot = useCallback(async (
    slotId: string,
    patch: { subject_code?: string; teacher_id?: string; room_id?: string },
    reason: string,
  ) => {
    try {
      await updateSlot({ id: slotId, ...patch })

      // Record override log
      const override: TimetableOverride = {
        id:                  crypto.randomUUID(),
        timetable_slot_id:   slotId,
        reason,
        override_teacher_id: patch.teacher_id,
        date:                new Date().toISOString().slice(0, 10),
      }
      await saveOverride(override)
      setOverrides(prev => [...prev.filter(o => o.timetable_slot_id !== slotId), override])

      // Update local slot in store
      store.setSlots(
        store.slots.map(s =>
          s.id === slotId ? { ...s, ...patch } : s,
        ),
      )
      toast.success('Slot updated')
    } catch (err) {
      toast.error('Failed to save override: ' + (err as Error).message)
    }
  }, [store])

  // ── Approval workflow ───────────────────────────────────────
  const submitForApproval = useCallback(async () => {
    if (!store.current) return
    try {
      await updateTimetableStatus(store.current.id, 'pending')
      store.updateStatus('pending')
      toast.success('Timetable submitted for Head Teacher approval')
    } catch (err) {
      toast.error('Submit failed: ' + (err as Error).message)
    }
  }, [store])

  const approveTimetable = useCallback(async () => {
    if (!store.current || !user) return
    try {
      await updateTimetableStatus(store.current.id, 'published', user.id)
      store.updateStatus('published')
      toast.success('Timetable approved and published')
    } catch (err) {
      toast.error('Approval failed: ' + (err as Error).message)
    }
  }, [store, user])

  const returnForRevision = useCallback(async () => {
    if (!store.current) return
    try {
      await updateTimetableStatus(store.current.id, 'draft')
      store.updateStatus('draft')
      toast.info('Timetable returned to draft for revision')
    } catch (err) {
      toast.error('Failed to return timetable: ' + (err as Error).message)
    }
  }, [store])

  // ── Share link ──────────────────────────────────────────────
  const generateShareLink = useCallback(async () => {
    if (!store.current) return
    try {
      if (shareToken) await revokeShareToken(store.current.id)
      const token = await createShareToken(store.current.id)
      setShareToken(token)
      const url = `${window.location.origin}/timetable/share/${token}`
      await navigator.clipboard.writeText(url)
      toast.success('Share link copied to clipboard')
    } catch (err) {
      toast.error('Failed to generate share link')
    }
  }, [store, shareToken])

  const revokeShareLink = useCallback(async () => {
    if (!store.current) return
    try {
      await revokeShareToken(store.current.id)
      setShareToken(null)
      toast.success('Share link revoked')
    } catch (err) {
      toast.error('Failed to revoke share link')
    }
  }, [store])

  return {
    timetable:     store.current,
    slots:         store.slots,
    conflicts:     store.conflicts,
    overrides,
    shareToken,
    isLoadingData,
    viewMode:      store.viewMode,
    setViewMode:   store.setViewMode,
    selectedClassId:   store.selectedClassId,
    selectedTeacherId: store.selectedTeacherId,
    setSelectedClass:  store.setSelectedClass,
    setSelectedTeacher: store.setSelectedTeacher,
    overrideSlot,
    submitForApproval,
    approveTimetable,
    returnForRevision,
    generateShareLink,
    revokeShareLink,
    hardConflictCount: store.hardConflictCount(),
    softConflictCount: store.softConflictCount(),
  }
}
