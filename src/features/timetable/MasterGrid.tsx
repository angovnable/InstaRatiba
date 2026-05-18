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

// A single timetable cell — redesigned
// TimetableCell — Emil Kowalski: staggered reveal, precise hover,
// two-line cell with subject + teacher initial. Conflict = left rule only.
function TimetableCell({
  slot, cls: _cls, teacherName, hasConflict, isEditable, onClick, rowIdx, colIdx,
}: {
  slot: TimetableSlot | undefined; cls: SchoolClass; teacherName: string
  hasConflict: boolean; isEditable: boolean; onClick: () => void
  rowIdx: number; colIdx: number
}) {
  const delay = (rowIdx * 10 + colIdx) * 0.010

  if (!slot) {
    return (
      <motion.td
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay, duration: 0.14 }}
        style={{
          border: '1px solid #EDE7D9',
          width: 88, height: 52,
          background: 'white',
        }}
      />
    )
  }

  const colour   = getCellColour(slot)
  const isFixed  = slot.is_assembly || slot.is_break || slot.is_non_formal
  const isBreak  = slot.is_break || slot.is_assembly || slot.is_non_formal
  const editable = isEditable && !isFixed

  return (
    <motion.td
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.14 }}
      onClick={() => editable && onClick()}
      title={hasConflict ? 'Conflict — click to resolve' : undefined}
      style={{
        border: '1px solid #EDE7D9',
        borderLeft: hasConflict ? '2px solid #A01F1F' : '1px solid #EDE7D9',
        width: 88, height: 52,
        padding: '3px 6px',
        verticalAlign: 'middle',
        textAlign: 'center',
        background: hasConflict
          ? 'rgba(160,31,31,0.04)'
          : isBreak
          ? 'rgba(200,146,42,0.06)'
          : colour.bg,
        color: isBreak ? '#9B6E1A' : colour.text,
        cursor: editable ? 'pointer' : 'default',
        transition: 'background 120ms',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (editable) (e.currentTarget as HTMLTableCellElement).style.background = 'rgba(200,146,42,0.07)'
      }}
      onMouseLeave={e => {
        if (editable) (e.currentTarget as HTMLTableCellElement).style.background =
          hasConflict ? 'rgba(160,31,31,0.04)' : isBreak ? 'rgba(200,146,42,0.06)' : colour.bg
      }}
    >
      {slot.is_assembly ? (
        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.68rem' }}>Assembly</span>
      ) : slot.is_break ? (
        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: '0.68rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
          <i className="bi-cup-hot-fill" style={{ fontSize: '0.6rem' }} /> Break
        </span>
      ) : slot.is_non_formal ? (
        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: '0.68rem' }}>Non-Formal</span>
      ) : slot.subject_code ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, height: '100%' }}>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.68rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            {getSubjectShortCode(slot.subject_code)}
          </span>
          {teacherName && (
            <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: '0.58rem', opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {teacherName}
            </span>
          )}
          {hasConflict && (
            <i className="bi-exclamation-circle-fill" style={{ fontSize: '0.55rem', color: '#A01F1F', marginTop: 1 }} />
          )}
        </div>
      ) : (
        <span style={{ opacity: 0.18, fontSize: '0.7rem' }}>—</span>
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
      <div style={{ display: 'flex', gap: 4, background: '#EDE7D9', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              fontFamily: "'Outfit', sans-serif",
              fontWeight: activeDay === day ? 600 : 500,
              fontSize: '0.82rem',
              background: activeDay === day ? 'white' : 'transparent',
              color: activeDay === day ? '#0D3D23' : '#7A8C82',
              border: 'none',
              cursor: 'pointer',
              boxShadow: activeDay === day ? '0 1px 4px rgba(13,61,35,0.10)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {DAY_LABELS[day]}
          </button>
        ))}
      </div>

      {/* Grid: scrollable horizontally */}
      <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid #EDE7D9', boxShadow: '0 2px 12px rgba(13,61,35,0.06)' }}>
        <table className="border-collapse text-xs" style={{ minWidth: sortedClasses.length * 96 + 80 }}>
          <thead>
            <tr style={{ background: '#0F1B14' }}>
              <th style={{
                position: 'sticky', left: 0, zIndex: 10,
                background: '#0F1B14',
                border: '1px solid rgba(200,146,42,0.15)',
                padding: '8px 12px',
                textAlign: 'left',
                fontFamily: "'Space Mono', monospace",
                fontWeight: 400,
                fontSize: '0.65rem',
                color: '#C8922A',
                width: 80,
                minWidth: 80,
              }}>
                Slot
              </th>
              {sortedClasses.map(cls => (
                <th
                  key={cls.id}
                  style={{
                    border: '1px solid rgba(200,146,42,0.15)',
                    padding: '8px',
                    textAlign: 'center',
                    fontFamily: "'Space Mono', monospace",
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    color: '#C8922A',
                    width: 96,
                    minWidth: 96,
                  }}
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
                  style={{ background: isBreakRow ? 'rgba(200,146,42,0.04)' : rowIdx % 2 === 0 ? 'white' : '#FDFCF9' }}
                >
                  {/* Time column */}
                  <td style={{
                    position: 'sticky', left: 0, zIndex: 10,
                    background: 'rgba(13,61,35,0.04)',
                    border: '1px solid #EDE7D9',
                    padding: '4px 12px',
                    width: 80, minWidth: 80,
                    whiteSpace: 'nowrap',
                  }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.62rem', color: '#1C2B22', fontWeight: 700 }}>{slot.start_time}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.58rem', color: '#7A8C82' }}>{slot.end_time}</div>
                    {slot.kind === 'lesson' && (
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.55rem', color: '#C8922A', fontWeight: 700 }}>L{slot.lesson_number}</div>
                    )}
                  </td>

                  {/* Class columns */}
                  {sortedClasses.map((cls, colIdx) => {
                    const levelLayout = buildDayLayout(DEFAULT_TIMINGS[gradeToLevel(cls.grade)])
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
                        rowIdx={rowIdx}
                        colIdx={colIdx}
                      />
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend — updated to new palette */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
        {[
          { label: 'Languages',   bg: 'rgba(30,92,138,0.10)',   border: 'rgba(30,92,138,0.2)',   text: '#1E5C8A' },
          { label: 'Sciences',    bg: 'rgba(13,61,35,0.10)',    border: 'rgba(13,61,35,0.2)',    text: '#0D3D23' },
          { label: 'Humanities',  bg: 'rgba(200,146,42,0.10)', border: 'rgba(200,146,42,0.2)', text: '#9B6E1A' },
          { label: 'Creative',    bg: 'rgba(160,31,31,0.08)',  border: 'rgba(160,31,31,0.15)', text: '#A01F1F' },
          { label: 'Break/PPI',   bg: 'rgba(200,146,42,0.08)', border: 'rgba(200,146,42,0.2)', text: '#9B6E1A' },
        ].map(l => (
          <span
            key={l.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 10px',
              borderRadius: 999,
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 500,
              fontSize: '0.68rem',
              background: l.bg,
              border: `1px solid ${l.border}`,
              color: l.text,
            }}
          >
            {l.label}
          </span>
        ))}
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 10px',
            borderRadius: 999,
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 500,
            fontSize: '0.68rem',
            background: 'rgba(160,31,31,0.08)',
            border: '1px solid rgba(160,31,31,0.25)',
            color: '#A01F1F',
          }}
        >
          <i className="bi bi-exclamation-circle-fill" style={{ fontSize: '0.6rem' }} /> Conflict
        </span>
      </div>
    </div>
  )
}
