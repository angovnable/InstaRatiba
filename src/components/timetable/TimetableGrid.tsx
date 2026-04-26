import { useStore } from '@/store'
import { buildSlots, JSS_SLOTS, UPPER_PRIMARY_SLOTS, DAYS, getSubjectColor } from '@/lib/constants'
import type { TimeSlot } from '@/lib/constants'

interface Props {
  view: 'class' | 'teacher'
  selectedId: string
}

export function TimetableGrid({ view, selectedId }: Props) {
  const { classes, teachers, generatedTimetable, school } = useStore()

  if (!generatedTimetable) return null

  // FIX #2: Build slots dynamically from school settings, not hardcoded JSS_SLOTS
  function getSlotsForLevel(level: 'jss' | 'upper_primary' | 'lower_primary'): TimeSlot[] {
    if (level === 'jss') {
      if (school?.startTime) {
        return buildSlots({
          startTime: school.startTime,
          lessonDuration: school.lessonDurationJSS,
          teaBreakStart: school.teaBreakStartJSS,
          teaBreakEnd: school.teaBreakEndJSS,
          lunchStart: school.lunchStartJSS,
          lunchEnd: school.lunchEndJSS,
          endTime: school.endTime,
        })
      }
      return JSS_SLOTS
    } else {
      if (school?.startTimePrimary) {
        return buildSlots({
          startTime: school.startTimePrimary,
          lessonDuration: school.lessonDurationPrimary,
          teaBreakStart: school.teaBreakStartPrimary,
          teaBreakEnd: school.teaBreakEndPrimary,
          lunchStart: school.lunchStartPrimary,
          lunchEnd: school.lunchEndPrimary,
          endTime: school.endTimePrimary,
        })
      }
      return UPPER_PRIMARY_SLOTS
    }
  }

  if (view === 'class') {
    const cls = classes.find(c => c.id === selectedId)
    const grid = generatedTimetable[selectedId]
    if (!cls || !grid) return (
      <p style={{ color: 'var(--text-muted)', padding: '24px', textAlign: 'center' }}>No timetable for this class.</p>
    )

    const allSlots = getSlotsForLevel(cls.level)
    let lessonIdx = 0
    return (
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 12, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
        <table className="tt-table">
          <thead>
            <tr>
              <th className="tt-th" style={{ textAlign: 'left', paddingLeft: 12, minWidth: 88 }}>Time</th>
              {DAYS.map(d => (
                <th key={d} className="tt-th">
                  <span className="day-full">{d}</span>
                  <span className="day-short">{d.slice(0, 3)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allSlots.map((slot, rowIdx) => {
              if (slot.type === 'pre') {
                return (
                  <tr key={rowIdx} className="tt-break-row">
                    <td className="tt-td" style={{ paddingLeft: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Assembly</span>
                    </td>
                    {DAYS.map((_, di) => <td key={di} className="tt-td" />)}
                  </tr>
                )
              }
              if (slot.type === 'break') {
                return (
                  <tr key={rowIdx} className="tt-break-row">
                    <td className="tt-td" style={{ paddingLeft: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{slot.label}</span>
                      <div style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{slot.time}</div>
                    </td>
                    {DAYS.map((_, di) => <td key={di} className="tt-td" />)}
                  </tr>
                )
              }
              const si = lessonIdx++
              return (
                <tr key={rowIdx}>
                  <td className="tt-td" style={{ paddingLeft: 8 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>{slot.time}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{slot.label}</div>
                  </td>
                  {DAYS.map((_, di) => {
                    const cell = grid[di]?.[si]
                    if (!cell) return (
                      <td key={di} className="tt-td">
                        <div className="lesson-cell" style={{ background: 'var(--cell-empty)' }} />
                      </td>
                    )
                    if (cell.locked && !cell.subjectName) return (
                      <td key={di} className="tt-td">
                        <div className="lesson-cell" style={{ background: 'var(--warning-glow)', alignItems: 'center' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cell.label || 'Locked'}</span>
                        </div>
                      </td>
                    )
                    const color = cell.color || getSubjectColor(cell.subjectName)
                    const teacher = teachers.find(t => t.id === cell.teacherId)
                    const surname = teacher ? teacher.name.split(' ').slice(-1)[0] : ''
                    const delay = (di * 0.012 + si * 0.028).toFixed(3)
                    return (
                      <td key={di} className="tt-td">
                        <div className="lesson-cell animate-fade-in" style={{ background: color, animationDelay: `${delay}s` }}>
                          {cell.isDouble && (
                            <span style={{ position: 'absolute', top: 3, right: 4, fontSize: 8, background: 'rgba(255,255,255,0.22)', borderRadius: 3, padding: '1px 4px', color: 'white', fontWeight: 700 }}>×2</span>
                          )}
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'white', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cell.subjectName}
                          </div>
                          {surname && (
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.78)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {surname}
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        <style>{`
          .day-short { display: none; }
          @media (max-width: 640px) { .day-full { display: none; } .day-short { display: inline; } }
        `}</style>
      </div>
    )
  }

  // ── Teacher view ──────────────────────────────────────────────────────────
  const teacher = teachers.find(t => t.id === selectedId)
  if (!teacher) return null

  // For teacher view, use JSS slots by default (or detect from first class they teach)
  const firstTaughtClass = classes.find(cls =>
    Object.values(generatedTimetable[cls.id] ?? {}).some(day =>
      Object.values(day).some(cell => cell?.teacherId === selectedId)
    )
  )
  const teacherSlots = firstTaughtClass
    ? getSlotsForLevel(firstTaughtClass.level)
    : getSlotsForLevel('jss')

  let lessonIdx2 = 0
  return (
    <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
      <table className="tt-table">
        <thead>
          <tr>
            <th className="tt-th" style={{ textAlign: 'left', paddingLeft: 12, minWidth: 88 }}>Time</th>
            {DAYS.map(d => <th key={d} className="tt-th">{d.slice(0, 3)}</th>)}
          </tr>
        </thead>
        <tbody>
          {teacherSlots.map((slot, rowIdx) => {
            if (slot.type === 'pre') return (
              <tr key={rowIdx} className="tt-break-row">
                <td className="tt-td" style={{ paddingLeft: 12 }}><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)' }}>Assembly</span></td>
                {DAYS.map((_, di) => <td key={di} className="tt-td" />)}
              </tr>
            )
            if (slot.type === 'break') return (
              <tr key={rowIdx} className="tt-break-row">
                <td className="tt-td" style={{ paddingLeft: 12 }}><span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)' }}>{slot.label}</span></td>
                {DAYS.map((_, di) => <td key={di} className="tt-td" />)}
              </tr>
            )
            const si = lessonIdx2++
            return (
              <tr key={rowIdx}>
                <td className="tt-td" style={{ paddingLeft: 8 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{slot.time}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-faint)', textTransform: 'uppercase' }}>{slot.label}</div>
                </td>
                {DAYS.map((_, di) => {
                  let found: { cell: any; cls: any } | null = null
                  for (const cls of classes) {
                    const cell = generatedTimetable[cls.id]?.[di]?.[si]
                    if (cell?.teacherId === selectedId) { found = { cell, cls }; break }
                  }
                  if (!found) return (
                    <td key={di} className="tt-td"><div className="lesson-cell" style={{ background: 'var(--cell-empty)' }} /></td>
                  )
                  const { cell, cls } = found
                  const color = cell.color || getSubjectColor(cell.subjectName)
                  const delay = (di * 0.012 + si * 0.028).toFixed(3)
                  return (
                    <td key={di} className="tt-td">
                      <div className="lesson-cell animate-fade-in" style={{ background: color, animationDelay: `${delay}s` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'white', lineHeight: 1.2 }}>{cell.subjectName}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>{cls.grade.replace('Grade ', 'G')} {cls.stream}</div>
                      </div>
                    </td>
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
