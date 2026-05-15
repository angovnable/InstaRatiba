// ============================================================
// InstaRatiba — Segment 7
// ClassView — single class weekly timetable
// §4.2.10 "Class View" mode
// ============================================================

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTeacherStore } from '@/store/teacherStore'
import { buildDayLayout, gradeToLevel, DEFAULT_TIMINGS } from '@/lib/cbc/timing'
import { getSubjectByCode } from '@/lib/cbc/subjects'
import {
  getCellColour,
  DAYS, DAY_LABELS,
} from './cellHelpers'
import type { TimetableSlot, SchoolClass } from '@/types'

interface ClassViewProps {
  slots:       TimetableSlot[]
  cls:         SchoolClass
  conflictIds: Set<string>
  onCellClick: (slot: TimetableSlot) => void
  isEditable:  boolean
}

export default function ClassView({ slots, cls, conflictIds, onCellClick, isEditable }: ClassViewProps) {
  const { teachers } = useTeacherStore()
  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers])

  const level   = gradeToLevel(cls.grade)
  const timing  = DEFAULT_TIMINGS[level]
  const layout  = buildDayLayout(timing)

  // Index: day::slotIndex → slot
  const slotIdx = useMemo(() => {
    const m = new Map<string, TimetableSlot>()
    for (const s of slots) {
      if (s.class_id === cls.id) m.set(`${s.day}::${s.slot_index}`, s)
    }
    return m
  }, [slots, cls.id])

  return (
    <div className="overflow-x-auto rounded-xl border border-[--color-accent-light] shadow-sm">
      <table className="border-collapse w-full text-xs">
        <thead>
          <tr className="bg-[--color-surface]">
            <th className="border border-[--color-accent-light] px-3 py-2.5 text-left text-[--color-muted] font-semibold w-20 min-w-[80px] sticky left-0 bg-[--color-surface] z-10">
              Slot / Time
            </th>
            {DAYS.map(day => (
              <th key={day} className="border border-[--color-accent-light] px-2 py-2.5 text-center text-[--color-primary] font-bold min-w-[110px]">
                {DAY_LABELS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {layout.map((layoutSlot, rowIdx) => {
            const isStructural = layoutSlot.kind !== 'lesson'
            return (
              <tr
                key={layoutSlot.slot_index}
                className={isStructural ? 'bg-gray-50' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}
              >
                {/* Time column */}
                <td className="border border-[--color-accent-light] px-3 py-1 text-[--color-muted] text-[10px] sticky left-0 bg-inherit z-10 whitespace-nowrap">
                  <div className="font-semibold">{layoutSlot.start_time}</div>
                  <div className="opacity-60">{layoutSlot.end_time}</div>
                  {layoutSlot.kind === 'lesson' && (
                    <div className="text-[9px] text-[--color-primary] font-bold mt-0.5">L{layoutSlot.lesson_number}</div>
                  )}
                </td>

                {/* Day columns */}
                {DAYS.map(day => {
                  const slot = slotIdx.get(`${day}::${layoutSlot.slot_index}`)
                  const colour = slot ? getCellColour(slot) : { bg: '#FAFAFA', text: '#9E9E9E', border: '#E0E0E0' }
                  const hasConflict = slot ? conflictIds.has(slot.id) : false
                  const teacher = slot?.teacher_id ? teacherMap.get(slot.teacher_id) : null
                  const subject = slot?.subject_code ? getSubjectByCode(slot.subject_code) : null

                  return (
                    <motion.td
                      key={day}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: rowIdx * 0.02 }}
                      onClick={() => slot && !isStructural && isEditable && onCellClick(slot)}
                      className={[
                        'border px-2 py-1.5 text-center min-w-[110px]',
                        isEditable && slot && !isStructural ? 'cursor-pointer hover:brightness-95 transition-all' : '',
                        hasConflict ? 'ring-2 ring-inset ring-[--color-error]' : '',
                      ].join(' ')}
                      style={{
                        background:  colour.bg,
                        color:       colour.text,
                        borderColor: hasConflict ? 'var(--color-error)' : colour.border,
                      }}
                    >
                      {slot?.is_assembly ? (
                        <span className="font-semibold text-[11px]">Assembly / Roll Call</span>
                      ) : slot?.is_break ? (
                        <span className="font-semibold text-[11px]">
                          {layoutSlot.kind === 'lunch' ? 'Lunch Break' : `Break · ${layoutSlot.duration_min}min`}
                        </span>
                      ) : slot?.is_non_formal ? (
                        <span className="font-semibold text-[11px]">Non-Formal / Games</span>
                      ) : slot?.subject_code ? (
                        <div className="space-y-0.5">
                          <p className="font-bold text-[11px] leading-tight">{subject?.name ?? slot.subject_code}</p>
                          {teacher && (
                            <p className="text-[9px] opacity-70 leading-tight truncate">{teacher.name}</p>
                          )}
                          {hasConflict && (
                            <p className="text-[9px] text-[--color-error] font-semibold">
                              <i className="bi bi-exclamation-circle-fill" /> Conflict
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="opacity-30 text-[11px]">—</span>
                      )}
                    </motion.td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
