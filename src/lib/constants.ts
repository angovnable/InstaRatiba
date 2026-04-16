// src/lib/constants.ts
import { School, Subject } from '../types';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const LESSON_SLOTS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'];

export const GRADES = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9'
];

export const STREAMS = ['Blue', 'Green', 'Red', 'Yellow', 'East', 'West', 'North', 'South'];

/**
 * Generates time strings (e.g., "8:20 AM – 9:00 AM") based on School settings.
 * Respects tea break after L2 and lunch after L5.
 */
export const calculateTimeLabels = (school: School): string[] => {
  const labels: string[] = [];
  const start = school.startTime || "08:20";
  const [startH, startM] = start.split(':').map(Number);
  let currentMinutes = startH * 60 + startM;

  const formatTime = (totalMin: number) => {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  };

  for (let i = 0; i < LESSON_SLOTS.length; i++) {
    const lessonStart = currentMinutes;
    const lessonEnd = currentMinutes + (school.lessonDuration || 40);
    labels.push(`${formatTime(lessonStart)} – ${formatTime(lessonEnd)}`);
    currentMinutes = lessonEnd;
    
    if (i === 1) currentMinutes += (school.breakDuration || 20); // Tea Break
    if (i === 4) currentMinutes += (school.lunchDuration || 40); // Lunch
  }
  return labels;
};

export const SUBJECT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#06b6d4', '#ec4899', '#71717a', '#0ea5e9', '#f97316', 
  '#1e293b', '#64748b', '#a855f7', '#14b8a6', '#f43f5e'
];

/**
 * JSS Template: 
 * - Maths/English/Science/KSL marked with beforeLunch: true
 * - Science/Pre-Tech/Agri marked with doubleMandatory: true
 */
export const JSS_SUBJECTS_TEMPLATE: Omit<Subject, 'id'>[] = [
  { name: 'Mathematics', periods: 5, color: '#3b82f6', isCore: true, beforeLunch: true },
  { name: 'English', periods: 5, color: '#ef4444', isCore: true, beforeLunch: true },
  { name: 'Kiswahili / KSL', periods: 4, color: '#10b981', isCore: true, beforeLunch: true },
  { name: 'Integrated Science', periods: 4, color: '#8b5cf6', isCore: true, doubleMandatory: true, beforeLunch: true },
  { name: 'Pre-Technical Studies', periods: 4, color: '#ec4899', doubleMandatory: true },
  { name: 'Social Studies', periods: 3, color: '#f59e0b' },
  { name: 'Religious Education', periods: 3, color: '#06b6d4' },
  { name: 'Agriculture & Nutrition', periods: 4, color: '#0ea5e9', doubleMandatory: true },
  { name: 'Creative Arts & Sports', periods: 5, color: '#f97316' },
  { name: 'Life Skills', periods: 1, color: '#71717a' },
  { name: 'Optional Subject', periods: 3, color: '#64748b', isOptional: true },
  { name: 'PPI', periods: 1, color: '#1e293b', locked: 'friday_last' }
];

export const PRIMARY_SUBJECTS_TEMPLATE: Omit<Subject, 'id'>[] = [
  { name: 'Mathematics', periods: 5, color: '#3b82f6', isCore: true, beforeLunch: true },
  { name: 'English', periods: 5, color: '#ef4444', isCore: true, beforeLunch: true },
  { name: 'Kiswahili', periods: 4, color: '#10b981', isCore: true, beforeLunch: true },
  { name: 'Science & Technology', periods: 4, color: '#8b5cf6', isCore: true, beforeLunch: true },
  { name: 'Social Studies', periods: 3, color: '#f59e0b' },
  { name: 'CRE / IRE / HRE', periods: 3, color: '#06b6d4' },
  { name: 'Agriculture', periods: 3, color: '#0ea5e9' },
  { name: 'Home Science', periods: 3, color: '#ec4899' },
  { name: 'Creative Arts', periods: 3, color: '#f97316' },
  { name: 'Physical Education', periods: 5, color: '#71717a' },
  { name: 'PPI', periods: 1, color: '#1e293b', locked: 'friday_last' }
];

export const KENYA_COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa", "Homa Bay",
  "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii",
  "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera",
  "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi",
  "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita Taveta", "Tana River",
  "Tharaka Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
];

export const TRANSLATIONS = {
  en: {
    school: 'School',
    teachers: 'Teachers',
    classes: 'Classes',
    generate: 'Generate',
    addTeacher: 'Add Teacher',
    addClass: 'Add Class',
    save: 'Save Changes',
    export: 'Export PDF',
    streamPDF: 'Class Timetable',
    teacherPDF: 'Teacher Timetable',
    masterPDF: 'Master Timetable',
    compliance: 'MoE Compliance',
    lessonDur: 'Lesson Duration',
    breakDur: 'Break Duration',
    lunchDur: 'Lunch Duration',
  },
  sw: {
    school: 'Shule',
    teachers: 'Walimu',
    classes: 'Madarasa',
    generate: 'Tengeneza',
    addTeacher: 'Ongeza Mwalimu',
    addClass: 'Ongeza Darasa',
    save: 'Hifadhi',
    export: 'Pakua PDF',
    streamPDF: 'Ratiba ya Darasa',
    teacherPDF: 'Ratiba ya Mwalimu',
    masterPDF: 'Ratiba Kuu',
    compliance: 'Ripoti ya MoE',
    lessonDur: 'Muda wa Somo',
    breakDur: 'Mapumziko',
    lunchDur: 'Muda wa Chakula',
  }
};

export const shuffle = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};