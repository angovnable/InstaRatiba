// ============================================================
// InstaRatiba — Segment 6
// Post-Generation Conflict Scanner
// Runs after generation to find violations in the produced matrix
// §5.4 Conflict Detection Engine — real-time slot-level checks
// ============================================================

import type { TimetableSlot, Conflict, ConflictType, ConflictSeverity, Teacher, SchoolClass, Room } from '@/types'
import { areSimilarSubjects, DOUBLE_LESSON_CODES, ALWAYS_MORNING_CODES } from '../cbc/subjects'

export function makeConflict(
  timetableId: string,
  type: ConflictType,
  severity: ConflictSeverity,
  description: string,
): Conflict {
  return { id: crypto.randomUUID(), timetable_id: timetableId, type, severity, description, resolved: false }
}

export interface PostScanInput {
  timetableId: string
  slots: TimetableSlot[]
  teachers: Teacher[]
  classes: SchoolClass[]
  rooms: Room[]
  /** All lesson slot_indexes per level per day that are before a break */
  beforeBreakSlotIndexes: Set<number>
  /** The last lesson slot_index of the day (for PPI check) */
  lastLessonSlotIndex: number
}

export function scanGeneratedSlots(input: PostScanInput): Conflict[] {  
  const { timetableId, slots, teachers, classes, rooms, beforeBreakSlotIndexes, lastLessonSlotIndex } = input
  const conflicts: Conflict[] = []

  const teacherMap  = new Map(teachers.map(t => [t.id, t]))
  const classMap    = new Map(classes.map(c => [c.id, c]))

  // Index lesson slots (non-break, non-assembly, non-non_formal)
  const lessonSlots = slots.filter(s => !s.is_break && !s.is_assembly && !s.is_non_formal && s.subject_code)

  // ── P1: Teacher double-booked (same teacher, same day, same slot) ──
  const teacherOccupancy = new Map<string, string>() // `day::slot::teacherId` → classId
  for (const slot of lessonSlots) {
    if (!slot.teacher_id) continue
    const key = `${slot.day}::${slot.slot_index}::${slot.teacher_id}`
    if (teacherOccupancy.has(key)) {
      const teacher = teacherMap.get(slot.teacher_id)
      const cls1    = classMap.get(teacherOccupancy.get(key)!)
      const cls2    = classMap.get(slot.class_id)
      conflicts.push(makeConflict(
        timetableId, 'teacher_double_booked', 'hard',
        `${teacher?.name ?? 'Teacher'} is double-booked on ${slot.day} slot ${slot.slot_index}: ` +
        `Grade ${cls1?.grade}${cls1?.stream} and Grade ${cls2?.grade}${cls2?.stream}.`,
      ))
    } else {
      teacherOccupancy.set(key, slot.class_id)
    }
  }

  // ── P2: Room double-booked ──────────────────────────────────
  const roomOccupancy = new Map<string, string>()
  for (const slot of lessonSlots) {
    if (!slot.room_id) continue
    const key = `${slot.day}::${slot.slot_index}::${slot.room_id}`
    if (roomOccupancy.has(key)) {
      const room = rooms.find(r => r.id === slot.room_id)
      const cls1 = classMap.get(roomOccupancy.get(key)!)
      const cls2 = classMap.get(slot.class_id)
      conflicts.push(makeConflict(
        timetableId, 'room_double_booked', 'hard',
        `"${room?.name ?? 'Room'}" is double-booked on ${slot.day} slot ${slot.slot_index}: ` +
        `Grade ${cls1?.grade}${cls1?.stream} and Grade ${cls2?.grade}${cls2?.stream}.`,
      ))
    } else {
      roomOccupancy.set(key, slot.class_id)
    }
  }

  // ── P4: Similar subjects consecutive ───────────────────────
  // Group by class + day, sort by slot_index, check adjacency
  const byClassDay = new Map<string, TimetableSlot[]>()
  for (const slot of lessonSlots) {
    const key = `${slot.class_id}::${slot.day}`
    const arr = byClassDay.get(key) ?? []
    arr.push(slot)
    byClassDay.set(key, arr)
  }

  for (const [key, daySlots] of byClassDay.entries()) {
    daySlots.sort((a, b) => a.slot_index - b.slot_index)
    const [classId, day] = key.split('::')
    const cls = classMap.get(classId)

    for (let i = 0; i < daySlots.length - 1; i++) {
      const curr = daySlots[i]
      const next = daySlots[i + 1]
      if (!curr.subject_code || !next.subject_code) continue

      // P5: Unintended double lesson
      if (curr.subject_code === next.subject_code && !curr.is_ppi) {
        const isIntentionalDouble = DOUBLE_LESSON_CODES.has(curr.subject_code)
        if (!isIntentionalDouble) {
          conflicts.push(makeConflict(
            timetableId, 'unintended_double_lesson', 'hard',
            `Grade ${cls?.grade}${cls?.stream} has "${curr.subject_code}" twice consecutively on ${day}.`,
          ))
        }
      }

      // P4: Similar subjects back-to-back
      if (
        curr.subject_code !== next.subject_code &&
        areSimilarSubjects(curr.subject_code, next.subject_code)
      ) {
        conflicts.push(makeConflict(
          timetableId, 'similar_subjects_consecutive', 'hard',
          `Grade ${cls?.grade}${cls?.stream}: "${curr.subject_code}" and "${next.subject_code}" ` +
          `are in the same learning group and placed consecutively on ${day}.`,
        ))
      }
    }

    // ── P6: Creative Arts double not before break ───────────
    for (const slot of daySlots) {
      if (!slot.subject_code) continue
      if (DOUBLE_LESSON_CODES.has(slot.subject_code)) {
        // Check if this slot AND the next form a double, and that the double ends before a break
        const idx = daySlots.findIndex(s => s.slot_index === slot.slot_index)
        const nextSlot = daySlots[idx + 1]
        if (nextSlot?.subject_code === slot.subject_code) {
          // This is a double — check if nextSlot.slot_index is immediately before a break
          if (!beforeBreakSlotIndexes.has(nextSlot.slot_index)) {
            conflicts.push(makeConflict(
              timetableId, 'creative_arts_not_before_break', 'hard',
              `Grade ${cls?.grade}${cls?.stream}: double lesson for "${slot.subject_code}" ` +
              `on ${day} is not placed immediately before a break.`,
            ))
          }
        }
      }
    }

    // PPI is now a fixed timing slot (not a generated lesson); no post-generation check needed.
  }

  // ── P8: Teacher max lessons/day exceeded ────────────────────
  const teacherDayCount = new Map<string, number>()
  for (const slot of lessonSlots) {
    if (!slot.teacher_id) continue
    const key = `${slot.teacher_id}::${slot.day}`
    teacherDayCount.set(key, (teacherDayCount.get(key) ?? 0) + 1)
  }
  for (const [key, count] of teacherDayCount.entries()) {
    const [teacherId, day] = key.split('::')
    const teacher = teacherMap.get(teacherId)
    if (teacher && count > teacher.max_lessons_day) {
      conflicts.push(makeConflict(
        timetableId, 'teacher_near_max_lessons', 'soft',
        `${teacher.name} teaches ${count} lessons on ${day} (max: ${teacher.max_lessons_day}).`,
      ))
    }
  }

  // ── P12: Teacher > max_consecutive lessons (soft) ──────────
  for (const teacher of teachers) {
    for (const day of ['monday','tuesday','wednesday','thursday','friday'] as const) {
      const teacherSlotsToday = lessonSlots
        .filter(s => s.teacher_id === teacher.id && s.day === day)
        .map(s => s.slot_index)
        .sort((a, b) => a - b)

      let consecutive = 1
      for (let i = 1; i < teacherSlotsToday.length; i++) {
        if (teacherSlotsToday[i] === teacherSlotsToday[i - 1] + 1) {
          consecutive++
          if (consecutive > teacher.max_consecutive) {
            conflicts.push(makeConflict(
              timetableId, 'teacher_consecutive_exceeded', 'soft',
              `${teacher.name} teaches ${consecutive} consecutive lessons on ${day} ` +
              `(limit: ${teacher.max_consecutive}).`,
            ))
            break
          }
        } else {
          consecutive = 1
        }
      }
    }
  }

  // ── P9: Core subjects in afternoon (soft) ──────────────────
  // Slot index 0–3 = morning (after assembly), 4+ = afternoon (rough heuristic)
  const MORNING_CUTOFF_SLOT = 4
  for (const slot of lessonSlots) {
    if (!slot.subject_code) continue
    if (ALWAYS_MORNING_CODES.has(slot.subject_code) && slot.slot_index >= MORNING_CUTOFF_SLOT) {
      const cls = classMap.get(slot.class_id)
      conflicts.push(makeConflict(
        timetableId, 'core_subject_afternoon', 'soft',
        `Grade ${cls?.grade}${cls?.stream}: "${slot.subject_code}" is placed in an afternoon slot ` +
        `on ${slot.day} (should be morning).`,
      ))
    }
  }

  return conflicts
}
