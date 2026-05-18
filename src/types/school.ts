// ============================================================
// InstaRatiba — School Management Types
// Extends the core system with Student, Finance, and Academics
// ============================================================

export type AttendanceStatus = 'present' | 'absent' | 'late'

export type GenderType = 'Male' | 'Female'

export type TermType = 'Term 1' | 'Term 2' | 'Term 3'

export type PaymentStatus = 'Fully Paid' | 'Partial' | 'Overdue'

/**
 * Student Interface
 * Represents a student enrolled in the school.
 */
export interface Student {
  id: string
  admission_number: string
  name: string
  gender: GenderType
  dob: string
  stream_id: string
  subjects: string[]
  parent_name: string
  parent_phone: string
  parent_email?: string
  photo_url?: string
}

/**
 * MarkRecord Interface
 * Academic performance record for a student.
 */
export interface MarkRecord {
  id: string
  student_id: string
  stream_id: string
  subject_id: string
  term: TermType
  academic_year: number
  cat_marks: number
  exam_marks: number
  total_marks: number
  grade: string
  remarks?: string
}

/**
 * Teacher Interface (Management Module)
 * Note: This extends the basic Teacher info used in the timetable module.
 */
export interface Teacher {
  id: string
  tsc_number: string
  name: string
  phone: string
  email: string
  gender: GenderType
  subjects: string[]
  classes: string[]
  photo_url?: string
}

/**
 * FeeStructure Interface
 * Defines required payments for a specific grade/term.
 */
export interface FeeStructure {
  id: string
  academic_year: number
  term: TermType
  grade_level: string
  tuition: number
  transport: number
  lunch: number
  exams: number
  total_required: number
}

/**
 * PaymentTransaction Interface
 * Records fee payments made for a student.
 */
export interface PaymentTransaction {
  id: string
  student_id: string
  amount_paid: number
  balance: number
  term: TermType
  academic_year: number
  status: PaymentStatus
  reference_number: string
  date: string
}

/**
 * Expense Interface
 * Tracks school expenditures.
 */
export interface Expense {
  id: string
  category: string
  amount: number
  date: string
  description: string
}
