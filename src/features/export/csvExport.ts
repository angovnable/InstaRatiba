// ============================================================
// InstaRatiba — Segment 8
// csvExport.ts
// §5.8 "CSV Raw data export — SheetJS; one sheet per class"
// §4.2.10 "Export — CSV" button
// ============================================================

import * as XLSX from 'xlsx'
import type { TimetableSlot, SchoolClass, Teacher, School, Timetable } from '@/types'
import {
  DAYS, DAY_FULL, slotLabel, resolveTeacherName,
  classLabel,
  exportFilename, type ExportDay,
} from './exportHelpers'
import { getSubjectByCode } from '@/lib/cbc/subjects'

// ── Per-class sheets ──────────────────────────────────────────

function buildClassSheet(
  cls: SchoolClass,
  slots: TimetableSlot[],
  teacherMap: Map<string, Teacher>,
): XLSX.WorkSheet {
  const classByDay = new Map<ExportDay, TimetableSlot[]>()
  for (const day of DAYS) classByDay.set(day, [])
  for (const s of slots) {
    if (s.class_id !== cls.id) continue
    const list = classByDay.get(s.day as ExportDay)
    if (list) list.push(s)
  }
  for (const list of classByDay.values()) list.sort((a, b) => a.slot_index - b.slot_index)

  const maxSlots = Math.max(...[...classByDay.values()].map(v => v.length), 0)

  // Header row
  const header = ['Slot', ...DAYS.map(d => DAY_FULL[d])]
  const rows: string[][] = [header]

  for (let i = 0; i < maxSlots; i++) {
    const row = [`Slot ${i + 1}`]
    for (const day of DAYS) {
      const slot = classByDay.get(day)?.[i]
      if (!slot) { row.push(''); continue }
      const { subject } = slotLabel(slot)
      const teacher = resolveTeacherName(slot.teacher_id, teacherMap)
      row.push(teacher ? `${subject} [${teacher}]` : subject)
    }
    rows.push(row)
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)

  // Column widths
  ws['!cols'] = [{ wch: 10 }, ...DAYS.map(() => ({ wch: 28 }))]

  return ws
}

/** Export one sheet per class, all classes in one workbook */
export function exportCsvAllClasses(
  school:    School,
  timetable: Timetable,
  slots:     TimetableSlot[],
  classes:   SchoolClass[],
  teachers:  Teacher[],
): void {
  const teacherMap = new Map(teachers.map(t => [t.id, t]))
  const wb = XLSX.utils.book_new()

  for (const cls of classes) {
    const ws = buildClassSheet(cls, slots, teacherMap)
    const sheetName = `Gr${cls.grade}${cls.stream}`.slice(0, 31) // Excel 31-char limit
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }

  const filename = exportFilename(school, timetable, 'All_Classes', 'xlsx')
  XLSX.writeFile(wb, filename)
}

/** Export a single class to its own workbook */
export function exportCsvSingleClass(
  school:    School,
  timetable: Timetable,
  slots:     TimetableSlot[],
  classes:   SchoolClass[],
  teachers:  Teacher[],
  classId:   string,
): void {
  const cls = classes.find(c => c.id === classId)
  if (!cls) return
  const teacherMap = new Map(teachers.map(t => [t.id, t]))
  const wb = XLSX.utils.book_new()
  const ws = buildClassSheet(cls, slots, teacherMap)
  XLSX.utils.book_append_sheet(wb, ws, classLabel(cls).slice(0, 31))
  const filename = exportFilename(school, timetable, `Grade_${cls.grade}${cls.stream}`, 'xlsx')
  XLSX.writeFile(wb, filename)
}

/** Export teacher-view CSV: one sheet per teacher, columns = days, rows = slots */
export function exportCsvTeachers(
  school:    School,
  timetable: Timetable,
  slots:     TimetableSlot[],
  classes:   SchoolClass[],
  teachers:  Teacher[],
): void {
  const classMap = new Map(classes.map(c => [c.id, c]))
  const wb = XLSX.utils.book_new()

  for (const teacher of teachers) {
    const byDay = new Map<ExportDay, TimetableSlot[]>()
    for (const day of DAYS) byDay.set(day, [])

    for (const s of slots) {
      if (s.teacher_id !== teacher.id) continue
      const list = byDay.get(s.day as ExportDay)
      if (list) list.push(s)
    }
    for (const list of byDay.values()) list.sort((a, b) => a.slot_index - b.slot_index)

    const maxSlots = Math.max(...[...byDay.values()].map(v => v.length), 0)
    const header = ['Slot', ...DAYS.map(d => DAY_FULL[d])]
    const rows: string[][] = [header]

    for (let i = 0; i < maxSlots; i++) {
      const row = [`Slot ${i + 1}`]
      for (const day of DAYS) {
        const slot = byDay.get(day)?.[i]
        if (!slot) { row.push('Free / Prep'); continue }
        const { subject } = slotLabel(slot)
        const cls = slot.class_id ? classMap.get(slot.class_id) : undefined
        row.push(cls ? `${subject} — ${classLabel(cls)}` : subject)
      }
      rows.push(row)
    }

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 10 }, ...DAYS.map(() => ({ wch: 30 }))]
    const sheetName = teacher.name.slice(0, 31)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }

  const filename = exportFilename(school, timetable, 'Teachers', 'xlsx')
  XLSX.writeFile(wb, filename)
}

/** Export a flat raw slot data sheet (for data analysis / backup import) */
export function exportCsvRaw(
  school:    School,
  timetable: Timetable,
  slots:     TimetableSlot[],
  classes:   SchoolClass[],
  teachers:  Teacher[],
): void {
  const classMap   = new Map(classes.map(c => [c.id, c]))
  const teacherMap = new Map(teachers.map(t => [t.id, t]))

  const header = [
    'slot_id', 'class', 'grade', 'stream', 'day', 'slot_index',
    'subject_code', 'subject_name', 'teacher_name', 'tsc_no',
    'is_assembly', 'is_break', 'is_ppi', 'is_non_formal', 'room_id',
  ]

  const rows: (string | number | boolean)[][] = slots.map(s => {
    const cls     = classMap.get(s.class_id)
    const teacher = s.teacher_id ? teacherMap.get(s.teacher_id) : undefined
    const subject = s.subject_code ? getSubjectByCode(s.subject_code) : undefined
    return [
      s.id,
      cls ? classLabel(cls) : s.class_id,
      cls?.grade ?? '',
      cls?.stream ?? '',
      s.day,
      s.slot_index,
      s.subject_code ?? '',
      subject?.name ?? '',
      teacher?.name ?? '',
      teacher?.tsc_no ?? '',
      s.is_assembly,
      s.is_break,
      s.is_ppi,
      s.is_non_formal,
      s.room_id ?? '',
    ]
  })

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
  ws['!cols'] = header.map(() => ({ wch: 18 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Raw Slots')
  XLSX.writeFile(wb, exportFilename(school, timetable, 'Raw', 'xlsx'))
}
