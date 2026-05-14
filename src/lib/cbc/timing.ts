// ============================================================
// InstaRatiba — Segment 6
// CBC Timing Utilities
// Builds daily slot layouts from LevelTiming config (§2.3)
// ============================================================

import type { LevelTiming, SchoolLevel } from '@/types'

export type SlotKind =
  | 'lesson'
  | 'assembly'
  | 'break1'
  | 'break2'
  | 'lunch'
  | 'non_formal'
  | 'ppi'

export interface DaySlot {
  slot_index: number        // 0-based position in day
  kind: SlotKind
  lesson_number?: number    // 1-based academic lesson number (for break placement rules)
  start_time: string        // "HH:MM"
  end_time: string          // "HH:MM"
  duration_min: number
}

/** Parse "HH:MM" → total minutes from midnight */
function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Format total minutes from midnight → "HH:MM" */
function fromMin(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/**
 * Build the full ordered slot layout for a single day given a LevelTiming config.
 * Assembly is always slot 0. Academic lessons are interleaved with break slots.
 * Returns array of DaySlot with accurate clock times.
 */
export function buildDayLayout(timing: LevelTiming): DaySlot[] {
  const slots: DaySlot[] = []
  let cursor = toMin('08:00')   // school opens 08:00
  let slotIdx = 0
  let lessonNum = 0

  // Assembly / Roll Call (08:00 – 08:20 fixed)
  slots.push({
    slot_index: slotIdx++,
    kind: 'assembly',
    start_time: '08:00',
    end_time: '08:20',
    duration_min: 20,
  })
  cursor = toMin('08:20')

  // PPI / Religious Programme — school-wide fixed slot, once per week (Monday only).
  // Placed after assembly, before first academic lesson (08:20 – 08:30).
  // Not a subject allocation; not teacher-assigned; not counted in lesson totals.
  if (timing.ppi_day != null) {
    slots.push({
      slot_index: slotIdx++,
      kind: 'ppi',
      start_time: fromMin(cursor),
      end_time: fromMin(cursor + 10),
      duration_min: 10,
    })
    cursor += 10
  }
  // lessons begin after assembly (and PPI if applicable)

  // Determine total academic lessons for this level
  // We'll place lessons and inject breaks at the right points
  const dur = timing.lesson_duration_min

  // Max lessons: drive from lesson_start until non-formal or EOD
  // Typically 6–8 academic lessons depending on level (see §2.2)
  // We use a high ceiling and stop when we hit non-formal start or 17:00
  const maxLessons = 10 // upper bound; will stop naturally

  for (let ln = 1; ln <= maxLessons; ln++) {
    // Inject Break 1 after lesson break1_after_lesson
    if (ln === timing.break1_after_lesson + 1) {
      const end = cursor + timing.break1_duration_min
      slots.push({
        slot_index: slotIdx++,
        kind: 'break1',
        start_time: fromMin(cursor),
        end_time: fromMin(end),
        duration_min: timing.break1_duration_min,
      })
      cursor = end
    }

    // Inject Break 2 after lesson break2_after_lesson
    if (ln === timing.break2_after_lesson + 1) {
      const end = cursor + timing.break2_duration_min
      slots.push({
        slot_index: slotIdx++,
        kind: 'break2',
        start_time: fromMin(cursor),
        end_time: fromMin(end),
        duration_min: timing.break2_duration_min,
      })
      cursor = end
    }

    // Inject Lunch break after lunch_after_lesson (if enabled)
    if (
      timing.lunch_enabled &&
      timing.lunch_after_lesson != null &&
      timing.lunch_duration_min != null &&
      ln === timing.lunch_after_lesson + 1
    ) {
      const end = cursor + timing.lunch_duration_min
      slots.push({
        slot_index: slotIdx++,
        kind: 'lunch',
        start_time: fromMin(cursor),
        end_time: fromMin(end),
        duration_min: timing.lunch_duration_min,
      })
      cursor = end
    }

    // Stop placing lessons if we've hit non_formal start
    if (timing.non_formal_start) {
      const nfMin = toMin(timing.non_formal_start)
      if (cursor >= nfMin) break
    }

    // Stop if we'd push past 17:30 (safety ceiling)
    if (cursor + dur > toMin('17:30')) break

    lessonNum++
    const end = cursor + dur
    slots.push({
      slot_index: slotIdx++,
      kind: 'lesson',
      lesson_number: lessonNum,
      start_time: fromMin(cursor),
      end_time: fromMin(end),
      duration_min: dur,
    })
    cursor = end
  }

  // Non-formal / Games block
  if (timing.non_formal_start && timing.non_formal_end) {
    const nfDur = toMin(timing.non_formal_end) - toMin(timing.non_formal_start)
    slots.push({
      slot_index: slotIdx++,
      kind: 'non_formal',
      start_time: timing.non_formal_start,
      end_time: timing.non_formal_end,
      duration_min: nfDur,
    })
  }

  return slots
}

/** Return only lesson slots (kind === 'lesson') from a layout */
export function getLessonSlots(layout: DaySlot[]): DaySlot[] {
  return layout.filter(s => s.kind === 'lesson')
}

/** Return indices of lesson slots immediately BEFORE a break/lunch slot */
export function getSlotsBeforeBreak(layout: DaySlot[]): number[] {
  const beforeBreak: number[] = []
  for (let i = 0; i < layout.length - 1; i++) {
    const next = layout[i + 1]
    if (['break1', 'break2', 'lunch'].includes(next.kind)) {
      if (layout[i].kind === 'lesson') {
        beforeBreak.push(layout[i].slot_index)
      }
    }
  }
  return beforeBreak
}

/** Return the slot_index of the last lesson slot in the day */
export function getLastLessonSlotIndex(layout: DaySlot[]): number {
  const lessons = getLessonSlots(layout)
  return lessons.length > 0 ? lessons[lessons.length - 1].slot_index : -1
}

/** Count how many academic lesson slots exist in the layout */
export function countLessonSlots(layout: DaySlot[]): number {
  return layout.filter(s => s.kind === 'lesson').length
}

/** Default MoE timings per level */
export const DEFAULT_TIMINGS: Record<SchoolLevel, LevelTiming> = {
  lower_primary: {
    level: 'lower_primary',
    lesson_start: '08:20',
    lesson_duration_min: 30,
    break1_after_lesson: 2,
    break1_duration_min: 10,
    break2_after_lesson: 4,
    break2_duration_min: 30,
    lunch_enabled: false,
    non_formal_start: undefined,
    non_formal_end: undefined,
    ppi_day: 0, // Monday
  },
  upper_primary: {
    level: 'upper_primary',
    lesson_start: '08:20',
    lesson_duration_min: 30,
    break1_after_lesson: 2,
    break1_duration_min: 20,
    break2_after_lesson: 4,
    break2_duration_min: 30,
    lunch_enabled: true,
    lunch_after_lesson: 6,
    lunch_duration_min: 45,
    non_formal_start: '15:35',
    non_formal_end: '16:30',
    ppi_day: 0, // Monday
  },
  junior_secondary: {
    level: 'junior_secondary',
    lesson_start: '08:20',
    lesson_duration_min: 40,
    break1_after_lesson: 2,
    break1_duration_min: 10,
    break2_after_lesson: 4,
    break2_duration_min: 30,
    lunch_enabled: true,
    lunch_after_lesson: 6,
    lunch_duration_min: 60,
    non_formal_start: '15:20',
    non_formal_end: '16:45',
    ppi_day: 0, // Monday
  },
}

// ── Grade → Level helper ────────────────────────────────────
/**
 * Maps a numeric grade (1–9) to its CBC school level.
 * Grades 1–3 → lower_primary, 4–6 → upper_primary, 7–9 → junior_secondary
 */
export function gradeToLevel(grade: number): SchoolLevel {
  if (grade <= 3) return 'lower_primary'
  if (grade <= 6) return 'upper_primary'
  return 'junior_secondary'
}
