import type { Subject, SchoolLevel } from '@/types'

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
export const DAYS_SW = ['Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa']

export interface TimeSlot {
  type: 'lesson' | 'break' | 'pre'
  time?: string
  label?: string
}

export const JSS_SLOTS: TimeSlot[] = [
  { type: 'pre',   label: 'Assembly' },
  { type: 'lesson', time: '8:20–9:00',   label: 'L1' },
  { type: 'lesson', time: '9:00–9:40',   label: 'L2' },
  { type: 'break',  time: '9:40–10:00',  label: 'Tea Break' },
  { type: 'lesson', time: '10:00–10:40', label: 'L3' },
  { type: 'lesson', time: '10:40–11:20', label: 'L4' },
  { type: 'lesson', time: '11:20–12:00', label: 'L5' },
  { type: 'break',  time: '12:00–12:40', label: 'Lunch' },
  { type: 'lesson', time: '12:40–13:20', label: 'L6' },
  { type: 'lesson', time: '13:20–14:00', label: 'L7' },
  { type: 'lesson', time: '14:00–14:40', label: 'L8' },
  { type: 'lesson', time: '14:40–15:20', label: 'L9' },
]

export const LESSON_SLOTS = JSS_SLOTS.filter(s => s.type === 'lesson')

export const CBC_PRESETS: Record<SchoolLevel, { label: string; totalPeriods: number; subjects: Omit<Subject, 'id'>[] }> = {
  lower_primary: {
    label: 'Lower Primary (Grades 1–3)',
    totalPeriods: 30,
    subjects: [
      { name: 'Indigenous Language',       periods: 2, color: '#5D4037', isCore: false },
      { name: 'Kiswahili / KSL',           periods: 4, color: '#2E7D32', isCore: true },
      { name: 'Mathematics',               periods: 5, color: '#C0392B', isCore: true, morning: true },
      { name: 'English',                   periods: 5, color: '#1565C0', isCore: true, morning: true },
      { name: 'Religious Education',       periods: 3, color: '#4E342E', isCore: false },
      { name: 'Environmental Activities',  periods: 4, color: '#558B2F', isCore: false },
      { name: 'Creative Activities',       periods: 6, color: '#AD1457', isCore: false },
      { name: 'Pastoral Programme (PPI)',  periods: 1, color: '#6A1B9A', locked: 'friday_last', isCore: false },
    ]
  },
  upper_primary: {
    label: 'Upper Primary (Grades 4–6)',
    totalPeriods: 35,
    // REPLACE the upper_primary subjects array:
subjects: [
  { name: 'English',                   periods: 5, color: '#1565C0', isCore: true, morning: true },
  { name: 'Mathematics',               periods: 5, color: '#C0392B', isCore: true, morning: true },
  { name: 'Kiswahili / KSL',           periods: 4, color: '#2E7D32', isCore: true, morning: true },
  { name: 'Integrated Science',        periods: 4, color: '#E65100', isCore: false, morning: true, doubleCount: 1 },
  { name: 'Religious Education',       periods: 3, color: '#4E342E', isCore: false },
  { name: 'Social Studies',            periods: 3, color: '#6A1B9A', isCore: false },
  { name: 'Agriculture & Nutrition',   periods: 4, color: '#558B2F', isCore: false, doubleCount: 1 },
  { name: 'Creative Arts',             periods: 6, color: '#AD1457', isCore: false },
  { name: 'Pastoral Programme (PPI)',  periods: 1, color: '#6A1B9A', locked: 'friday_last', isCore: false },
]
  },
  jss: {
    label: 'Junior Secondary (Grades 7–9)',
    totalPeriods: 45,
   // REPLACE the jss subjects array:
subjects: [
  { name: 'English',                        periods: 5, color: '#1565C0', isCore: true, daily: true, morning: true },
  { name: 'Mathematics',                    periods: 5, color: '#C0392B', isCore: true, daily: true, morning: true },
  { name: 'Kiswahili / KSL',               periods: 4, color: '#2E7D32', isCore: true, morning: true },
  { name: 'Integrated Science',             periods: 4, color: '#E65100', isCore: false, morning: true, doubleCount: 1 },
  { name: 'Pre-Technical Studies',          periods: 4, color: '#BF360C', isCore: false, doubleCount: 2, doubleMandatory: true },
  { name: 'Social Studies',                 periods: 3, color: '#6A1B9A', isCore: false },
  { name: 'Business Studies',               periods: 3, color: '#37474F', isCore: false },
  { name: 'Agriculture & Nutrition',        periods: 3, color: '#558B2F', isCore: false, doubleCount: 1 },
  { name: 'Religious Education',            periods: 3, color: '#4E342E', isCore: false },
  { name: 'Health Education',               periods: 2, color: '#00838F', isCore: false },
  { name: 'Sports & PE',                    periods: 2, color: '#0277BD', isCore: false, beforeLunch: true },
  { name: 'Life Skills Education',          periods: 1, color: '#00695C', isCore: false },
  { name: 'Computer Science (Optional)',    periods: 3, color: '#1A237E', isCore: false, isOptional: true, doubleCount: 1 },
  { name: 'Home Science (Optional)',        periods: 3, color: '#FF6F00', isCore: false, isOptional: true, doubleCount: 1 },
]
  }
}

export const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: '#C0392B',
  English: '#1565C0',
  'Kiswahili / KSL': '#2E7D32',
  'Integrated Science': '#E65100',
  'Pre-Technical Studies': '#BF360C',
  'Social Studies': '#6A1B9A',
  'Business Studies': '#37474F',
  'Agriculture & Nutrition': '#558B2F',
  'Religious Education': '#4E342E',
  'Health Education': '#00838F',
  'Sports & PE': '#0277BD',
  'Life Skills Education': '#00695C',
  'Computer Science (Optional)': '#1A237E',
  'Home Science (Optional)': '#FF6F00',
}

export function getSubjectColor(name: string): string {
  return SUBJECT_COLORS[name] || '#455A64'
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// i18n strings
export const T = {
  en: {
    appName: 'InstaRatiba',
    tagline: 'CBC-Compliant Timetables in Minutes',
    school: 'School', classes: 'Classes', teachers: 'Teachers', generate: 'Generate',
    signIn: 'Sign In', signOut: 'Sign Out', save: 'Save', loading: 'Loading…',
    offline: 'Offline', online: 'Online',
    schoolSetup: 'School Setup', classesSubjects: 'Classes & Subjects',
    teachersStaff: 'Teachers & Staff', generateTimetable: 'Generate Timetable',
    export: 'Export', print: 'Print', regenerate: 'Regenerate',
    classView: 'Class View', teacherView: 'Teacher View', masterView: 'Master',
    exportPDF: 'Export PDF', exportExcel: 'Export Excel',
    teacherPDF: 'Teacher PDF', streamPDF: 'Stream PDF', masterPDF: 'Master PDF',
    complianceReport: 'MoE Report',
    whatsappShare: 'Share via WhatsApp',
    roomAllocation: 'Room Allocation',
    substituteTeacher: 'Assign Substitute',
    analytics: 'Analytics',
    onlineSaved: 'Synced to cloud ✓',
    offlineSaved: 'Saved offline',
    welcome: 'Welcome back!',
    signInWithGoogle: 'Continue with Google',
  },
  sw: {
    appName: 'InstaRatiba',
    tagline: 'Ratiba ya CBC kwa Dakika Chache',
    school: 'Shule', classes: 'Madarasa', teachers: 'Walimu', generate: 'Tengeneza',
    signIn: 'Ingia', signOut: 'Toka', save: 'Hifadhi', loading: 'Inasubiri…',
    offline: 'Nje ya Mtandao', online: 'Mtandaoni',
    schoolSetup: 'Mpangilio wa Shule', classesSubjects: 'Madarasa & Masomo',
    teachersStaff: 'Walimu & Wafanyakazi', generateTimetable: 'Tengeneza Ratiba',
    export: 'Toa', print: 'Chapisha', regenerate: 'Tengeneza Upya',
    classView: 'Darasa', teacherView: 'Mwalimu', masterView: 'Kuu',
    exportPDF: 'Toa PDF', exportExcel: 'Toa Excel',
    teacherPDF: 'PDF ya Mwalimu', streamPDF: 'PDF ya Darasa', masterPDF: 'PDF Kuu',
    complianceReport: 'Ripoti ya MoE',
    whatsappShare: 'Shiriki WhatsApp',
    roomAllocation: 'Mgao wa Vyumba',
    substituteTeacher: 'Mwalimu Mbadala',
    analytics: 'Takwimu',
    onlineSaved: 'Imehifadhiwa ✓',
    offlineSaved: 'Imehifadhiwa nje ya mtandao',
    welcome: 'Karibu tena!',
    signInWithGoogle: 'Endelea na Google',
  }
}
