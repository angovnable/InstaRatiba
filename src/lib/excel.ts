import type { SchoolClass, Teacher, Timetable, School } from '@/types'
import { DAYS, JSS_SLOTS } from './constants'

// Uses SheetJS (xlsx) via CDN/npm for .xlsx export

export async function exportExcel(
  school: School,
  classes: SchoolClass[],
  teachers: Teacher[],
  timetable: Timetable
) {
  // Dynamically import xlsx to keep bundle small
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  const lessonSlots = JSS_SLOTS.filter(s => s.type === 'lesson')

  // Sheet per class
  for (const cls of classes) {
    const grid = timetable[cls.id]
    if (!grid) continue

    const rows: string[][] = [
      [`${cls.grade} ${cls.stream} — ${school.name} — ${school.term}`],
      ['Period/Time', ...DAYS],
    ]
    let li = 0
    for (const slot of JSS_SLOTS) {
      if (slot.type === 'pre') { rows.push(['Assembly', ...DAYS.map(() => '')]); continue }
      if (slot.type === 'break') { rows.push([`${slot.label} (${slot.time})`, ...DAYS.map(() => '')]); continue }
      const si = li++
      const row = [`${slot.time} — ${slot.label}`]
      for (let di = 0; di < 5; di++) {
        const cell = grid[di]?.[si]
        if (!cell?.subjectName) { row.push(''); continue }
        const teacher = teachers.find(t => t.id === cell.teacherId)
        row.push(cell.subjectName + (teacher ? ` (${teacher.name.split(' ').slice(-1)[0]})` : ''))
      }
      rows.push(row)
    }

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 20 }, ...DAYS.map(() => ({ wch: 22 }))]
    XLSX.utils.book_append_sheet(wb, ws, `${cls.grade.replace('Grade ', 'G')} ${cls.stream}`)
  }

  // Master sheet
  const masterRows: string[][] = [
    [`Master Timetable — ${school.name} — ${school.term}`],
    ['Time', ...classes.map(c => `${c.grade.replace('Grade ', 'G')} ${c.stream}`)],
  ]
  let li2 = 0
  for (const slot of JSS_SLOTS) {
    if (slot.type === 'pre') { masterRows.push(['Assembly', ...classes.map(() => '')]); continue }
    if (slot.type === 'break') { masterRows.push([`${slot.label}`, ...classes.map(() => '')]); continue }
    const si = li2++
    for (let di = 0; di < 5; di++) {
      const row = [`${slot.time} ${DAYS[di].slice(0, 3)}`]
      for (const cls of classes) {
        const cell = timetable[cls.id]?.[di]?.[si]
        row.push(cell?.subjectName || '')
      }
      masterRows.push(row)
    }
  }
  const masterWs = XLSX.utils.aoa_to_sheet(masterRows)
  XLSX.utils.book_append_sheet(wb, masterWs, 'Master')

  // Teacher load sheet
  const tRows = [['Teacher', 'TSC No.', 'Max/Week', 'Assigned Periods', 'Load %', 'BOM']]
  for (const t of teachers) {
    let load = 0
    for (const cls of classes) for (const sub of cls.subjects) if (sub.teacherId === t.id) load += sub.periods
    tRows.push([t.name, t.tsc || '', String(t.maxWeek), String(load), `${Math.round((load / t.maxWeek) * 100)}%`, t.isBOM ? 'Yes' : 'No'])
  }
  const tWs = XLSX.utils.aoa_to_sheet(tRows)
  XLSX.utils.book_append_sheet(wb, tWs, 'Teacher Loads')

  XLSX.writeFile(wb, `InstaRatiba_${school.name.replace(/\s+/g, '_')}_${school.term.replace(/\s+/g, '_')}.xlsx`)
}
