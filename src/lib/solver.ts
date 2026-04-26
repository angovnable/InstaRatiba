import type { SchoolClass, Teacher, GenerateResult, LessonCell, ClassGrid } from '@/types'
import { DAYS, LESSON_SLOTS, JSS_SLOTS, UPPER_PRIMARY_SLOTS, buildSlots, shuffle } from './constants'
import type { TimeSlot } from './constants'
import type { School } from '@/types'

// Returns the correct lesson slots for a given class level, using school's custom timing if provided
function getSlotsForClass(cls: SchoolClass, school?: School): TimeSlot[] {
  if (cls.level === 'jss') {
    if (school) {
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
    // upper_primary or lower_primary
    if (school) {
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

export function solveAllClasses(
  classes: SchoolClass[],
  teachers: Teacher[],
  school?: School
): GenerateResult {
  const timetable: GenerateResult['timetable'] = {}
  const conflicts: GenerateResult['conflicts'] = []
  const warnings: GenerateResult['warnings'] = []
  const compliance: GenerateResult['compliance'] = {}
  const teacherOccupancy: Record<string, boolean> = {}

  // FIX #7: Shuffle class order so no single class always gets the best slots
  const shuffledClasses = shuffle([...classes])

  for (const cls of shuffledClasses) {
    const slots = getSlotsForClass(cls, school)
    const lessonSlots = slots.filter(s => s.type === 'lesson')
    const result = solveClass(cls, teachers, teacherOccupancy, lessonSlots)
    timetable[cls.id] = result.grid
    conflicts.push(...result.conflicts.map(msg => ({ class: `${cls.grade} ${cls.stream}`, msg })))
    warnings.push(...result.warnings.map(msg => ({ class: `${cls.grade} ${cls.stream}`, msg })))
    compliance[cls.id] = result.compliance

    for (const [dayIdx, slots] of Object.entries(result.grid)) {
      for (const [slotIdx, lesson] of Object.entries(slots)) {
        if (lesson?.teacherId) {
          teacherOccupancy[`${lesson.teacherId}_${dayIdx}_${slotIdx}`] = true
        }
      }
    }
  }

  return { timetable, conflicts, warnings, compliance }
}

function solveClass(
  cls: SchoolClass,
  teachers: Teacher[],
  globalTeacherOccupancy: Record<string, boolean>,
  lessonSlots: ReturnType<typeof getSlotsForClass>
) {
  const grid: ClassGrid = {}
  DAYS.forEach((_, di) => {
    grid[di] = {}
    lessonSlots.forEach((_, si) => { grid[di][si] = null })
  })

  const conflicts: string[] = []
  const warnings: string[] = []
  // FIX #8: compliance is now populated below
  const compliance: Record<string, { name: string; placed: number; required: number }> = {}

  if (cls.subjects.length === 0) {
    return { grid, conflicts: ['No subjects configured'], warnings, compliance }
  }

  // Initialize compliance tracking for every subject
  for (const sub of cls.subjects) {
    if (sub.periods > 0) {
      compliance[sub.id] = { name: sub.name, placed: 0, required: sub.periods }
    }
  }

  interface QueueItem {
    sub: typeof cls.subjects[0]
    type: 'double' | 'single'
    priority: number
    morning?: boolean
    daily?: boolean
    beforeLunch?: boolean
  }

  const queue: QueueItem[] = []

  for (const sub of cls.subjects) {
    if (!sub.periods) continue
    const doublesCount = Math.min(sub.doubleCount ?? 0, Math.floor(sub.periods / 2))
    const singleCount = sub.periods - doublesCount * 2

    for (let i = 0; i < doublesCount; i++) {
      queue.push({ sub, type: 'double', priority: sub.doubleMandatory ? 0 : 1 })
    }
    for (let i = 0; i < singleCount; i++) {
      queue.push({ sub, type: 'single', priority: sub.isCore ? 2 : 3, morning: sub.morning, daily: sub.daily, beforeLunch: sub.beforeLunch })
    }

    if (sub.locked === 'friday_last') {
      grid[4][lessonSlots.length - 1] = {
        subjectId: sub.id, subjectName: sub.name,
        teacherId: sub.teacherId, color: sub.color, locked: true
      }
      // FIX #8: count this locked placement toward compliance
      if (compliance[sub.id]) compliance[sub.id].placed++
      const idx = queue.findIndex(q => q.sub.id === sub.id && q.type === 'single')
      if (idx >= 0) queue.splice(idx, 1)
    }
  }

  queue.sort((a, b) => a.priority - b.priority)

  const dailyCount: Record<number, Record<string, number>> = {}
  DAYS.forEach((_, di) => { dailyCount[di] = {} })

  const placed: Record<string, number> = {}
  cls.subjects.forEach(s => { placed[s.id] = 0 })

  DAYS.forEach((_, di) => {
    lessonSlots.forEach((_, si) => {
      const cell = grid[di][si]
      if (cell?.subjectId) {
        placed[cell.subjectId]++
        dailyCount[di][cell.subjectId] = (dailyCount[di][cell.subjectId] ?? 0) + 1
      }
    })
  })

  function isTeacherFree(teacherId: string | undefined, dayIdx: number, slotIdx: number): boolean {
    if (!teacherId) return true
    const t = teachers.find(t => t.id === teacherId)
    if (!t) return true
    if (t.isBOM && t.bomDays?.length > 0 && !t.bomDays.includes(DAYS[dayIdx])) return false
    if (t.unavailSlots?.length > 0) {
      const slot = lessonSlots[slotIdx]
      for (const u of t.unavailSlots) {
        if (u.day === DAYS[dayIdx] && slot?.time?.startsWith(u.start)) return false
      }
    }
    if (globalTeacherOccupancy[`${teacherId}_${dayIdx}_${slotIdx}`]) return false
    if (grid[dayIdx][slotIdx] !== null) return false
    return true
  }

  function placeLesson(dayIdx: number, slotIdx: number, sub: typeof cls.subjects[0], isDouble = false): boolean {
    if (grid[dayIdx][slotIdx] !== null) return false
    if (!isTeacherFree(sub.teacherId, dayIdx, slotIdx)) return false
    if ((dailyCount[dayIdx][sub.id] ?? 0) >= 1 && !sub.doubleMandatory) return false

    const lesson: LessonCell = {
      subjectId: sub.id,
      subjectName: sub.name,
      teacherId: sub.teacherId,
      color: sub.color,
      isDouble
    }

    grid[dayIdx][slotIdx] = lesson
    placed[sub.id]++
    dailyCount[dayIdx][sub.id] = (dailyCount[dayIdx][sub.id] ?? 0) + 1

    // FIX #8: update compliance count on each successful placement
    if (compliance[sub.id]) compliance[sub.id].placed++

    return true
  }

  for (const item of queue) {
    const sub = item.sub
    const days = shuffle([...Array(5).keys()])
    let success = false

    if (item.type === 'double') {
      const preferredDays = [1, 2, 3, 0, 4]
      for (const di of preferredDays) {
        for (let si = 0; si < lessonSlots.length - 1; si++) {
          if (grid[di][si] === null && grid[di][si + 1] === null &&
              isTeacherFree(sub.teacherId, di, si) &&
              isTeacherFree(sub.teacherId, di, si + 1) &&
              (dailyCount[di][sub.id] ?? 0) < 2) {

            placeLesson(di, si, sub, true)
            placeLesson(di, si + 1, sub, true)
            success = true
            break
          }
        }
        if (success) break
      }
      if (!success) conflicts.push(`Could not place double lesson for ${sub.name}`)

    } else {
      if (item.beforeLunch) {
        for (const di of days) {
          if (grid[di][4] === null && isTeacherFree(sub.teacherId, di, 4) && !dailyCount[di][sub.id]) {
            placeLesson(di, 4, sub); success = true; break
          }
        }
      }

      if (!success && item.morning) {
        const morningSlots = [0, 1, 2]

        for (const si of morningSlots) {
          for (const di of days) {
            if (grid[di][si] === null &&
                isTeacherFree(sub.teacherId, di, si) &&
                !dailyCount[di][sub.id]) {

              placeLesson(di, si, sub)
              success = true
              break
            }
          }
          if (success) break
        }

        if (!success) {
          for (const di of days) {
            if (grid[di][3] === null &&
                isTeacherFree(sub.teacherId, di, 3) &&
                !dailyCount[di][sub.id]) {

              placeLesson(di, 3, sub)
              success = true
              break
            }
          }
        }
      }

      if (!success) {
        for (const di of shuffle([...Array(5).keys()])) {
          for (const si of shuffle([...Array(lessonSlots.length).keys()])) {
            if (grid[di][si] === null && isTeacherFree(sub.teacherId, di, si) && !dailyCount[di][sub.id]) {
              placeLesson(di, si, sub); success = true; break
            }
          }
          if (success) break
        }
      }

      if (!success) {
        for (const di of shuffle([...Array(5).keys()])) {
          for (const si of shuffle([...Array(lessonSlots.length).keys()])) {
            if (grid[di][si] === null && isTeacherFree(sub.teacherId, di, si)) {
              placeLesson(di, si, sub); success = true; break
            }
          }
          if (success) break
        }
      }

      if (!success) conflicts.push(`Could not place ${sub.name} (lesson ${(placed[sub.id] ?? 0) + 1})`)
    }
  }

  return { grid, conflicts, warnings, compliance }
}
