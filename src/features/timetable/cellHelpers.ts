// ============================================================
// InstaRatiba — Segment 7
// Timetable cell colour map and display helpers
// §9.2 On-screen colour coding (NOT used in PDF export)
// ============================================================

import type { TimetableSlot, SchoolClass, Teacher } from '@/types'
import { getSubjectByCode } from '@/lib/cbc/subjects'

// ── §9.2 Subject group colour map ────────────────────────────

const SUBJECT_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  languages:   { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },
  mathematics: { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
  sciences:    { bg: '#E0F2F1', text: '#00695C', border: '#80CBC4' },
  humanities:  { bg: '#F3E5F5', text: '#6A1B9A', border: '#CE93D8' },
  creative:    { bg: '#FBE9E7', text: '#E65100', border: '#FFAB91' },
  phe:         { bg: '#FFF8E1', text: '#F57F17', border: '#FFE082' },
  practical:   { bg: '#F1F8E9', text: '#558B2F', border: '#C5E1A5' },
  technology:  { bg: '#ECEFF1', text: '#37474F', border: '#B0BEC5' },
  ppi:         { bg: '#FFFDE7', text: '#F9A825', border: '#FFF176' },
  assembly:    { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
  break:       { bg: '#F5F5F5', text: '#9E9E9E', border: '#E0E0E0' },
  non_formal:  { bg: '#EDE7F6', text: '#512DA8', border: '#CE93D8' },
  free:        { bg: '#F9FBE7', text: '#827717', border: '#F0F4C3' },
}

const SIMILARITY_GROUP_COLOUR: Record<string, keyof typeof SUBJECT_COLOURS> = {
  languages:   'languages',
  mathematics: 'mathematics',
  sciences:    'sciences',
  humanities:  'humanities',
  creative:    'creative',
  phe:         'phe',
  practical:   'practical',
  technology:  'technology',
}

export function getCellColour(slot: TimetableSlot): { bg: string; text: string; border: string } {
  if (slot.is_assembly)   return SUBJECT_COLOURS.assembly
  if (slot.is_break)      return SUBJECT_COLOURS.break
  if (slot.is_non_formal) return SUBJECT_COLOURS.non_formal
  if (slot.is_ppi)        return SUBJECT_COLOURS.ppi
  if (!slot.subject_code) return SUBJECT_COLOURS.free

  const subject = getSubjectByCode(slot.subject_code)
  if (!subject?.similarity_group) return SUBJECT_COLOURS.free

  const colourKey = SIMILARITY_GROUP_COLOUR[subject.similarity_group]
  return colourKey ? SUBJECT_COLOURS[colourKey] : SUBJECT_COLOURS.free
}

// ── Label helpers ─────────────────────────────────────────────

export function getCellLabel(slot: TimetableSlot): { top: string; sub: string } {
  if (slot.is_assembly)   return { top: 'Assembly', sub: 'Roll Call' }
  if (slot.is_break)      return { top: 'Break', sub: '' }
  if (slot.is_non_formal) return { top: 'Non-Formal', sub: 'Games / Clubs' }
  if (slot.is_ppi)        return { top: 'PPI', sub: 'Religious' }
  if (!slot.subject_code) return { top: 'Free', sub: '' }

  const subject = getSubjectByCode(slot.subject_code)
  return {
    top: subject?.name ?? slot.subject_code,
    sub: '',
  }
}

/** Short code for tight cells */
export function getSubjectShortCode(code: string): string {
  const map: Record<string, string> = {
    english_lp: 'ENG', english_up: 'ENG', english_jss: 'ENG',
    kiswahili_lp: 'KSW', kiswahili_up: 'KSW', kiswahili_jss: 'KSW',
    maths_lp: 'MTH', maths_up: 'MTH', maths_jss: 'MTH',
    environ_lp: 'ENV', sci_tech: 'SCI', integ_sci: 'SCI',
    social_studies_up: 'SST', social_studies_jss: 'SST',
    rel_ed_lp: 'CRE', rel_ed_up: 'CRE', rel_ethics_jss: 'CRE',
    agri: 'AGR', agri_nutrition: 'AGN',
    creative_arts_lp: 'CRT', creative_arts_up: 'CRT', creative_arts_sports: 'CAS',
    home_sci: 'HOM',
    phe_lp: 'PHE', phe_up: 'PHE',
    ict: 'ICT', cte: 'CTE',
    pre_tech: 'PTV',
    indig_lang: 'IND',
  }
  return map[code] ?? code.slice(0, 3).toUpperCase()
}

export function getClassLabel(cls: SchoolClass): string {
  return `Grade ${cls.grade}${cls.stream}`
}

export function getTeacherInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ── Days ──────────────────────────────────────────────────────

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
export const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri',
}
