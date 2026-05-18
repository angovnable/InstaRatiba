// ============================================================
// InstaRatiba — Segment 7
// Timetable cell colour map and display helpers
// §9.2 On-screen colour coding (NOT used in PDF export)
// ============================================================

import type { TimetableSlot, SchoolClass } from '@/types'
import { getSubjectByCode } from '@/lib/cbc/subjects'

// ── §9.2 Subject group colour map ────────────────────────────

// ── New Kenyan palette — semantic category colours ─────────────
const SUBJECT_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  languages:   { bg: 'rgba(30,92,138,0.09)',   text: '#1E5C8A', border: 'rgba(30,92,138,0.2)'   }, // Indian Ocean
  mathematics: { bg: 'rgba(13,61,35,0.09)',    text: '#0D3D23', border: 'rgba(13,61,35,0.2)'    }, // Mau Forest
  sciences:    { bg: 'rgba(13,61,35,0.07)',    text: '#1A5C3A', border: 'rgba(13,61,35,0.15)'   }, // Mau Forest lighter
  humanities:  { bg: 'rgba(200,146,42,0.10)',  text: '#9B6E1A', border: 'rgba(200,146,42,0.22)' }, // Savanna Gold
  creative:    { bg: 'rgba(160,31,31,0.08)',   text: '#A01F1F', border: 'rgba(160,31,31,0.18)'  }, // Rift Red
  phe:         { bg: 'rgba(200,146,42,0.07)',  text: '#B07A22', border: 'rgba(200,146,42,0.15)' }, // gold lighter
  practical:   { bg: 'rgba(13,61,35,0.06)',    text: '#2A5C3F', border: 'rgba(13,61,35,0.12)'   }, // forest lighter
  technology:  { bg: 'rgba(30,92,138,0.07)',   text: '#2A5F82', border: 'rgba(30,92,138,0.15)'  }, // ocean lighter
  ppi:         { bg: 'rgba(200,146,42,0.09)',  text: '#9B6E1A', border: 'rgba(200,146,42,0.2)'  }, // gold — PPI/Religious
  assembly:    { bg: 'rgba(13,61,35,0.08)',    text: '#0D3D23', border: 'rgba(13,61,35,0.18)'   }, // forest
  break:       { bg: 'rgba(200,146,42,0.08)',  text: '#9B6E1A', border: 'rgba(200,146,42,0.18)' }, // gold — break
  non_formal:  { bg: 'rgba(200,146,42,0.06)',  text: '#9B6E1A', border: 'rgba(200,146,42,0.15)' }, // gold lighter
  free:        { bg: '#F7F5EF',                text: '#7A8C82', border: '#EDE7D9'                }, // ivory
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
