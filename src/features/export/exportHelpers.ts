// ============================================================
// InstaRatiba — Segment 8
// exportHelpers.ts — pure utility functions shared by all
// export modes (PDF, CSV, JSON).
// §5.8 Plain Black & White Export  |  §4.2.10
// ============================================================

import type { TimetableSlot, SchoolClass, Teacher, School, Timetable } from '@/types'
import { getSubjectByCode } from '@/lib/cbc/subjects'
import { buildDayLayout, DEFAULT_TIMINGS, gradeToLevel } from '@/lib/cbc/timing'

// ── Days ──────────────────────────────────────────────────────
export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
export type ExportDay = (typeof DAYS)[number]

export const DAY_FULL: Record<ExportDay, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday',
}

// ── Cell label ────────────────────────────────────────────────

/** Returns the display text for a single timetable slot */
export function slotLabel(slot: TimetableSlot): { subject: string; teacherLine: string } {
  if (slot.is_assembly) return { subject: 'Assembly / Roll Call', teacherLine: '' }
  if (slot.is_break)    return { subject: 'Health Break', teacherLine: '' }
  if (slot.is_non_formal) return { subject: 'Non-Formal Programme', teacherLine: '' }
  if (slot.is_ppi)      return { subject: 'PPI / Religious', teacherLine: '' }
  if (!slot.subject_code) return { subject: 'Free / Prep', teacherLine: '' }

  const subject = getSubjectByCode(slot.subject_code)
  return {
    subject: subject?.name ?? slot.subject_code,
    teacherLine: '',   // caller resolves teacher name
  }
}

/** Resolve teacher name from teacher map */
export function resolveTeacherName(teacherId: string | undefined, teacherMap: Map<string, Teacher>): string {
  if (!teacherId) return ''
  return teacherMap.get(teacherId)?.name ?? ''
}

// ── Class grouping ─────────────────────────────────────────────

export function classLabel(cls: SchoolClass): string {
  return `Grade ${cls.grade}${cls.stream}`
}

/** Group slots by class then by day then by slot_index */
export function groupSlotsByClass(
  slots: TimetableSlot[],
  classes: SchoolClass[],
): Map<string, Map<ExportDay, TimetableSlot[]>> {
  const map = new Map<string, Map<ExportDay, TimetableSlot[]>>()

  for (const cls of classes) {
    const dayMap = new Map<ExportDay, TimetableSlot[]>()
    for (const day of DAYS) dayMap.set(day, [])
    map.set(cls.id, dayMap)
  }

  for (const slot of slots) {
    const dayMap = map.get(slot.class_id)
    if (!dayMap) continue
    const list = dayMap.get(slot.day as ExportDay)
    if (list) list.push(slot)
  }

  // Sort each list by slot_index
  for (const dayMap of map.values()) {
    for (const list of dayMap.values()) {
      list.sort((a, b) => a.slot_index - b.slot_index)
    }
  }

  return map
}

/** Group slots by teacher then by day then by slot_index */
export function groupSlotsByTeacher(
  slots: TimetableSlot[],
  teachers: Teacher[],
): Map<string, Map<ExportDay, TimetableSlot[]>> {
  const map = new Map<string, Map<ExportDay, TimetableSlot[]>>()

  for (const t of teachers) {
    const dayMap = new Map<ExportDay, TimetableSlot[]>()
    for (const day of DAYS) dayMap.set(day, [])
    map.set(t.id, dayMap)
  }

  for (const slot of slots) {
    if (!slot.teacher_id) continue
    const dayMap = map.get(slot.teacher_id)
    if (!dayMap) continue
    const list = dayMap.get(slot.day as ExportDay)
    if (list) list.push(slot)
  }

  for (const dayMap of map.values()) {
    for (const list of dayMap.values()) {
      list.sort((a, b) => a.slot_index - b.slot_index)
    }
  }

  return map
}

// ── Slot time labels from timing config ───────────────────────

/** Build a slot_index → "HH:MM – HH:MM" label map for a given grade */
export function buildTimeLabels(grade: number): Map<number, string> {
  const level = gradeToLevel(grade)
  const timing = DEFAULT_TIMINGS[level]
  const layout = buildDayLayout(timing)
  const m = new Map<number, string>()
  for (const s of layout) {
    m.set(s.slot_index, `${s.start_time} – ${s.end_time}`)
  }
  return m
}

// ── Export filename helpers ───────────────────────────────────

export function exportFilename(
  school: School,
  timetable: Timetable,
  suffix: string,
  ext: string,
): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)
  const year  = new Date().getFullYear()
  return `${safe(school.name)}_TT_T${school.current_term}_${year}_${suffix}.${ext}`
}

// ── Subject legend (used on every PDF page footer) ─────────────

export function buildLegend(slots: TimetableSlot[]): Array<{ code: string; name: string }> {
  const codes = new Set<string>()
  for (const slot of slots) {
    if (slot.subject_code) codes.add(slot.subject_code)
  }
  const result: Array<{ code: string; name: string }> = []
  for (const code of codes) {
    const subject = getSubjectByCode(code)
    if (subject) {
      result.push({
        code: code.toUpperCase().slice(0, 3),
        name: subject.name,
      })
    }
  }
  return result.sort((a, b) => a.code.localeCompare(b.code))
}
