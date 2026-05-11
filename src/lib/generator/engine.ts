// ============================================================
// InstaRatiba — Segment 6
// Timetable Generation Algorithm
// §7.1 CSP approach + heuristic backtracking
// §7.2 Constraint Priority Order
// §7.3 Subject Similarity Groups
// ============================================================

import type {
  SchoolClass,
  Teacher,
  Room,
  SubjectAllocation,
  TimetableSlot,
  LevelTiming,
  SchoolLevel,
  Day,
} from '@/types'
import {
  getSubjectByCode,
  areSimilarSubjects,
  DOUBLE_LESSON_CODES,
  ALWAYS_MORNING_CODES,
  PREFERRED_MORNING_CODES,
} from '../cbc/subjects'
import {
  buildDayLayout,
  getLessonSlots,
  getSlotsBeforeBreak,
  getLastLessonSlotIndex,
  gradeToLevel,
  DEFAULT_TIMINGS,
} from '../cbc/timing'

// ── Constants ────────────────────────────────────────────────

const DAYS: Day[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

export interface GeneratorInput {
  timetableId: string
  schoolId: string
  classes: SchoolClass[]
  teachers: Teacher[]
  rooms: Room[]
  allocations: SubjectAllocation[]
  timings: Partial<Record<SchoolLevel, LevelTiming>>
  onProgress?: (pct: number) => void
}

export interface GeneratorResult {
  slots: TimetableSlot[]
  unscheduled: Array<{ classId: string; subjectCode: string; remaining: number }>
  success: boolean
}

// ── Internal slot matrix ─────────────────────────────────────

/** Key: `day::slot_index::class_id` → subject code */
type ClassSlotMap = Map<string, string | null>

/** Key: `day::slot_index::teacher_id` → class_id (teacher occupancy) */
type TeacherSlotMap = Map<string, string>

/** Key: `day::slot_index::room_id` → class_id (room occupancy) */
type RoomSlotMap = Map<string, string>

function classKey(day: Day, slot: number, classId: string) {
  return `${day}::${slot}::${classId}`
}
function teacherKey(day: Day, slot: number, teacherId: string) {
  return `${day}::${slot}::${teacherId}`
}
function roomKey(day: Day, slot: number, roomId: string) {
  return `${day}::${slot}::${roomId}`
}

// ── Slot placement model ──────────────────────────────────────

interface PlacementAttempt {
  classId: string
  subjectCode: string
  teacherId: string
  roomId: string | null
  day: Day
  slotIndex: number
  isDouble: boolean     // true if this is the first of a double-lesson pair
}

// ── Score slot for heuristic ordering ────────────────────────

/**
 * Lower score = more preferred placement.
 * Used to sort candidate slots before trying them.
 */
function scoreSlot(
  subjectCode: string,
  slotIndex: number,   // 0-based within the lesson slots array (not day slot_index)
  lessonSlotsPerDay: number,
  classSlots: ClassSlotMap,
  teacherSlots: TeacherSlotMap,
  day: Day,
  dayLessonSlots: number[],  // actual slot_index values for this day's lessons
  teacherId: string,
): number {
  let score = 0

  // Morning priority (P9)
  const morningCutoff = Math.floor(lessonSlotsPerDay / 2)
  if (ALWAYS_MORNING_CODES.has(subjectCode) && slotIndex >= morningCutoff) score += 100
  if (PREFERRED_MORNING_CODES.has(subjectCode) && slotIndex >= morningCutoff + 1) score += 30

  // Teacher gap minimization (P13) — prefer slots near existing teacher lessons
  const teacherSlotsToday = dayLessonSlots.filter(
    si => teacherSlots.has(teacherKey(day, si, teacherId))
  )
  if (teacherSlotsToday.length > 0) {
    const nearest = teacherSlotsToday.reduce(
      (best, si) => Math.min(best, Math.abs(si - slotIndex)), Infinity
    )
    score -= (10 - Math.min(nearest, 10)) // closer = lower score
  }

  return score
}

// ── Main generator ────────────────────────────────────────────

export async function generateTimetable(input: GeneratorInput): Promise<GeneratorResult> {
  const { timetableId, schoolId, classes, teachers, rooms, allocations, timings, onProgress } = input

  const classSlots:   ClassSlotMap   = new Map()
  const teacherSlots: TeacherSlotMap = new Map()
  const roomSlots:    RoomSlotMap    = new Map()
  const resultSlots:  TimetableSlot[] = []
  const unscheduled:  GeneratorResult['unscheduled'] = []

  let slotIdSeq = 0
  function nextSlotId() { return `slot_${++slotIdSeq}` }

  // Build level layouts (cached)
  const levelLayouts = new Map<SchoolLevel, ReturnType<typeof buildDayLayout>>()
  for (const level of ['lower_primary', 'upper_primary', 'junior_secondary'] as SchoolLevel[]) {
    const timing = timings[level] ?? DEFAULT_TIMINGS[level]
    levelLayouts.set(level, buildDayLayout(timing))
  }

  // Teacher map for quick lookup
  const teacherMap = new Map(teachers.map(t => [t.id, t]))

  // Room map: subject_code → rooms that serve it
  const subjectRoomMap = new Map<string, Room[]>()
  for (const room of rooms) {
    for (const code of room.subject_codes) {
      const arr = subjectRoomMap.get(code) ?? []
      arr.push(room)
      subjectRoomMap.set(code, arr)
    }
  }

  // ── Step 1: Insert fixed slots for every class ────────────
  let classIdx = 0
  for (const cls of classes) {
    const level = gradeToLevel(cls.grade)
    const layout = levelLayouts.get(level)!

    for (const day of DAYS) {
      for (const slot of layout) {
        const isLesson     = slot.kind === 'lesson'
        const isBreak      = ['break1', 'break2'].includes(slot.kind)
        const isAssembly   = slot.kind === 'assembly'
        const isNonFormal  = slot.kind === 'non_formal'
        const isLunch      = slot.kind === 'lunch'

        if (!isLesson) {
          // Fixed structural slot — push as non-lesson entry
          resultSlots.push({
            id:            nextSlotId(),
            timetable_id:  timetableId,
            class_id:      cls.id,
            day,
            slot_index:    slot.slot_index,
            is_break:      isBreak || isLunch,
            is_assembly:   isAssembly,
            is_non_formal: isNonFormal,
            is_ppi:        false,
          })
          // Mark class slot as occupied (null = structural)
          classSlots.set(classKey(day, slot.slot_index, cls.id), null)
        }
      }
    }

    classIdx++
    onProgress?.(Math.round((classIdx / classes.length) * 10))
  }

  // ── Step 2: Build subject task list for each class ────────
  interface SubjectTask {
    classId: string
    grade: number
    subjectCode: string
    teacherId: string
    lessonCount: number
    requiresDouble: boolean
    isPpi: boolean
    level: SchoolLevel
  }

  const tasks: SubjectTask[] = []
  for (const alloc of allocations) {
    const cls = classes.find(c => c.id === alloc.class_id)
    if (!cls) continue

    const subject = getSubjectByCode(alloc.subject_code)

    // PPI can proceed without a teacher (self-managed); all other subjects require one
    if (!alloc.teacher_id && !subject?.is_ppi) {
      // Non-PPI without teacher: validator caught this; record as unscheduled so it surfaces
      unscheduled.push({ classId: alloc.class_id, subjectCode: alloc.subject_code, remaining: alloc.lessons_per_week })
      continue
    }
    tasks.push({
      classId:        alloc.class_id,
      grade:          cls.grade,
      subjectCode:    alloc.subject_code,
      teacherId:      alloc.teacher_id ?? '',
      lessonCount:    alloc.lessons_per_week,
      requiresDouble: alloc.requires_double,
      isPpi:          subject?.is_ppi === true,
      level:          gradeToLevel(cls.grade),
    })
  }

  // ── Step 3: Sort tasks by constraint weight (most constrained first) ──
  // P6 Creative Arts (double before break) → P7 PPI (last slot) → most lessons first
  tasks.sort((a, b) => {
    const aIsCreative = DOUBLE_LESSON_CODES.has(a.subjectCode) ? 0 : 1
    const bIsCreative = DOUBLE_LESSON_CODES.has(b.subjectCode) ? 0 : 1
    if (aIsCreative !== bIsCreative) return aIsCreative - bIsCreative
    if (a.isPpi !== b.isPpi) return a.isPpi ? -1 : 1
    return b.lessonCount - a.lessonCount
  })

  // ── Step 4: Place subjects ────────────────────────────────
  let taskIdx = 0
  for (const task of tasks) {
    const layout = levelLayouts.get(task.level)!
    const lessonSlots = getLessonSlots(layout)
    const beforeBreakSet = new Set(getSlotsBeforeBreak(layout))
    const lastLessonIdx = getLastLessonSlotIndex(layout)

    let remaining = task.lessonCount
    let doubleNeeded = task.requiresDouble ? 1 : 0  // one double required
    let doubleUsed = 0

    // Build candidate placements in priority order
    // Try to place double first (before-break preferred)
    const placed: Array<{ day: Day; slotIndex: number; isDouble: boolean }> = []

    // ── 4a: Place double lesson (if required) ────────────────
    if (doubleNeeded > 0) {
      let doublePlaced = false

      dayLoop:
      for (const day of DAYS) {
        const dayLessonIdxs = lessonSlots.map(s => s.slot_index)

        // Prefer slots immediately before a break
        const candidates = dayLessonIdxs.filter(si => beforeBreakSet.has(si))
        const allCandidates = [...candidates, ...dayLessonIdxs.filter(si => !beforeBreakSet.has(si))]

        for (const si of allCandidates) {
          const nextSi = lessonSlots[lessonSlots.findIndex(s => s.slot_index === si) + 1]?.slot_index
          if (nextSi === undefined) continue

          // Both slots must be free for this class
          if (classSlots.has(classKey(day, si, task.classId))) continue
          if (classSlots.has(classKey(day, nextSi, task.classId))) continue

          // Teacher must be free at both slots
          if (teacherSlots.has(teacherKey(day, si, task.teacherId))) continue
          if (teacherSlots.has(teacherKey(day, nextSi, task.teacherId))) continue

          // Check teacher consecutive limit (P12 soft)
          // We allow it but note it (soft constraint handled post-gen)

          // Check similarity: slot before si must not be same similarity group
          const prevSubject = classSlots.get(classKey(day, lessonSlots[lessonSlots.findIndex(s => s.slot_index === si) - 1]?.slot_index ?? -1, task.classId))
          if (prevSubject && areSimilarSubjects(prevSubject, task.subjectCode)) continue

          // Check room — must be free for BOTH slots of the double lesson
          const roomId = findAvailableRoom(task.subjectCode, task.teacherId, day, si, subjectRoomMap, roomSlots, task.classId)
          if (roomId && roomSlots.has(roomKey(day, nextSi, roomId))) continue  // room taken at nextSi

          // Place double
          placeLesson(classSlots, teacherSlots, roomSlots, resultSlots, {
            classId: task.classId, subjectCode: task.subjectCode,
            teacherId: task.teacherId, roomId,
            day, slotIndex: si, isDouble: true,
          }, timetableId, nextSlotId)

          placeLesson(classSlots, teacherSlots, roomSlots, resultSlots, {
            classId: task.classId, subjectCode: task.subjectCode,
            teacherId: task.teacherId, roomId,
            day, slotIndex: nextSi, isDouble: false,
          }, timetableId, nextSlotId)

          placed.push({ day, slotIndex: si, isDouble: true })
          placed.push({ day, slotIndex: nextSi, isDouble: false })
          remaining -= 2
          doubleUsed++
          doublePlaced = true
          break dayLoop
        }
      }

      if (!doublePlaced) {
        // Double placement failed — fall through to single placement
        // Generator logs this as unscheduled
      }
    }

    // ── 4b: Place PPI in last slot on a chosen day ────────────
    if (task.isPpi) {
      let ppiPlaced = false
      for (const day of DAYS) {
        if (classSlots.has(classKey(day, lastLessonIdx, task.classId))) continue
        // Only check teacher availability if a teacher is assigned to PPI
        if (task.teacherId && teacherSlots.has(teacherKey(day, lastLessonIdx, task.teacherId))) continue

        placeLesson(classSlots, teacherSlots, roomSlots, resultSlots, {
          classId: task.classId, subjectCode: task.subjectCode,
          teacherId: task.teacherId, roomId: null,
          day, slotIndex: lastLessonIdx, isDouble: false,
        }, timetableId, nextSlotId, true)

        remaining--
        ppiPlaced = true
        break
      }
      if (!ppiPlaced) {
        unscheduled.push({ classId: task.classId, subjectCode: task.subjectCode, remaining })
      }
      taskIdx++
      continue
    }

    // ── 4c: Place remaining single lessons ────────────────────
    // Spread across days (1 per day max, then allow 2 per day)
    const usedDays = new Set<Day>()
    let pass = 0

    while (remaining > 0 && pass < 3) {
      pass++
      for (const day of DAYS) {
        if (remaining <= 0) break
        if (pass === 1 && usedDays.has(day)) continue

        const dayLessonIdxs = lessonSlots.map(s => s.slot_index)

        // Sort by preference score
        const scored = dayLessonIdxs.map((si, i) => ({
          si,
          score: scoreSlot(
            task.subjectCode, i, lessonSlots.length,
            classSlots, teacherSlots, day, dayLessonIdxs, task.teacherId,
          ),
        })).sort((a, b) => a.score - b.score)

        for (const { si } of scored) {
          // Skip already occupied
          if (classSlots.has(classKey(day, si, task.classId))) continue
          if (teacherSlots.has(teacherKey(day, si, task.teacherId))) continue

          // P4: No similar subject consecutive
          const lessonIdxInDay = lessonSlots.findIndex(s => s.slot_index === si)
          const prevSlotIdx = lessonSlots[lessonIdxInDay - 1]?.slot_index
          const nextSlotIdx = lessonSlots[lessonIdxInDay + 1]?.slot_index
          const prevSubj = prevSlotIdx != null ? classSlots.get(classKey(day, prevSlotIdx, task.classId)) ?? null : null
          const nextSubj = nextSlotIdx != null ? classSlots.get(classKey(day, nextSlotIdx, task.classId)) ?? null : null

          if (prevSubj && areSimilarSubjects(prevSubj, task.subjectCode)) continue
          if (nextSubj && areSimilarSubjects(nextSubj, task.subjectCode)) continue

          // P5: No unintended double (same subject already in prev/next slot)
          if (prevSubj === task.subjectCode) continue
          if (nextSubj === task.subjectCode) continue

          // P8: teacher max lessons day
          const teacher = teacherMap.get(task.teacherId)
          if (teacher) {
            const teacherLessonsToday = dayLessonIdxs.filter(
              s => teacherSlots.has(teacherKey(day, s, task.teacherId))
            ).length
            if (teacherLessonsToday >= teacher.max_lessons_day) continue
          }

          const roomId = findAvailableRoom(task.subjectCode, task.teacherId, day, si, subjectRoomMap, roomSlots, task.classId)

          placeLesson(classSlots, teacherSlots, roomSlots, resultSlots, {
            classId: task.classId, subjectCode: task.subjectCode,
            teacherId: task.teacherId, roomId,
            day, slotIndex: si, isDouble: false,
          }, timetableId, nextSlotId)

          usedDays.add(day)
          remaining--
          break
        }
      }
    }

    if (remaining > 0) {
      unscheduled.push({ classId: task.classId, subjectCode: task.subjectCode, remaining })
    }

    taskIdx++
    onProgress?.(10 + Math.round((taskIdx / tasks.length) * 85))
  }

  onProgress?.(100)

  return {
    slots: resultSlots,
    unscheduled,
    success: unscheduled.length === 0,
  }
}

// ── Helpers ───────────────────────────────────────────────────

function findAvailableRoom(
  subjectCode: string,
  _teacherId: string,
  day: Day,
  slotIndex: number,
  subjectRoomMap: Map<string, Room[]>,
  roomSlots: RoomSlotMap,
  _classId: string,
): string | null {
  const rooms = subjectRoomMap.get(subjectCode)
  if (!rooms || !rooms.length) return null

  for (const room of rooms) {
    if (!roomSlots.has(roomKey(day, slotIndex, room.id))) {
      return room.id
    }
  }
  return null  // all rooms busy — conflict will be detected post-gen
}

function placeLesson(
  classSlots: ClassSlotMap,
  teacherSlots: TeacherSlotMap,
  roomSlots: RoomSlotMap,
  resultSlots: TimetableSlot[],
  p: PlacementAttempt,
  timetableId: string,
  nextSlotId: () => string,
  isPpi = false,
): void {
  classSlots.set(classKey(p.day, p.slotIndex, p.classId), p.subjectCode)
  teacherSlots.set(teacherKey(p.day, p.slotIndex, p.teacherId), p.classId)
  if (p.roomId) {
    roomSlots.set(roomKey(p.day, p.slotIndex, p.roomId), p.classId)
  }

  resultSlots.push({
    id:            nextSlotId(),
    timetable_id:  timetableId,
    class_id:      p.classId,
    teacher_id:    p.teacherId,
    subject_code:  p.subjectCode,
    room_id:       p.roomId ?? undefined,
    day:           p.day,
    slot_index:    p.slotIndex,
    is_break:      false,
    is_assembly:   false,
    is_non_formal: false,
    is_ppi:        isPpi,
  })
}

// ── Post-generation conflict scanner ─────────────────────────
export { scanGeneratedSlots } from './postConflicts'
