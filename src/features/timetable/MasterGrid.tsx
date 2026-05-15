// ============================================================
// InstaRatiba — Segment 7
// MasterGrid — full school timetable matrix
// Time × Day rows, Class columns
// §4.2.10 "Master Grid" view mode
// ============================================================

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useSchoolStore }    from '@/store/schoolStore'
import { useTeacherStore }   from '@/store/teacherStore'
import { buildDayLayout, gradeToLevel, DEFAULT_TIMINGS } from '@/lib/cbc/timing'
import {
  getCellColour, getCellLabel, getSubjectShortCode, getClassLabel,
  DAYS, DAY_LABELS,
} from './cellHelpers'
import type { TimetableSlot, SchoolClass } from '@/types'

interface MasterGridProps {
  slots:    TimetableSlot[]
  classes:  SchoolClass[]
  conflicts: string[]  // slot ids with unresolved conflicts
  onCellClick: (slot: TimetableSlot, cls: SchoolClass) => void
  isEditable: boolean
}

// A single timetable cell
function TimetableCell({
  slot,
  cls: _cls,
  teacherName,
  hasConflict,
  isEditable,
  onClick,
}: {
  slot:        TimetableSlot | undefined
  cls:         SchoolClass // eslint-disable-line @typescript-eslint/no-unused-vars
  teacherName: string
  hasConflict: boolean
  isEditable:  boolean
  onClick:     () => void
}) {
  if (!slot) {
    return (
      <td className="border border-gray-100 w-24 h-14 text-center text-xs text-gray-300 bg-white">
        —
      </td>
    )
  }

  const colour = getCellColour(slot)
  const label  = getCellLabel(slot)
  const isFixed = slot.is_assembly || slot.is_break || slot.is_non_formal

  return (
    <motion.td
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={[
        'border w-24 h-14 p-1 text-center text-[10px] leading-tight align-middle',
        isEditable && !isFixed ? 'cursor-pointer hover:brightness-95 transition-all' : '',
        hasConflict ? 'ring-2 ring-inset ring-[--color-error]' : '',
      ].join(' ')}
      style={{
        background:   colour.bg,
        color:        colour.text,
        borderColor:  hasConflict ? 'var(--color-error)' : colour.border,
      }}
      onClick={() => !isFixed && isEditable && onClick()}
      title={hasConflict ? 'Conflict detected — click to edit' : label.top}
    >
      {slot.is_assembly ? (
        <span className="font-semibold">Assembly</span>
      ) : slot.is_break ? (
        <span className="font-semibold">Break</span>
      ) : slot.is_non_formal ? (
        <span className="font-semibold">Non-Formal</span>
      ) : slot.subject_code ? (
        <div className="flex flex-col items-center justify-center h-full gap-0.5">
          <span className="font-bold text-[11px]">{getSubjectShortCode(slot.subject_code)}</span>
          {teacherName && (
            <span className="opacity-70 truncate w-full text-center text-[9px]">{teacherName}</span>
          )}
          {hasConflict && <i className="bi bi-exclamation-circle-fill text-[--color-error] text-[9px]" />}
        </div>
      ) : (
        <span className="opacity-40">—</span>
      )}
    </motion.td>
  )
}

export default function MasterGrid({ slots, classes, conflicts, onCellClick, isEditable }: MasterGridProps) {
  useSchoolStore() // reserved for school-level config
  const { teachers } = useTeacherStore()
  const [activeDay, setActiveDay] = useState<string>('monday')

  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers])
  const conflictSlotIds = useMemo(() => new Set(conflicts), [conflicts])

  // Build slot index for fast lookup: `classId::day::slotIndex` → slot
  const slotIndex = useMemo(() => {
    const idx = new Map<string, TimetableSlot>()
    for (const s of slots) idx.set(`${s.class_id}::${s.day}::${s.slot_index}`, s)
    return idx
  }, [slots])

  // Build layout for the first available level to get slot indexes/times
  const sampleLevel = classes[0] ? gradeToLevel(classes[0].grade) : 'lower_primary'
  const sampleTiming = DEFAULT_TIMINGS[sampleLevel]
  const layout = buildDayLayout(sampleTiming)

  // Sort classes by grade then stream
  const sortedClasses = useMemo(() =>
    [...classes].sort((a, b) => a.grade !== b.grade ? a.grade - b.grade : a.stream.localeCompare(b.stream)),
    [classes],
  )

  // Mobile: show one day at a time; desktop: show all days grouped
  // We'll use a tabbed-day approach for manageability on any screen size.

  return (
    <div className="space-y-3">
      {/* Day tabs */}
      <div className="flex gap-1 bg-[--color-surface] rounded-xl p-1 w-fit">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={[
              'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
              activeDay === day
                ? 'bg-white text-[--color-primary] shadow-sm'
                : 'text-[--color-muted] hover:text-[--color-text]',
            ].join(' ')}
          >
            {DAY_LABELS[day]}
          </button>
        ))}
      </div>

      {/* Grid: scrollable horizontally */}
      <div className="overflow-x-auto rounded-xl border border-[--color-accent-light] shadow-sm">
        <table className="border-collapse text-xs" style={{ minWidth: sortedClasses.length * 96 + 80 }}>
          <thead>
            <tr className="bg-[--color-surface]">
              <th className="sticky left-0 z-10 bg-[--color-surface] border border-[--color-accent-light] px-3 py-2 text-left text-[--color-muted] font-semibold w-20 min-w-[80px]">
                Slot
              </th>
              {sortedClasses.map(cls => (
                <th
                  key={cls.id}
                  className="border border-[--color-accent-light] px-2 py-2 text-center text-[--color-primary] font-bold w-24 min-w-[96px]"
                >
                  {getClassLabel(cls)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {layout.map((slot, rowIdx) => {
              const isBreakRow = slot.kind !== 'lesson'
              return (
                <tr
                  key={slot.slot_index}
                  className={isBreakRow ? 'bg-gray-50' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}
                >
                  {/* Time column */}
                  <td className="sticky left-0 z-10 bg-inherit border border-[--color-accent-light] px-3 py-1 text-[--color-muted] text-[10px] w-20 min-w-[80px] whitespace-nowrap">
                    <div className="font-semibold">{slot.start_time}</div>
                    <div className="opacity-60">{slot.end_time}</div>
                    {slot.kind === 'lesson' && (
                      <div className="text-[9px] text-[--color-primary] font-bold">L{slot.lesson_number}</div>
                    )}
                  </td>

                  {/* Class columns */}
                  {sortedClasses.map(cls => {
                    const levelLayout = buildDayLayout(DEFAULT_TIMINGS[gradeToLevel(cls.grade)])
                    // Find matching slot for this class's level
                    const levelSlot = levelLayout[rowIdx]
                    const cellSlot  = levelSlot
                      ? slotIndex.get(`${cls.id}::${activeDay}::${levelSlot.slot_index}`)
                      : undefined

                    const teacherName = cellSlot?.teacher_id
                      ? (teacherMap.get(cellSlot.teacher_id)?.name.split(' ')[0] ?? '')
                      : ''

                    return (
                      <TimetableCell
                        key={cls.id}
                        slot={cellSlot}
                        cls={cls}
                        teacherName={teacherName}
                        hasConflict={cellSlot ? conflictSlotIds.has(cellSlot.id) : false}
                        isEditable={isEditable}
                        onClick={() => cellSlot && onCellClick(cellSlot, cls)}
                      />
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-1">
        {[
          { label: 'Languages',   bg: '#E3F2FD', border: '#90CAF9', text: '#1565C0' },
          { label: 'Mathematics', bg: '#E8F5E9', border: '#A5D6A7', text: '#2E7D32' },
          { label: 'Sciences',    bg: '#E0F2F1', border: '#80CBC4', text: '#00695C' },
          { label: 'Humanities',  bg: '#F3E5F5', border: '#CE93D8', text: '#6A1B9A' },
          { label: 'Creative',    bg: '#FBE9E7', border: '#FFAB91', text: '#E65100' },
          { label: 'PHE',         bg: '#FFF8E1', border: '#FFE082', text: '#F57F17' },
          { label: 'Practical',   bg: '#F1F8E9', border: '#C5E1A5', text: '#558B2F' },
          { label: 'Technology',  bg: '#ECEFF1', border: '#B0BEC5', text: '#37474F' },
        ].map(l => (
          <span
            key={l.label}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border"
            style={{ background: l.bg, borderColor: l.border, color: l.text }}
          >
            {l.label}
          </span>
        ))}
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border border-red-300 bg-red-50 text-red-700">
          <i className="bi bi-exclamation-circle-fill" /> Conflict
        </span>
      </div>
    </div>
  )
}
