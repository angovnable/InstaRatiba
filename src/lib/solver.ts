// src/lib/solver.ts
import { 
  SchoolClass, 
  Teacher, 
  GenerateResult, 
  ClassGrid, 
  LessonCell, 
  Subject 
} from '../types';
import { DAYS, LESSON_SLOTS, shuffle } from './constants';

/**
 * Morning Priority Subjects (Slots 1-4)
 */
const MORNING_SUBJECTS = ['Mathematics', 'Integrated Science', 'English', 'Kiswahili', 'KSL'];

/**
 * Main entry point to generate timetables for all classes
 */
export function solveAllClasses(
  classes: SchoolClass[],
  teachers: Teacher[]
): GenerateResult {
  const timetable: GenerateResult['timetable'] = {};
  const conflicts: GenerateResult['conflicts'] = [];
  const warnings: GenerateResult['warnings'] = [];
  const compliance: GenerateResult['compliance'] = {};
  
  // Track which teacher is busy at which day/slot globally
  const teacherOccupancy: Record<string, boolean> = {};

  // Sort classes (perhaps JSS first) or just process in order
  for (const cls of classes) {
    const result = solveClass(cls, teachers, teacherOccupancy);
    
    timetable[cls.id] = result.grid;
    compliance[cls.id] = result.compliance;

    // Add class-specific conflicts/warnings to global list
    conflicts.push(...result.conflicts.map(msg => ({ class: `${cls.grade} ${cls.stream}`, msg })));
    warnings.push(...result.warnings.map(msg => ({ class: `${cls.grade} ${cls.stream}`, msg })));

    // Update global teacher occupancy for the next class
    for (const dayIdx of Object.keys(result.grid)) {
      const di = parseInt(dayIdx);
      for (const slotIdx of Object.keys(result.grid[di])) {
        const si = parseInt(slotIdx);
        const lesson = result.grid[di][si];
        if (lesson?.teacherId) {
          teacherOccupancy[`${lesson.teacherId}_${di}_${si}`] = true;
        }
      }
    }
  }

  return { timetable, conflicts, warnings, compliance };
}

function solveClass(
  cls: SchoolClass,
  teachers: Teacher[],
  globalTeacherOccupancy: Record<string, boolean>
) {
  const grid: ClassGrid = {};
  const conflicts: string[] = [];
  const warnings: string[] = [];
  const placed: Record<string, number> = {};
  const dailyCount: Record<number, Record<string, number>> = {};

  // Initialize empty grid
  DAYS.forEach((_, di) => {
    grid[di] = {};
    dailyCount[di] = {};
    LESSON_SLOTS.forEach((_, si) => {
      grid[di][si] = null;
    });
  });

  if (cls.subjects.length === 0) {
    return { grid, conflicts: ['No subjects configured'], warnings, compliance: {} };
  }

  /**
   * Helper: Check if a double lesson is allowed at this slot pair (si, si+1)
   * Prevents doubles from being split by tea break or lunch
   */
  const isValidDoubleSlot = (si: number) => {
    // Break after L2 (si=1) and Lunch after L5 (si=4)
    // Adjust indices if your LESSON_SLOTS array differs
    if (si === 1 || si === 4) return false; 
    return si < LESSON_SLOTS.length - 1;
  };

  const isTeacherFree = (teacherId: string | undefined, di: number, si: number) => {
    if (!teacherId) return true;
    const t = teachers.find(t => t.id === teacherId);
    if (!t) return true;

    // Check availability (BOM days, unavailSlots, global occupancy)
    if (t.isBOM && t.bomDays.length > 0 && !t.bomDays.includes(DAYS[di])) return false;
    
    // Check global occupancy (already teaching another class)
    if (globalTeacherOccupancy[`${teacherId}_${di}_${si}`]) return false;

    // Specific unavailable slots
    const isUnavail = t.unavailSlots?.some(u => u.day === di && u.slot === si);
    if (isUnavail) return false;

    return true;
  };

  const placeLesson = (di: number, si: number, sub: Subject, isDouble = false) => {
    grid[di][si] = {
      subjectId: sub.id,
      subjectName: sub.name,
      teacherId: sub.teacherId,
      color: sub.color,
      isDouble
    };
    placed[sub.id] = (placed[sub.id] || 0) + 1;
    dailyCount[di][sub.id] = (dailyCount[di][sub.id] || 0) + 1;
  };

  // --- GENERATION LOGIC ---

  // 1. Place Locked subjects (e.g. PPI on Friday last)
  cls.subjects.filter(s => s.locked).forEach(sub => {
    if (sub.locked === 'friday_last') {
      const di = 4; // Friday
      const si = LESSON_SLOTS.length - 1;
      if (isTeacherFree(sub.teacherId, di, si)) {
        placeLesson(di, si, sub);
      } else {
        conflicts.push(`Locked subject ${sub.name} teacher is unavailable on Friday last slot.`);
      }
    }
  });

  // 2. Priority: Double Lessons
  const subjectsWithDoubles = cls.subjects.filter(s => s.doubleMandatory || (s.doubleCount && s.doubleCount > 0));
  for (const sub of subjectsWithDoubles) {
    const doublesToPlace = sub.doubleMandatory ? 1 : (sub.doubleCount || 0);
    
    for (let i = 0; i < doublesToPlace; i++) {
      let success = false;
      const days = shuffle([...Array(5).keys()]);
      for (const di of days) {
        if (placed[sub.id] >= sub.periods - 1) break; // Need at least 2 remaining
        if (dailyCount[di][sub.id]) continue; // Avoid 3 lessons of same subject in one day

        const slots = [...Array(LESSON_SLOTS.length).keys()];
        for (const si of slots) {
          if (isValidDoubleSlot(si) && 
              grid[di][si] === null && grid[di][si+1] === null &&
              isTeacherFree(sub.teacherId, di, si) && isTeacherFree(sub.teacherId, di, si+1)) {
            placeLesson(di, si, sub, true);
            placeLesson(di, si+1, sub, true);
            success = true;
            break;
          }
        }
        if (success) break;
      }
    }
  }

  // 3. Priority: Morning Subjects (Mathematics, Science, English, Kiswahili)
  const morningSubs = cls.subjects.filter(s => MORNING_SUBJECTS.some(m => s.name.includes(m)));
  for (const sub of morningSubs) {
    while ((placed[sub.id] || 0) < sub.periods) {
      let success = false;
      const days = shuffle([...Array(5).keys()]);
      for (const di of days) {
        if (dailyCount[di][sub.id] >= 1) continue; 

        // Try slots 0-3 (Morning)
        const slots = [0, 1, 2, 3]; 
        for (const si of slots) {
          if (grid[di][si] === null && isTeacherFree(sub.teacherId, di, si)) {
            placeLesson(di, si, sub);
            success = true;
            break;
          }
        }
        if (success) break;
      }
      if (!success) break; // Fallthrough to general placement if morning is full
    }
  }

  // 4. General Placement for remaining periods
  for (const sub of cls.subjects) {
    while ((placed[sub.id] || 0) < sub.periods) {
      let success = false;
      for (const di of shuffle([...Array(5).keys()])) {
        // Try to keep it to 1 per day if possible
        if (dailyCount[di][sub.id] >= 1 && sub.periods <= 5) continue; 
        
        for (let si = 0; si < LESSON_SLOTS.length; si++) {
          if (grid[di][si] === null && isTeacherFree(sub.teacherId, di, si)) {
            placeLesson(di, si, sub);
            success = true;
            break;
          }
        }
        if (success) break;
      }

      if (!success) {
        conflicts.push(`Could not place all periods for ${sub.name} (${placed[sub.id]}/${sub.periods})`);
        break;
      }
    }
  }

  // --- FINAL COMPLIANCE CHECK ---
  const compliance: Record<string, { name: string; placed: number; required: number }> = {};
  cls.subjects.forEach(sub => {
    compliance[sub.id] = {
      name: sub.name,
      placed: placed[sub.id] || 0,
      required: sub.periods
    };
  });

  return { grid, conflicts, warnings, compliance };
}