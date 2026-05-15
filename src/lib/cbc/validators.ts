// ============================================================
// InstaRatiba — Segment 6
// CBC Constraint Validators
// §2.5 Morning Priority | §2.6 Double Lessons | §2.7 Hard Constraints
// §5.4 Conflict Detection Engine
// ============================================================

import type {
  SubjectAllocation,
  Teacher,
  TeacherSubject,
  SchoolClass,
  Room,
  LevelTiming,
  SchoolLevel,
  Conflict,
  ConflictType,
  ConflictSeverity,
} from '@/types'
import { getSubjectByCode, areSimilarSubjects, DOUBLE_LESSON_CODES, ALWAYS_MORNING_CODES } from './subjects'
import { gradeToLevel } from './timing'
import { buildDayLayout, countLessonSlots } from './timing'

// Use crypto.randomUUID for collision-free conflict IDs across concurrent runs
function nextId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function makeConflict(
  timetableId: string,
  type: ConflictType,
  severity: ConflictSeverity,
  description: string,
): Conflict {
  return { id: nextId(), timetable_id: timetableId, type, severity, description, resolved: false }
}

// ── Grade → Level mapping ─────────────────────────────────────

// ── Max weekly lessons by level (§2.2) ───────────────────────

export function maxWeeklyLessons(level: SchoolLevel): number {
  if (level === 'lower_primary') return 31
  if (level === 'upper_primary') return 40
  return 40
}

// ────────────────────────────────────────────────────────────
// 1. NO_TEACHER_ASSIGNED — every subject must have a teacher
// ────────────────────────────────────────────────────────────

export function validateTeacherAssignments(
  allocations: SubjectAllocation[],
  classes: SchoolClass[],
  timetableId: string,
): Conflict[] {
  const conflicts: Conflict[] = []
  const classMap = new Map(classes.map(c => [c.id, c]))

  for (const alloc of allocations) {
    const subject = getSubjectByCode(alloc.subject_code)
    if (!alloc.teacher_id) {
      const cls = classMap.get(alloc.class_id)
      const label = cls ? `Grade ${cls.grade}${cls.stream}` : alloc.class_id
      conflicts.push(makeConflict(
        timetableId,
        'no_teacher_assigned',
        'hard',
        `No teacher assigned to "${subject?.name ?? alloc.subject_code}" for ${label}.`,
      ))
    }
  }
  return conflicts
}

// ────────────────────────────────────────────────────────────
// 2. LESSON_COUNT_WRONG — lesson count matches MoE allocation
// ────────────────────────────────────────────────────────────

export function validateLessonCounts(
  allocations: SubjectAllocation[],
  classes: SchoolClass[],
  timetableId: string,
): Conflict[] {
  const conflicts: Conflict[] = []
  const classMap = new Map(classes.map(c => [c.id, c]))

  // ── Per-subject check ────────────────────────────────────────────────────────
  // M2 FIX: Deviation from MoE lesson count is a WARNING (soft), not a hard block.
  // Hard should be reserved for cases where lessons physically can't fit in the week
  // (caught by validateTimingSlots). A school legitimately adjusting Creative Arts
  // from 4 to 3 should not be prevented from generating entirely.
  for (const alloc of allocations) {
    const subject = getSubjectByCode(alloc.subject_code)
    if (!subject) continue

    const cls = classMap.get(alloc.class_id)
    const label = cls ? `Grade ${cls.grade}${cls.stream}` : alloc.class_id

    if (alloc.lessons_per_week !== subject.lessons_per_week) {
      const diff = alloc.lessons_per_week - subject.lessons_per_week
      const directionWord = diff > 0 ? 'over' : 'under'
      conflicts.push(makeConflict(
        timetableId,
        'lesson_count_wrong',
        'soft',   // was 'hard' — see M2 fix above
        `${subject.name} for ${label} has ${alloc.lessons_per_week} lessons/week ` +
        `(MoE: ${subject.lessons_per_week}) — ${Math.abs(diff)} lesson(s) ${directionWord}.`,
      ))
    }
  }

  // ── Class total checks by level (§2.2) ──────────────────────────────────────
  // L2 FIX: Added Lower Primary (≤31) and JSS (≤40) class total checks.
  // M4 FIX: maxWeeklyLessons() is now used here instead of being dead code.
  // UP total is now also driven through maxWeeklyLessons for consistency.
  const LEVEL_TOTAL_RANGES: Partial<Record<SchoolLevel, { min: number; max: number }>> = {
    lower_primary:    { min: 0,  max: maxWeeklyLessons('lower_primary') },     // ≤31
    upper_primary:    { min: 38, max: maxWeeklyLessons('upper_primary') },     // 38–40
    junior_secondary: { min: 0,  max: maxWeeklyLessons('junior_secondary') },  // ≤40
  }

  const classTotals = new Map<string, number>()
  for (const alloc of allocations) {
    classTotals.set(alloc.class_id, (classTotals.get(alloc.class_id) ?? 0) + alloc.lessons_per_week)
  }

  for (const [classId, total] of classTotals.entries()) {
    const cls = classMap.get(classId)
    if (!cls) continue
    const level = gradeToLevel(cls.grade)
    const range = LEVEL_TOTAL_RANGES[level]
    if (!range) continue
    const label = `Grade ${cls.grade}${cls.stream}`
    if (total > range.max) {
      conflicts.push(makeConflict(
        timetableId, 'lesson_count_wrong', 'soft',
        `${label} total lessons/week is ${total} — exceeds MoE ${level.replace(/_/g,' ')} maximum of ${range.max}.`,
      ))
    } else if (range.min > 0 && total < range.min) {
      conflicts.push(makeConflict(
        timetableId, 'lesson_count_wrong', 'soft',
        `${label} total lessons/week is ${total} — below MoE ${level.replace(/_/g,' ')} minimum of ${range.min}.`,
      ))
    }
  }

  return conflicts
}

// ────────────────────────────────────────────────────────────
// 3. TEACHER_DOUBLE_BOOKED — validate across all slots
//    (pre-generation: checks if total lessons across classes
//     would exceed teacher's max_lessons_day or max_lessons_week)
// ────────────────────────────────────────────────────────────

export function validateTeacherCapacity(
  allocations: SubjectAllocation[],
  teachers: Teacher[],
  classes: SchoolClass[],
  timetableId: string,
): Conflict[] {
  const conflicts: Conflict[] = []
  const teacherMap = new Map(teachers.map(t => [t.id, t]))
  const classMap   = new Map(classes.map(c => [c.id, c]))

  // Sum weekly lessons per teacher
  const weeklyLoad = new Map<string, number>()
  for (const alloc of allocations) {
    if (!alloc.teacher_id) continue
    weeklyLoad.set(
      alloc.teacher_id,
      (weeklyLoad.get(alloc.teacher_id) ?? 0) + alloc.lessons_per_week,
    )
  }

  for (const [teacherId, total] of weeklyLoad.entries()) {
    const teacher = teacherMap.get(teacherId)
    if (!teacher) continue

    const maxWeek = teacher.max_lessons_week ?? teacher.max_lessons_day * 5
    if (total > maxWeek) {
      conflicts.push(makeConflict(
        timetableId,
        'teacher_near_max_lessons',
        'soft',
        `${teacher.name} is assigned ${total} lessons/week but max is ${maxWeek}.`,
      ))
    }
  }

  // Check if any teacher is assigned to same subject in same class twice
  const seen = new Set<string>()
  for (const alloc of allocations) {
    if (!alloc.teacher_id) continue
    const key = `${alloc.teacher_id}::${alloc.class_id}::${alloc.subject_code}`
    if (seen.has(key)) {
      const teacher = teacherMap.get(alloc.teacher_id)
      const cls     = classMap.get(alloc.class_id)
      const subject = getSubjectByCode(alloc.subject_code)
      conflicts.push(makeConflict(
        timetableId,
        'teacher_double_booked',
        'hard',
        `${teacher?.name ?? 'Teacher'} is assigned "${subject?.name}" for ` +
        `${cls ? `Grade ${cls.grade}${cls.stream}` : alloc.class_id} more than once.`,
      ))
    }
    seen.add(key)
  }

  return conflicts
}

// ────────────────────────────────────────────────────────────
// 4. CUSTOM_SCHEDULE_SLOTS_SHORT — timing config check (§4.2.4)
// ────────────────────────────────────────────────────────────

export function validateTimingSlots(
  timings: Partial<Record<SchoolLevel, LevelTiming>>,
  allocations: SubjectAllocation[],
  classes: SchoolClass[],
  timetableId: string,
): Conflict[] {
  const conflicts: Conflict[] = []
  const DAYS = 5

  for (const level of ['lower_primary', 'upper_primary', 'junior_secondary'] as SchoolLevel[]) {
    const timing = timings[level]
    if (!timing) continue

    const layout = buildDayLayout(timing)
    const slotsPerDay = countLessonSlots(layout)
    const availableWeek = slotsPerDay * DAYS

    // Total required lessons for this level (sum across all classes at this level)
    const levelClasses = classes.filter(c => gradeToLevel(c.grade) === level)
    if (!levelClasses.length) continue

    // Per-class check
    for (const cls of levelClasses) {
      const classAllocs = allocations.filter(a => a.class_id === cls.id)
      const required = classAllocs.reduce((s, a) => s + a.lessons_per_week, 0)

      if (required > availableWeek) {
        conflicts.push(makeConflict(
          timetableId,
          'custom_schedule_slots_short',
          'hard',
          `Grade ${cls.grade}${cls.stream} requires ${required} lessons/week but ` +
          `current schedule only provides ${availableWeek} slots ` +
          `(${slotsPerDay} slots/day × 5 days).`,
        ))
      }
    }
  }

  return conflicts
}

// ────────────────────────────────────────────────────────────
// 5. ROOM_DOUBLE_BOOKED — check room capacity against demand
//    (full conflict detected during generation; pre-check here)
// ────────────────────────────────────────────────────────────

export function validateRoomDemand(
  rooms: Room[],
  allocations: SubjectAllocation[],
  classes: SchoolClass[],
  timetableId: string,
  timings?: Partial<Record<SchoolLevel, LevelTiming>>,
): Conflict[] {
  const conflicts: Conflict[] = []

  // Compute available lesson slots per week for a given level using actual timing (§2.3)
  const levelSlotsPerWeek = (level: SchoolLevel): number => {
    const timing = timings?.[level]
    if (timing) {
      const layout = buildDayLayout(timing)
      return countLessonSlots(layout) * 5 // 5 school days
    }
    return 25 // conservative fallback: 5 lesson slots/day × 5 days
  }

  for (const room of rooms) {
    for (const subjCode of room.subject_codes) {
      const subject = getSubjectByCode(subjCode)

      // Group demand by level — each level has its own slot ceiling
      const allocsForSubject = allocations.filter(a => a.subject_code === subjCode)
      const levelGroups = new Map<SchoolLevel, number>()
      for (const alloc of allocsForSubject) {
        const cls = classes.find(c => c.id === alloc.class_id)
        if (!cls) continue
        const level = gradeToLevel(cls.grade)
        levelGroups.set(level, (levelGroups.get(level) ?? 0) + alloc.lessons_per_week)
      }

      for (const [level, totalLessons] of levelGroups) {
        const weekCap = levelSlotsPerWeek(level)
        if (totalLessons > weekCap) {
          conflicts.push(makeConflict(
            timetableId,
            'room_double_booked',
            'hard',
            `"${room.name}" may be over-booked for ${level.replace('_', ' ')}: ` +
            `${totalLessons} lessons/week across all classes but only ${weekCap} slots/week available ` +
            `for "${subject?.name ?? subjCode}".`,
          ))
        }
      }
    }
  }

  return conflicts
}


// ────────────────────────────────────────────────────────────
// 6. Soft: MORNING_AFTERNOON_IMBALANCE
//    Warn if always-morning subjects total < 2 per day (rough check)
// ────────────────────────────────────────────────────────────

export function validateMorningBalance(
  allocations: SubjectAllocation[],
  classes: SchoolClass[],
  timetableId: string,
): Conflict[] {
  const conflicts: Conflict[] = []
  const classMap = new Map(classes.map(c => [c.id, c]))

  const byClass = new Map<string, SubjectAllocation[]>()
  for (const alloc of allocations) {
    const arr = byClass.get(alloc.class_id) ?? []
    arr.push(alloc)
    byClass.set(alloc.class_id, arr)
  }

  for (const [classId, allocs] of byClass.entries()) {
    const morningCount = allocs
      .filter(a => ALWAYS_MORNING_CODES.has(a.subject_code))
      .reduce((s, a) => s + a.lessons_per_week, 0)

    // 5 days, at least 1 morning lesson per day expected = 5
    if (morningCount < 5) {
      const cls = classMap.get(classId)
      const label = cls ? `Grade ${cls.grade}${cls.stream}` : classId
      conflicts.push(makeConflict(
        timetableId, 'morning_afternoon_imbalance', 'soft',
        `${label} has only ${morningCount} morning-priority lessons/week — ` +
        `consider reviewing core subject allocation.`,
      ))
    }
  }

  return conflicts
}

// ────────────────────────────────────────────────────────────
// 7. DOUBLE_LESSON_TOGGLE_MISSING — §2.6 double lessons must have requires_double set
// ────────────────────────────────────────────────────────────

// L1 FIX: Pre-generation check that every subject requiring a double lesson (per MoE §2.6)
// has requires_double: true in its allocation. Without this, an admin who unchecks the toggle
// produces a non-compliant schedule silently — the generator simply skips the double.
export function validateDoubleLesson(
  allocations: SubjectAllocation[],
  classes: SchoolClass[],
  timetableId: string,
): Conflict[] {
  const conflicts: Conflict[] = []
  const classMap = new Map(classes.map(c => [c.id, c]))

  for (const alloc of allocations) {
    if (!DOUBLE_LESSON_CODES.has(alloc.subject_code)) continue
    if (alloc.requires_double) continue  // correctly set

    const cls = classMap.get(alloc.class_id)
    const label = cls ? `Grade ${cls.grade}${cls.stream}` : alloc.class_id
    const subject = getSubjectByCode(alloc.subject_code)
    conflicts.push(makeConflict(
      timetableId,
      'lesson_count_wrong',
      'soft',
      `${subject?.name ?? alloc.subject_code} for ${label} requires a double lesson (MoE §2.6) ` +
      `but the double-lesson toggle is off. Enable it in allocations.`,
    ))
  }
  return conflicts
}


// ────────────────────────────────────────────────────────────

export function validateClassTeachers(
  classes: SchoolClass[],
  timetableId: string,
): Conflict[] {
  return classes
    .filter(c => !c.class_teacher_id)
    .map(c => makeConflict(
      timetableId, 'class_teacher_unassigned', 'soft',
      `Grade ${c.grade}${c.stream} has no class teacher assigned.`,
    ))
}

// ────────────────────────────────────────────────────────────
// MASTER VALIDATOR — runs all checks, returns full conflict list
// ────────────────────────────────────────────────────────────

export interface ValidationInput {
  timetableId: string
  allocations: SubjectAllocation[]
  teachers: Teacher[]
  teacherSubjects: TeacherSubject[]
  classes: SchoolClass[]
  rooms: Room[]
  timings: Partial<Record<SchoolLevel, LevelTiming>>
}

export interface ValidationResult {
  conflicts: Conflict[]
  hardCount: number
  softCount: number
  canGenerate: boolean
}

export function runFullValidation(input: ValidationInput): ValidationResult {

  const all: Conflict[] = [
    ...validateTeacherAssignments(input.allocations, input.classes, input.timetableId),
    ...validateLessonCounts(input.allocations, input.classes, input.timetableId),
    ...validateTeacherCapacity(input.allocations, input.teachers, input.classes, input.timetableId),
    ...validateTimingSlots(input.timings, input.allocations, input.classes, input.timetableId),
    ...validateRoomDemand(input.rooms, input.allocations, input.classes, input.timetableId, input.timings),
    ...validateMorningBalance(input.allocations, input.classes, input.timetableId),
    ...validateDoubleLesson(input.allocations, input.classes, input.timetableId),  // L1
    ...validateClassTeachers(input.classes, input.timetableId),
  ]

  const hardCount = all.filter(c => c.severity === 'hard').length
  const softCount = all.filter(c => c.severity === 'soft').length

  return {
    conflicts: all,
    hardCount,
    softCount,
    canGenerate: hardCount === 0,
  }
}
