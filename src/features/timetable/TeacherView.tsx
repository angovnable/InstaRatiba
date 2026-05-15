// ============================================================
// InstaRatiba — Segment 7
// TeacherView — single teacher personal timetable
// §4.2.10 "Teacher View"  |  §5.3 Personal Timetable Extraction
// ============================================================

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useSchoolStore } from '@/store/schoolStore'
import { buildDayLayout, DEFAULT_TIMINGS } from '@/lib/cbc/timing'
import { getSubjectByCode } from '@/lib/cbc/subjects'
import { getCellColour, getClassLabel, DAYS, DAY_LABELS } from './cellHelpers'
import type { TimetableSlot, SchoolClass, Teacher } from '@/types'

interface TeacherViewProps {
  slots:    TimetableSlot[]
  teacher:  Teacher
  classes:  SchoolClass[]
}

export default function TeacherView({ slots, teacher, classes }: TeacherViewProps) {
  const { school: _school } = useSchoolStore()
  const classMap = useMemo(() => new Map(classes.map(c => [c.id, c])), [classes])

  // Teacher's slots only
  const teacherSlots = useMemo(
    () => slots.filter(s => s.teacher_id === teacher.id && !s.is_break && !s.is_assembly && !s.is_non_formal),
    [slots, teacher.id],
  )

  // Index: day::slotIndex → slot
  const slotIdx = useMemo(() => {
    const m = new Map<string, TimetableSlot>()
    for (const s of teacherSlots) m.set(`${s.day}::${s.slot_index}`, s)
    return m
  }, [teacherSlots])

  // Use the broadest layout (JSS has most slots); teacher may span levels
  const layout = buildDayLayout(DEFAULT_TIMINGS['junior_secondary'])

  // Weekly stats
  const totalLessons = teacherSlots.length
  const lessonsPerDay = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const day of DAYS) counts[day] = teacherSlots.filter(s => s.day === day).length
    return counts
  }, [teacherSlots])

  return (
    <div className="space-y-4">
      {/* Teacher summary */}
      <div className="flex flex-wrap gap-3">
        {/* Avatar */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[--color-primary] flex items-center justify-center text-white font-bold text-sm shrink-0">
            {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[--color-text] truncate">{teacher.name}</p>
            {teacher.tsc_no && <p className="text-xs text-[--color-muted]">TSC: {teacher.tsc_no}</p>}
          </div>
        </div>
        {/* Stats */}
        <div className="flex gap-2 shrink-0">
          <div className="text-center px-4 py-2 rounded-xl bg-[--color-surface] border border-[--color-accent-light]">
            <p className="text-xl font-bold text-[--color-primary]">{totalLessons}</p>
            <p className="text-[10px] text-[--color-muted]">lessons/wk</p>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-[--color-surface] border border-[--color-accent-light]">
            <p className="text-xl font-bold text-[--color-text]">{teacher.max_lessons_day}</p>
            <p className="text-[10px] text-[--color-muted]">max/day</p>
          </div>
        </div>
      </div>

      {/* Per-day load bar */}
      <div className="flex gap-2">
        {DAYS.map(day => {
          const count = lessonsPerDay[day]
          const pct   = Math.round((count / teacher.max_lessons_day) * 100)
          const over  = count > teacher.max_lessons_day
          return (
            <div key={day} className="flex-1 text-center space-y-1">
              <div className="text-[10px] text-[--color-muted] font-semibold">{DAY_LABELS[day]}</div>
              <div className="h-16 bg-[--color-surface] rounded-lg relative overflow-hidden border border-[--color-accent-light]">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min(pct, 100)}%` }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className={`absolute bottom-0 left-0 right-0 rounded-b-lg ${over ? 'bg-[--color-error]' : 'bg-[--color-primary]'}`}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[--color-text] z-10">
                  {count}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-[--color-accent-light] shadow-sm">
        <table className="border-collapse w-full text-xs">
          <thead>
            <tr className="bg-[--color-surface]">
              <th className="border border-[--color-accent-light] px-3 py-2.5 text-left text-[--color-muted] font-semibold w-20 sticky left-0 bg-[--color-surface] z-10">
                Slot
              </th>
              {DAYS.map(day => (
                <th key={day} className="border border-[--color-accent-light] px-2 py-2.5 text-center text-[--color-primary] font-bold min-w-[110px]">
                  {DAY_LABELS[day]}
                  <span className="block text-[9px] font-normal text-[--color-muted]">{lessonsPerDay[day]} lesson{lessonsPerDay[day] !== 1 ? 's' : ''}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {layout.map((layoutSlot, rowIdx) => (
              <tr key={layoutSlot.slot_index} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                {/* Time */}
                <td className="border border-[--color-accent-light] px-3 py-1 text-[--color-muted] text-[10px] sticky left-0 bg-inherit z-10 whitespace-nowrap">
                  <div className="font-semibold">{layoutSlot.start_time}</div>
                  <div className="opacity-60">{layoutSlot.end_time}</div>
                </td>

                {/* Days */}
                {DAYS.map(day => {
                  const slot    = slotIdx.get(`${day}::${layoutSlot.slot_index}`)
                  const cls     = slot?.class_id ? classMap.get(slot.class_id) : null
                  const subject = slot?.subject_code ? getSubjectByCode(slot.subject_code) : null
                  const colour  = slot ? getCellColour(slot) : null

                  return (
                    <motion.td
                      key={day}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: rowIdx * 0.02 }}
                      className="border border-[--color-accent-light] px-2 py-1.5 text-center min-w-[110px]"
                      style={colour ? { background: colour.bg, color: colour.text, borderColor: colour.border } : { background: '#F9FBE7', color: '#827717' }}
                    >
                      {slot ? (
                        <div className="space-y-0.5">
                          <p className="font-bold text-[11px] leading-tight">{subject?.name ?? slot.subject_code}</p>
                          {cls && (
                            <p className="text-[9px] opacity-70 leading-tight font-medium">
                              {getClassLabel(cls)}
                            </p>
                          )}
                          {slot.is_ppi && <p className="text-[9px] font-semibold">PPI</p>}
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium opacity-50">Free</span>
                      )}
                    </motion.td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
