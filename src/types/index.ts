// ============================================================
// InstaRatiba — Core TypeScript Types
// Mirrors the DB schema (§6.3) and app models (§4.1 – §5.x)
// ============================================================

// ── Enums ──────────────────────────────────────────────────

export type SchoolLevel = 'lower_primary' | 'upper_primary' | 'junior_secondary'

export type Term = 1 | 2 | 3

export type TimetableStatus = 'draft' | 'pending' | 'published' | 'archived'

export type ConflictSeverity = 'hard' | 'soft'

export type DutyType = 'morning_assembly' | 'lunch_supervision' | 'gate_duty'

export type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'

export type UserRole = 'head_teacher' | 'deputy_head' | 'hod' | 'class_teacher'

// ── School ─────────────────────────────────────────────────

export interface School {
  id: string
  user_id: string
  name: string
  county: string
  sub_county?: string
  levels: SchoolLevel[]
  motto?: string
  nemis_code?: string
  logo_url?: string
  indigenous_language?: string
  academic_year: number
  current_term: Term
  climate_adjustment: boolean
  created_at: string
}

// ── Timing (§2.3 / Screen 2b) ──────────────────────────────

export interface LevelTiming {
  level: SchoolLevel
  lesson_start: string        // e.g. "08:20"
  lesson_duration_min: number // 30 or 40
  break1_after_lesson: number // 2
  break1_duration_min: number
  break2_after_lesson: number // 4
  break2_duration_min: number
  lunch_enabled: boolean
  lunch_after_lesson?: number
  lunch_duration_min?: number
  non_formal_start?: string
  non_formal_end?: string
  /** 0=Mon…4=Fri. When set, a 10-min PPI slot is inserted after assembly on that day.
   *  School-wide — same day for all levels. Undefined = no PPI slot rendered. */
  ppi_day?: number
}

// ── Academic Term ──────────────────────────────────────────

export interface AcademicTerm {
  id: string
  school_id: string
  year: number
  term: Term
  start_date: string
  end_date: string
  is_active: boolean
}

// ── Class / Stream ─────────────────────────────────────────

export interface SchoolClass {
  id: string
  school_id: string
  grade: number             // 1–9
  stream: string            // "A", "B", "C" …
  class_teacher_id?: string
  size?: number
}

// ── Room / Venue (§Screen 8) ───────────────────────────────

export interface Room {
  id: string
  school_id: string
  name: string
  capacity?: number
  subject_codes: string[]
  levels: SchoolLevel[]
}

// ── Teacher ────────────────────────────────────────────────

export interface Teacher {
  id: string
  school_id: string
  name: string
  tsc_no?: string
  email?: string
  phone?: string
  gender?: 'Male' | 'Female'
  max_lessons_day: number    // default 6
  max_lessons_week?: number
  max_consecutive: number    // default 3 (soft constraint)
  min_free_periods_day?: number
}

export interface TeacherSubject {
  id: string
  teacher_id: string
  subject_code: string
  grades: number[]
}

// ── Subject Allocation (§2.4 / Screen 5) ──────────────────

export interface SubjectAllocation {
  id: string
  school_id: string
  class_id: string
  subject_code: string
  lessons_per_week: number
  requires_double: boolean
  teacher_id?: string
}

// ── CBC Subject (§2.4) ─────────────────────────────────────

export interface CbcSubject {
  code: string
  name: string
  level: SchoolLevel
  lessons_per_week: number
  lesson_duration_min: number
  requires_double: boolean        // §2.6
  morning_priority: 'always' | 'preferred' | 'flexible'  // §2.5
  similarity_group?: string       // §7.3 — cannot be back-to-back
}

// ── Timetable ──────────────────────────────────────────────

export interface Timetable {
  id: string
  school_id: string
  term_id: string
  name: string
  status: TimetableStatus
  created_at: string
  approved_at?: string
  approved_by?: string
}

export interface TimetableSlot {
  id: string
  timetable_id: string
  class_id: string
  teacher_id?: string
  subject_code?: string
  room_id?: string
  day: Day
  slot_index: number
  is_break: boolean
  is_assembly: boolean
  is_non_formal: boolean
  is_ppi: boolean
}

export interface TimetableOverride {
  id: string
  timetable_slot_id: string
  reason: string
  override_teacher_id?: string
  date: string
}

export interface TimetableShareToken {
  id: string
  timetable_id: string
  token: string
  created_at: string
  revoked_at?: string
}

// ── Conflict ───────────────────────────────────────────────

export interface Conflict {
  id: string
  timetable_id: string
  type: ConflictType
  severity: ConflictSeverity
  description: string
  resolved: boolean
}

export type ConflictType =
  | 'teacher_double_booked'
  | 'room_double_booked'
  | 'lesson_count_wrong'
  | 'similar_subjects_consecutive'
  | 'unintended_double_lesson'
  | 'creative_arts_not_before_break'
  | 'no_teacher_assigned'
  | 'custom_schedule_slots_short'
  | 'morning_afternoon_imbalance'
  | 'teacher_near_max_lessons'
  | 'teacher_consecutive_exceeded'
  | 'teacher_gap_large'
  | 'core_subject_afternoon'
  | 'class_teacher_unassigned'

// ── Duty Roster (§5.7) ─────────────────────────────────────

export interface DutyRoster {
  id: string
  timetable_id: string
  teacher_id: string
  duty_type: DutyType
  day: Day
}

// ── Approval (§Screen 9) ───────────────────────────────────

export interface ApprovalComment {
  id: string
  timetable_id: string
  author_id: string
  slot_id?: string
  comment: string
  created_at: string
}

// ── Auth / User ────────────────────────────────────────────

export interface AppUser {
  id: string
  email: string
  display_name?: string
  role: UserRole
  school_id?: string
  avatar_url?: string
}

// ── Error Log (§5.14) ──────────────────────────────────────

export interface ErrorLog {
  id: string
  school_id?: string
  component: string
  stack_trace: string
  created_at: string
}

// ── UI State Helpers ───────────────────────────────────────

export interface ToastPayload {
  id: string
  type: 'success' | 'error' | 'warn' | 'info'
  message: string
}

export interface WizardStep {
  key: string
  label: string
  path: string
}

export const WIZARD_STEPS: WizardStep[] = [
  { key: 'school',     label: 'School',     path: '/setup' },
  { key: 'classes',    label: 'Classes',    path: '/classes' },
  { key: 'rooms',      label: 'Rooms',      path: '/rooms' },
  { key: 'teachers',   label: 'Teachers',   path: '/teachers' },
  { key: 'allocation', label: 'Allocation', path: '/allocation' },
  { key: 'review',     label: 'Review',     path: '/review' },
  { key: 'generate',   label: 'Generate',   path: '/timetable' },
]

// ── Kenya Counties (Screen 2) ──────────────────────────────

export const KENYA_COUNTIES = [
  'Mombasa','Kwale','Kilifi','Tana River','Lamu','Taita-Taveta',
  'Garissa','Wajir','Mandera','Marsabit','Isiolo','Meru',
  'Tharaka-Nithi','Embu','Kitui','Machakos','Makueni','Nyandarua',
  'Nyeri','Kirinyaga','Murang\'a','Kiambu','Turkana','West Pokot',
  'Samburu','Trans Nzoia','Uasin Gishu','Elgeyo-Marakwet','Nandi',
  'Baringo','Laikipia','Nakuru','Narok','Kajiado','Kericho',
  'Bomet','Kakamega','Vihiga','Bungoma','Busia','Siaya',
  'Kisumu','Homa Bay','Migori','Kisii','Nyamira','Nairobi',
]

// ── Indigenous Languages (Grade 1–3, Screen 2) ─────────────

export const INDIGENOUS_LANGUAGES = [
  'Gikuyu','Dholuo','Kikamba','Kalenjin','Luhya',
  'Somali','Maasai','Kisii','Meru','Taita','Mijikenda',
  'Turkana','Samburu','Borana','Rendille','Pokot','Other',
]
