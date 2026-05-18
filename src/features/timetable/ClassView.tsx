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
    <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid #EDE7D9', boxShadow: '0 2px 12px rgba(13,61,35,0.06)' }}>
      <table className="border-collapse w-full text-xs">
        <thead>
          <tr style={{ background: '#0F1B14' }}>
            <th style={{ border: '1px solid rgba(200,146,42,0.15)', padding: '10px 12px', textAlign: 'left', fontFamily: "'Space Mono', monospace", fontWeight: 400, fontSize: '0.62rem', color: '#C8922A', width: 80, minWidth: 80, position: 'sticky', left: 0, background: '#0F1B14', zIndex: 10 }}>
              Slot / Time
            </th>
            {DAYS.map(day => (
              <th key={day} style={{ border: '1px solid rgba(200,146,42,0.15)', padding: '10px 8px', textAlign: 'center', fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: '0.65rem', color: '#C8922A', minWidth: 110 }}>
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
                className={isStructural ? 'bg-[#F7F5EF]' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#FDFCF9]'}
              >
                {/* Time column */}
                <td style={{ border: '1px solid #EDE7D9', padding: '4px 12px', background: 'rgba(13,61,35,0.04)', position: 'sticky', left: 0, zIndex: 10, whiteSpace: 'nowrap' }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.62rem', color: '#1C2B22', fontWeight: 700 }}>{layoutSlot.start_time}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', color: '#7A8C82' }}>{layoutSlot.end_time}</div>
                  {layoutSlot.kind === 'lesson' && (
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: '#C8922A', fontWeight: 700, marginTop: 1 }}>L{layoutSlot.lesson_number}</div>
                  )}
                </td>

                {/* Day columns */}
                {DAYS.map(day => {
                  const slot = slotIdx.get(`${day}::${layoutSlot.slot_index}`)
                  const colour = slot ? getCellColour(slot) : { bg: '#FDFCF9', text: '#7A8C82', border: '#EDE7D9' }
                  const hasConflict = slot ? conflictIds.has(slot.id) : false
                  const teacher = slot?.teacher_id ? teacherMap.get(slot.teacher_id) : null
                  const subject = slot?.subject_code ? getSubjectByCode(slot.subject_code) : null

                  return (
                    <motion.td
                      key={day}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: rowIdx * 0.02 }}
                      onClick={() => slot && !isStructural && isEditable && onCellClick(slot)}
                      style={{
                        border: '1px solid #EDE7D9',
                        borderLeft: hasConflict ? '3px solid #A01F1F' : undefined,
                        padding: '6px 8px',
                        textAlign: 'center',
                        minWidth: 110,
                        background: hasConflict ? 'rgba(160,31,31,0.05)' : colour.bg,
                        color: colour.text,
                        cursor: isEditable && slot && !isStructural ? 'pointer' : 'default',
                      }}
                    >
                      {slot?.is_assembly ? (
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.72rem' }}>Assembly / Roll Call</span>
                      ) : slot?.is_break ? (
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                          <i className="bi-cup-hot-fill" style={{ fontSize: '0.62rem' }} />
                          {layoutSlot.kind === 'lunch' ? 'Lunch Break' : `Break · ${layoutSlot.duration_min}min`}
                        </span>
                      ) : slot?.is_non_formal ? (
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.72rem' }}>Non-Formal / Games</span>
                      ) : slot?.subject_code ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.72rem', lineHeight: 1.2 }}>{subject?.name ?? slot.subject_code}</p>
                          {teacher && (
                            <p style={{ fontFamily: "'Figtree', sans-serif", fontSize: '0.6rem', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teacher.name}</p>
                          )}
                          {hasConflict && (
                            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.6rem', color: '#A01F1F', fontWeight: 600 }}>
                              <i className="bi bi-exclamation-circle-fill" /> Conflict
                            </p>
                          )}
                        </div>
                      ) : (
                        <span style={{ opacity: 0.25, fontSize: '0.72rem' }}>—</span>
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
