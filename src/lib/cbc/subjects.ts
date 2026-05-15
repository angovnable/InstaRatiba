// ============================================================
// InstaRatiba — CBC Subject Catalogue
// §2.4 — All Grade Levels, Lesson Counts, Constraints
// §2.5 — Morning Priority Rules
// §2.6 — Double Lesson Requirements
// §7.3 — Similarity Groups (no consecutive)
// ============================================================

import type { CbcSubject, SchoolLevel } from '@/types'

// ── GRADE 1–3: Lower Primary ────────────────────────────────
const LOWER_PRIMARY_SUBJECTS: CbcSubject[] = [
  {
    code: 'indig_lang',
    name: 'Indigenous Language Activities',
    level: 'lower_primary',
    lessons_per_week: 2,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'preferred',
    similarity_group: 'languages',
  },
  {
    code: 'kiswahili_lp',
    name: 'Kiswahili / Kenya Sign Language',
    level: 'lower_primary',
    lessons_per_week: 4,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'preferred',
    similarity_group: 'languages',
  },
  {
    code: 'english_lp',
    name: 'English Language Activities',
    level: 'lower_primary',
    lessons_per_week: 5,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'always',
    similarity_group: 'languages',
  },
  {
    code: 'maths_lp',
    name: 'Mathematics Activities',
    level: 'lower_primary',
    lessons_per_week: 5,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'always',
    similarity_group: 'mathematics',
  },
  {
    code: 'environ_lp',
    name: 'Environmental Activities',
    level: 'lower_primary',
    lessons_per_week: 4,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'flexible',
    similarity_group: 'sciences',
  },
  {
    code: 'creative_arts_lp',
    name: 'Creative Arts & Craft',
    level: 'lower_primary',
    lessons_per_week: 4,
    lesson_duration_min: 30,
    requires_double: true,   // §2.6 — double before break
    morning_priority: 'flexible',
    similarity_group: 'creative',
  },
  {
    code: 'rel_ed_lp',
    name: 'Religious Education',
    level: 'lower_primary',
    lessons_per_week: 3,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'flexible',
    similarity_group: 'humanities',
  },
  {
    code: 'phe_lp',
    name: 'Physical & Health Education',
    level: 'lower_primary',
    lessons_per_week: 3,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'flexible',
    similarity_group: 'phe',
  },
]
// Total: 30 (PPI is a school-wide fixed timing slot, not a subject allocation)

// ── GRADE 4–6: Upper Primary ────────────────────────────────
const UPPER_PRIMARY_SUBJECTS: CbcSubject[] = [
  {
    code: 'english_up',
    name: 'English',
    level: 'upper_primary',
    lessons_per_week: 5,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'always',
    similarity_group: 'languages',
  },
  {
    code: 'kiswahili_up',
    name: 'Kiswahili / Kenya Sign Language',
    level: 'upper_primary',
    lessons_per_week: 5,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'preferred',
    similarity_group: 'languages',
  },
  {
    code: 'maths_up',
    name: 'Mathematics',
    level: 'upper_primary',
    lessons_per_week: 5,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'always',
    similarity_group: 'mathematics',
  },
  {
    code: 'sci_tech',
    name: 'Science & Technology',
    level: 'upper_primary',
    lessons_per_week: 4,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'always',
    similarity_group: 'sciences',
  },
  {
    code: 'social_studies_up',
    name: 'Social Studies',
    level: 'upper_primary',
    lessons_per_week: 3,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'preferred',
    similarity_group: 'humanities',
  },
  {
    code: 'rel_ed_up',
    name: 'Religious Education',
    level: 'upper_primary',
    lessons_per_week: 3,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'flexible',
    similarity_group: 'humanities',
  },
  {
    code: 'agri',
    name: 'Agriculture',
    level: 'upper_primary',
    lessons_per_week: 3,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'flexible',
    similarity_group: 'practical',
  },
  {
    code: 'creative_arts_up',
    name: 'Creative Arts',
    level: 'upper_primary',
    lessons_per_week: 3,
    lesson_duration_min: 30,
    requires_double: true,
    morning_priority: 'flexible',
    similarity_group: 'creative',
  },
  {
    code: 'home_sci',
    name: 'Home Science / Craft / Music',
    level: 'upper_primary',
    lessons_per_week: 3,
    lesson_duration_min: 30,
    requires_double: true,
    morning_priority: 'flexible',
    similarity_group: 'practical',
  },
  {
    code: 'phe_up',
    name: 'Physical & Health Education',
    level: 'upper_primary',
    lessons_per_week: 3,
    lesson_duration_min: 30,
    requires_double: false,
    morning_priority: 'flexible',
    similarity_group: 'phe',
  },
]
// Total: 37–39 (PPI is a school-wide fixed timing slot, not a subject allocation)

// ── GRADE 7–9: Junior Secondary ─────────────────────────────
const JUNIOR_SECONDARY_SUBJECTS: CbcSubject[] = [
  {
    code: 'english_jss',
    name: 'English',
    level: 'junior_secondary',
    lessons_per_week: 5,
    lesson_duration_min: 40,
    requires_double: false,
    morning_priority: 'always',
    similarity_group: 'languages',
  },
  {
    code: 'kiswahili_jss',
    name: 'Kiswahili / Kenya Sign Language',
    level: 'junior_secondary',
    lessons_per_week: 5,
    lesson_duration_min: 40,
    requires_double: false,
    morning_priority: 'preferred',
    similarity_group: 'languages',
  },
  {
    code: 'maths_jss',
    name: 'Mathematics',
    level: 'junior_secondary',
    lessons_per_week: 5,
    lesson_duration_min: 40,
    requires_double: false,
    morning_priority: 'always',
    similarity_group: 'mathematics',
  },
  {
    code: 'integ_sci',
    name: 'Integrated Science',
    level: 'junior_secondary',
    lessons_per_week: 4,
    lesson_duration_min: 40,
    requires_double: false,
    morning_priority: 'always',
    similarity_group: 'sciences',
  },
  {
    code: 'social_studies_jss',
    name: 'Social Studies',
    level: 'junior_secondary',
    lessons_per_week: 4,
    lesson_duration_min: 40,
    requires_double: false,
    morning_priority: 'preferred',
    similarity_group: 'humanities',
  },
  {
    code: 'rel_ethics_jss',
    name: 'Religious Education / Ethics',
    level: 'junior_secondary',
    lessons_per_week: 3,
    lesson_duration_min: 40,
    requires_double: false,
    morning_priority: 'flexible',
    similarity_group: 'humanities',
  },
  {
    code: 'pre_tech',
    name: 'Pre-Technical & Pre-Vocational Studies',
    level: 'junior_secondary',
    lessons_per_week: 3,
    lesson_duration_min: 40,
    requires_double: true,    // §2.6
    morning_priority: 'flexible',
    similarity_group: 'practical',
  },
  {
    code: 'agri_nutrition',
    name: 'Agriculture & Nutrition',
    level: 'junior_secondary',
    lessons_per_week: 3,
    lesson_duration_min: 40,
    requires_double: true,    // §2.6
    morning_priority: 'flexible',
    similarity_group: 'practical',
  },
  {
    code: 'creative_arts_sports',
    name: 'Creative Arts & Sports',
    level: 'junior_secondary',
    lessons_per_week: 3,
    lesson_duration_min: 40,
    requires_double: true,    // §2.6
    morning_priority: 'flexible',
    similarity_group: 'creative',
  },
  {
    code: 'ict',
    name: 'ICT',
    level: 'junior_secondary',
    lessons_per_week: 3,
    lesson_duration_min: 40,
    requires_double: false,
    morning_priority: 'flexible',
    similarity_group: 'technology',
  },
  {
    code: 'cte',
    name: 'Career & Tech Education (CTE)',
    level: 'junior_secondary',
    lessons_per_week: 2,
    lesson_duration_min: 40,
    requires_double: false,
    morning_priority: 'flexible',
    similarity_group: 'technology',
  },
]
// Total: 40 ✓

// ── Exports ─────────────────────────────────────────────────

export const CBC_SUBJECTS_BY_LEVEL: Record<SchoolLevel, CbcSubject[]> = {
  lower_primary:    LOWER_PRIMARY_SUBJECTS,
  upper_primary:    UPPER_PRIMARY_SUBJECTS,
  junior_secondary: JUNIOR_SECONDARY_SUBJECTS,
}

/** Get all subjects for a set of grade levels */
export function getSubjectsForLevels(levels: SchoolLevel[]): CbcSubject[] {
  return levels.flatMap(l => CBC_SUBJECTS_BY_LEVEL[l])
}

/** Get the subject by code (any level) */
export function getSubjectByCode(code: string): CbcSubject | undefined {
  return Object.values(CBC_SUBJECTS_BY_LEVEL)
    .flat()
    .find(s => s.code === code)
}

// ── §7.3 — Similarity Groups ─────────────────────────────────
// Subjects in the same group CANNOT be scheduled consecutively

export const SIMILARITY_GROUPS: Record<string, string[]> = {
  // Languages: split by level — blocking english next to kiswahili within the same level
  // is too restrictive and causes many unnecessary conflicts. Each level has its own pair.
  languages_lp:     ['english_lp', 'kiswahili_lp', 'indig_lang'],
  languages_up:     ['english_up', 'kiswahili_up'],
  languages_jss:    ['english_jss', 'kiswahili_jss'],

  // C4 FIX: §7.3 — Mathematics ↔ Science cannot be consecutive.
  maths_sciences:   ['maths_lp','maths_up','maths_jss','environ_lp','sci_tech','integ_sci'],

  // Humanities: split by level — social_studies and rel_ed are different subjects at
  // the same level and should NOT block each other. Cross-level never co-occurs in practice.
  humanities_lp:    ['rel_ed_lp'],
  humanities_up:    ['social_studies_up', 'rel_ed_up'],
  humanities_jss:   ['social_studies_jss', 'rel_ethics_jss'],

  creative:         ['creative_arts_lp','creative_arts_up','creative_arts_sports','home_sci'],
  // C5 FIX: PHE ↔ Creative Arts blocked at all levels.
  phe:              ['phe_lp','phe_up','creative_arts_lp','creative_arts_up','creative_arts_sports'],
  practical:        ['agri','agri_nutrition','home_sci','pre_tech'],
}

/** Return true if two subjects are in the same similarity group (cannot be consecutive) */
export function areSimilarSubjects(codeA: string, codeB: string): boolean {
  return Object.values(SIMILARITY_GROUPS).some(
    group => group.includes(codeA) && group.includes(codeB)
  )
}

// ── §2.5 — Morning Priority ──────────────────────────────────

export const ALWAYS_MORNING_CODES = new Set([
  'english_lp','english_up','english_jss',
  'maths_lp','maths_up','maths_jss',
  'sci_tech','integ_sci',
])

export const PREFERRED_MORNING_CODES = new Set([
  'kiswahili_lp','kiswahili_up','kiswahili_jss',
  'social_studies_up','social_studies_jss',
])

// ── §2.6 — Double Lesson Codes ───────────────────────────────
export const DOUBLE_LESSON_CODES = new Set([
  'creative_arts_lp',
  'creative_arts_up', 'home_sci',
  'pre_tech', 'agri_nutrition', 'creative_arts_sports',
])