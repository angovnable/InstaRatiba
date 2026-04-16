// src/types/index.ts

export type SchoolLevel = 'primary' | 'jss' | 'both';

export interface School {
  name: string;
  county: string;
  term: string;
  level: SchoolLevel;
  startTime: string; // e.g., "08:20"
  // Scheduling fields
  lessonDuration: number; 
  breakDuration: number;  
  lunchDuration: number;  
}

export interface Subject {
  id: string;
  name: string;
  periods: number;
  color: string;
  teacherId?: string;
  isCore?: boolean;
  daily?: boolean;
  locked?: string;         // e.g., "friday_last"
  doubleCount?: number;    // Number of double lessons allowed
  doubleMandatory?: boolean; 
  // Custom Logic Flags
  beforeLunch?: boolean;   // For morning priority (Maths, Science, etc.)
  isOptional?: boolean;    // For elective subjects
}

export interface Teacher {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tsc?: string;
  maxWeek: number;
  maxDay: number;
  isBOM: boolean;
  bomDays: string[];
  unavailSlots: Array<{day: number, slot: number}>;
}

export interface SchoolClass {
  id: string;
  grade: string;
  stream: string;
  level: SchoolLevel;
  subjects: Subject[];
}

export interface LessonCell {
  subjectId: string;
  subjectName: string;
  teacherId?: string;
  color?: string;
  isDouble?: boolean;
}

export type ClassGrid = Record<number, Record<number, LessonCell | null>>;
export type Timetable = Record<string, ClassGrid>;

export interface ComplianceItem {
  name: string;
  placed: number;
  required: number;
}

export interface GenerateResult {
  timetable: Timetable;
  conflicts: Array<{ class: string; msg: string }>;
  warnings: Array<{ class: string; msg: string }>;
  compliance: Record<string, Record<string, ComplianceItem>>;
}

export type Language = 'en' | 'sw';