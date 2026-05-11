// ============================================================
// InstaRatiba — Segment 9
// SubstituteSwapModal.tsx
// Quick-swap for absent teachers. §5.6 Substitute Teacher Quick-Swap
// ============================================================

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { useTimetableStore } from '@/store/timetableStore'
import { updateSlot, saveOverride } from '@/lib/supabase/timetable'
import type { Teacher, TimetableSlot, TimetableOverride } from '@/types'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

interface Props {
  timetableId: string
  teachers:    Teacher[]
  onClose:     () => void
}

export default function SubstituteSwapModal({ timetableId, teachers, onClose }: Props) {
  const store = useTimetableStore()

  const [selectedDay,       setSelectedDay]       = useState<string>('Monday')
  const [absentTeacherId,   setAbsentTeacherId]   = useState<string>('')
  const [substituteId,      setSubstituteId]      = useState<string>('')
  const [affectedSlots,     setAffectedSlots]     = useState<TimetableSlot[]>([])
  const [isSaving,          setIsSaving]          = useState(false)

  // Find affected slots when absent teacher + day is chosen
  // Note: timetable_slots.day uses lowercase ('monday'), UI shows title case ('Monday')
  useEffect(() => {
    if (!absentTeacherId || !selectedDay) { setAffectedSlots([]); return }
    const dayKey = selectedDay.toLowerCase()
    const slots = store.slots.filter(
      s => s.teacher_id === absentTeacherId && s.day === dayKey
    )
    setAffectedSlots(slots)
  }, [absentTeacherId, selectedDay, store.slots])

  // Find available substitutes who are free at ALL affected slot times on that day
  const getAvailableSubs = () => {
    if (!absentTeacherId || affectedSlots.length === 0) return teachers
    const dayKey = selectedDay.toLowerCase()
    const busyAtSlots = new Set(
      store.slots
        .filter(s => s.day === dayKey && affectedSlots.some(a => a.slot_index === s.slot_index))
        .map(s => s.teacher_id)
    )
    return teachers.filter(
      t => t.id !== absentTeacherId && !busyAtSlots.has(t.id)
    )
  }

  const availableSubs = getAvailableSubs()

  const handleConfirm = async () => {
    if (!substituteId) { toast.error('Select a substitute teacher'); return }
    if (affectedSlots.length === 0) { toast.error('No lessons to swap'); return }

    setIsSaving(true)
    try {
      await Promise.all(affectedSlots.map(async slot => {
        await updateSlot({ id: slot.id, teacher_id: substituteId })

        const override: TimetableOverride = {
          id:                  crypto.randomUUID(),
          timetable_slot_id:   slot.id,
          reason:              `Teacher absent — substitute: ${teachers.find(t => t.id === substituteId)?.name}`,
          override_teacher_id: substituteId,
          date:                new Date().toISOString().slice(0, 10),
        }
        await saveOverride(override)
      }))

      // Update local store slots
      store.setSlots(
        store.slots.map(s =>
          affectedSlots.some(a => a.id === s.id)
            ? { ...s, teacher_id: substituteId }
            : s
        )
      )

      const subName = teachers.find(t => t.id === substituteId)?.name ?? 'Substitute'
      const absentName = teachers.find(t => t.id === absentTeacherId)?.name ?? 'Teacher'
      toast.success(`${affectedSlots.length} lesson${affectedSlots.length > 1 ? 's' : ''} swapped to ${subName} for ${selectedDay}`)
      onClose()
    } catch (e) {
      toast.error('Swap failed: ' + (e as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Substitute Teacher Swap" size="md">
      <div className="space-y-5 pt-2">

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <i className="bi bi-exclamation-triangle-fill text-amber-500 mt-0.5" />
          <p className="text-sm text-amber-800">
            This creates a <strong>temporary override</strong> for the selected day only. The original timetable is preserved.
          </p>
        </div>

        {/* Day */}
        <div>
          <label className="block text-xs font-medium text-[--color-muted] mb-1.5">Day of Absence</label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selectedDay === d
                    ? 'bg-[--color-primary] text-white border-[--color-primary]'
                    : 'border-[--color-accent-light] text-[--color-muted] hover:border-[--color-primary]'
                }`}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Absent teacher */}
        <div>
          <label className="block text-xs font-medium text-[--color-muted] mb-1.5">Absent Teacher</label>
          <select
            className="w-full border border-[--color-accent-light] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
            value={absentTeacherId}
            onChange={e => { setAbsentTeacherId(e.target.value); setSubstituteId('') }}
          >
            <option value="">Select teacher…</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Affected lessons */}
        {absentTeacherId && (
          <div>
            <label className="block text-xs font-medium text-[--color-muted] mb-1.5">
              Affected Lessons on {selectedDay}
            </label>
            {affectedSlots.length === 0 ? (
              <p className="text-sm text-[--color-muted] bg-[--color-surface] rounded-xl px-3 py-2.5">
                This teacher has no lessons on {selectedDay}.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {affectedSlots.map(s => (
                  <span key={s.id} className="text-xs bg-[--color-surface] border border-[--color-accent-light] px-2 py-1 rounded-lg">
                    <i className="bi bi-clock mr-1 text-[--color-muted]" />
                    Slot {s.slot_index + 1} — {s.subject_code}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Substitute */}
        {affectedSlots.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-[--color-muted] mb-1.5">
              Available Substitute Teachers
            </label>
            {availableSubs.length === 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm text-red-700">
                <i className="bi bi-x-circle mr-1.5" />
                No teachers are free during all affected slots on {selectedDay}.
              </div>
            ) : (
              <select
                className="w-full border border-[--color-accent-light] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                value={substituteId}
                onChange={e => setSubstituteId(e.target.value)}
              >
                <option value="">Select substitute…</option>
                {availableSubs.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-[--color-surface]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-[--color-accent-light] rounded-xl text-[--color-muted] hover:border-[--color-primary] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSaving || !substituteId || affectedSlots.length === 0}
            className="flex-1 py-2.5 text-sm bg-[--color-primary] text-white rounded-xl hover:bg-[--color-mid] transition-colors disabled:opacity-50"
          >
            {isSaving ? <i className="bi bi-arrow-repeat animate-spin mr-1.5" /> : null}
            Confirm Swap ({affectedSlots.length} lesson{affectedSlots.length !== 1 ? 's' : ''})
          </button>
        </div>
      </div>
    </Modal>
  )
}
