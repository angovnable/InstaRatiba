// ============================================================
// InstaRatiba — Segment 7
// SlotEditModal — manual override for a generated timetable slot
// §4.2.10 "Cell Click — Edit Override"
// ============================================================

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTeacherStore }    from '@/store/teacherStore'
import { useSchoolStore }     from '@/store/schoolStore'
import { useTimetableStore }  from '@/store/timetableStore'
import { getSubjectByCode, getSubjectsForLevels } from '@/lib/cbc/subjects'
import { gradeToLevel }       from '@/lib/cbc/timing'
import { getCellColour, getSubjectShortCode } from './cellHelpers'
import type { TimetableSlot, SchoolClass } from '@/types'

interface SlotEditModalProps {
  slot:     TimetableSlot | null
  cls:      SchoolClass   | null
  onClose:  () => void
  onSave:   (slotId: string, patch: { subject_code?: string; teacher_id?: string }, reason: string) => Promise<void>
}

export default function SlotEditModal({ slot, cls, onClose, onSave }: SlotEditModalProps) {
  const { teachers, teacherSubjects } = useTeacherStore()
  const { school } = useSchoolStore()
  const { slots } = useTimetableStore()

  const [subjectCode, setSubjectCode] = useState(slot?.subject_code ?? '')
  const [teacherId,   setTeacherId]   = useState(slot?.teacher_id  ?? '')
  const [reason,      setReason]      = useState('')
  const [isSaving,    setIsSaving]    = useState(false)
  const [warning,     setWarning]     = useState<string | null>(null)

  // Reset on slot change
  useEffect(() => {
    setSubjectCode(slot?.subject_code ?? '')
    setTeacherId(slot?.teacher_id ?? '')
    setReason('')
    setWarning(null)
  }, [slot?.id, slot?.subject_code, slot?.teacher_id])

  if (!slot || !cls) return null

  const level = gradeToLevel(cls.grade)
  const levelSubjects = getSubjectsForLevels([level])

  // Eligible teachers: those with the selected subject + grade
  const eligibleTeachers = teachers.filter(t => {
    const subjects = teacherSubjects.filter(ts => ts.teacher_id === t.id)
    return subjects.some(ts => ts.subject_code === subjectCode && ts.grades.includes(cls.grade))
  })

  // Conflict check: is teacher already busy at this day/slot?
  const checkTeacherConflict = (tid: string) => {
    const busy = slots.find(s =>
      s.teacher_id === tid &&
      s.day === slot.day &&
      s.slot_index === slot.slot_index &&
      s.id !== slot.id
    )
    if (busy) {
      const busyCls = school ? `another class` : 'another class'
      setWarning(`This teacher is already assigned to ${busyCls} at this slot on ${slot.day}.`)
    } else {
      setWarning(null)
    }
  }

  const handleTeacherChange = (tid: string) => {
    setTeacherId(tid)
    checkTeacherConflict(tid)
  }

  const handleSave = async () => {
    if (!reason.trim()) return
    setIsSaving(true)
    try {
      await onSave(slot.id, { subject_code: subjectCode || undefined, teacher_id: teacherId || undefined }, reason)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const colour = getCellColour(slot)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1,    opacity: 1 }}
          exit={{    scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[--color-accent-light]">
            <div>
              <h2 className="font-bold text-[--color-text]">Edit Slot</h2>
              <p className="text-xs text-[--color-muted] mt-0.5">
                Grade {cls.grade}{cls.stream} · {slot.day.charAt(0).toUpperCase() + slot.day.slice(1)} · Slot {slot.slot_index + 1}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[--color-surface] transition-colors">
              <i className="bi bi-x-lg text-[--color-muted]" />
            </button>
          </div>

          {/* Current slot preview */}
          <div className="px-5 pt-4">
            <p className="text-xs font-semibold text-[--color-muted] uppercase tracking-wide mb-2">Current</p>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium"
              style={{ background: colour.bg, borderColor: colour.border, color: colour.text }}
            >
              <span className="text-lg font-bold w-10 text-center">
                {slot.subject_code ? getSubjectShortCode(slot.subject_code) : '—'}
              </span>
              <div>
                <p>{slot.subject_code ? (getSubjectByCode(slot.subject_code)?.name ?? slot.subject_code) : 'Free'}</p>
                <p className="text-xs opacity-70 mt-0.5">
                  {slot.teacher_id ? (teachers.find(t => t.id === slot.teacher_id)?.name ?? 'Unknown') : 'No teacher'}
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 pt-4 space-y-4">
            {/* Subject select */}
            <div>
              <label className="block text-xs font-semibold text-[--color-muted] uppercase tracking-wide mb-1">
                Subject
              </label>
              <select
                value={subjectCode}
                onChange={e => { setSubjectCode(e.target.value); setTeacherId(''); setWarning(null) }}
                className="w-full border border-[--color-accent-light] rounded-lg px-3 py-2 text-sm text-[--color-text] bg-white focus:ring-2 focus:ring-[--color-primary] focus:outline-none"
              >
                <option value="">— Free / Empty —</option>
                {levelSubjects.map(s => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Teacher select */}
            <div>
              <label className="block text-xs font-semibold text-[--color-muted] uppercase tracking-wide mb-1">
                Teacher
              </label>
              <select
                value={teacherId}
                onChange={e => handleTeacherChange(e.target.value)}
                disabled={!subjectCode}
                className="w-full border border-[--color-accent-light] rounded-lg px-3 py-2 text-sm text-[--color-text] bg-white focus:ring-2 focus:ring-[--color-primary] focus:outline-none disabled:opacity-50"
              >
                <option value="">— No teacher —</option>
                {eligibleTeachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                {subjectCode && eligibleTeachers.length === 0 && (
                  <option disabled value="">No eligible teachers for this subject/grade</option>
                )}
              </select>
            </div>

            {/* Conflict warning */}
            {warning && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800"
              >
                <i className="bi bi-exclamation-triangle-fill mt-0.5 shrink-0" />
                <span>{warning}</span>
              </motion.div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-[--color-muted] uppercase tracking-wide mb-1">
                Reason for override <span className="text-[--color-error]">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Teacher absent, room unavailable…"
                rows={2}
                className="w-full border border-[--color-accent-light] rounded-lg px-3 py-2 text-sm text-[--color-text] bg-white focus:ring-2 focus:ring-[--color-primary] focus:outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[--color-accent-light] text-sm font-semibold text-[--color-text] hover:bg-[--color-surface] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !reason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[--color-primary] text-white text-sm font-semibold hover:bg-[--color-mid] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  : <><i className="bi bi-check-lg" /> Save Override</>
                }
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
