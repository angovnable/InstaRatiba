export type SchoolLevel = 'jss' | 'upper_primary' | 'lower_primary'

export interface School {
  id?: string
  name: string
  county: string
  term: string
  level: 'jss' | 'primary' | 'both'
  startTime: string
  endTime: string
  lessonDurationJSS: number
  lessonDurationPrimary: number
}

export interface Subject {
  id: string
  name: string
  periods: number
  color: string
  isCore?: boolean
  isOptional?: boolean
  morning?: boolean
  daily?: boolean
  beforeLunch?: boolean
  doubleCount?: number
  doubleMandatory?: boolean
  locked?: string
  teacherId?: string
}

export interface SchoolClass {
  id: string
  grade: string
  stream: string
  level: SchoolLevel
  subjects: Subject[]
  roomName?: string
}

export interface UnavailSlot {
  day: string
  start: string
}

export interface Teacher {
  id: string
  name: string
  tsc?: string
  maxWeek: number
  maxDay: number
  isBOM: boolean
  bomDays: string[]
  unavailSlots: UnavailSlot[]
  currentLoad?: number
  substituteFor?: string
}

export interface LessonCell {
  subjectId: string
  subjectName: string
  teacherId?: string
  color?: string
  isDouble?: boolean
  locked?: boolean
  label?: string
  isRemedial?: boolean
}

export type DayGrid = Record<number, LessonCell | null>
export type ClassGrid = Record<number, DayGrid>
export type Timetable = Record<string, ClassGrid>

export interface ComplianceItem {
  name: string
  placed: number
  required: number
}

export interface GenerateResult {
  timetable: Timetable
  conflicts: Array<{ class: string; msg: string }>
  warnings: Array<{ class: string; msg: string }>
  compliance: Record<string, Record<string, ComplianceItem>>
}

export interface DbTimetableRecord {
  id: string
  userId: string
  name: string
  school: School
  classes: SchoolClass[]
  teachers: Teacher[]
  generatedTimetable?: Timetable
  conflicts?: GenerateResult['conflicts']
  warnings?: GenerateResult['warnings']
  compliance?: GenerateResult['compliance']
  createdAt: any
  updatedAt: any
}

export type AppStep = 0 | 1 | 2 | 3
export type TimetableView = 'class' | 'teacher'
export type Language = 'en' | 'sw'
