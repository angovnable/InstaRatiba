// ============================================================
// InstaRatiba — Segment 5
// Screen 5: Lesson Allocation & Subject-Teacher Assignment
// §4.2.7 Amendment 3 — editable lesson counts, teacher chips,
// double-lesson toggles, morning-priority indicators,
// deviation warnings, real-time total validation
// ============================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { v4 as uuid } from 'uuid'
import { useSchoolStore } from '@/store/schoolStore'
import { useAuthStore }   from '@/store/authStore'
import { useTeacherStore }    from '@/store/teacherStore'
import { useAllocationStore } from '@/store/allocationStore'
import {
  fetchTeachers, fetchAllTeacherSubjects,
  fetchAllocations, bulkUpsertAllocations,
} from '@/lib/supabase/teachers'
import { fetchClasses } from '@/lib/supabase/classes'
import {
  CBC_SUBJECTS_BY_LEVEL,
  ALWAYS_MORNING_CODES,
  PREFERRED_MORNING_CODES,
  DOUBLE_LESSON_CODES,
} from '@/lib/cbc/subjects'
import type {
  SchoolClass, SubjectAllocation, Teacher, TeacherSubject,
  SchoolLevel, CbcSubject,
} from '@/types'
import { Button, Card, CardHeader, CardBody, Badge, Modal, SkeletonLoader } from '@/components/ui'
import { WizardLayout } from '@/components/layout'

// ── Helpers ──────────────────────────────────────────────────

const GRADE_LEVEL: Record<number, SchoolLevel> = {
  1: 'lower_primary', 2: 'lower_primary', 3: 'lower_primary',
  4: 'upper_primary', 5: 'upper_primary', 6: 'upper_primary',
  7: 'junior_secondary', 8: 'junior_secondary', 9: 'junior_secondary',
}

const LEVEL_MAX_LESSONS: Record<SchoolLevel, number> = {
  lower_primary:    31,
  upper_primary:    40,
  junior_secondary: 40,
}

const LEVEL_LABELS: Record<SchoolLevel, string> = {
  lower_primary:    'Lower Primary',
  upper_primary:    'Upper Primary',
  junior_secondary: 'Junior Secondary',
}

const LEVEL_TAB_COLOUR: Record<SchoolLevel, string> = {
  lower_primary:    'bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]',
  upper_primary:    'bg-[#E3F2FD] text-[#1565C0] border-[#90CAF9]',
  junior_secondary: 'bg-[#EDE7F6] text-[#512DA8] border-[#CE93D8]',
}

function morningIcon(code: string): { icon: string; colour: string; tip: string } | null {
  if (ALWAYS_MORNING_CODES.has(code))
    return { icon: 'bi-sunrise-fill', colour: 'text-amber-500', tip: 'Always schedule in morning (Slots 1–4)' }
  if (PREFERRED_MORNING_CODES.has(code))
    return { icon: 'bi-sunrise', colour: 'text-amber-400', tip: 'Preferably schedule in morning (Slots 1–5)' }
  return null
}

function classLabel(sc: SchoolClass) {
  return `Grade ${sc.grade}${sc.stream}`
}

// Build default allocations for a class from CBC catalogue
function buildDefaultAllocations(
  sc: SchoolClass,
  schoolId: string,
): SubjectAllocation[] {
  const level = GRADE_LEVEL[sc.grade]
  const subjects = CBC_SUBJECTS_BY_LEVEL[level] ?? []
  return subjects.map(s => ({
    id:               uuid(),
    school_id:        schoolId,
    class_id:         sc.id,
    subject_code:     s.code,
    lessons_per_week: s.lessons_per_week,
    requires_double:  s.requires_double,
    teacher_id:       undefined,
  }))
}

// ── PlacementGuideModal ───────────────────────────────────────
function PlacementGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Lesson Placement Guide" size="lg"
      footer={<div className="flex justify-end"><Button size="sm" onClick={onClose}>Got it</Button></div>}
    >
      <div className="space-y-5 text-sm text-[--color-text]">
        {/* Morning priority */}
        <div>
          <h3 className="font-semibold text-[--color-primary] flex items-center gap-2 mb-2">
            <i className="bi bi-sunrise-fill text-amber-500" /> Morning Priority Subjects
          </h3>
          <div className="rounded-xl border border-[--color-accent-light] overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[--color-surface]">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-[--color-muted]">Priority</th>
                  <th className="text-left px-3 py-2 font-semibold text-[--color-muted]">Subjects</th>
                  <th className="text-left px-3 py-2 font-semibold text-[--color-muted]">Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--color-surface]">
                <tr>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1 text-amber-600 font-semibold">
                      <i className="bi bi-sunrise-fill" /> Always Morning
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[--color-text]">Mathematics, English, Integrated Science / Science & Technology</td>
                  <td className="px-3 py-2 text-[--color-muted]">Slots 1–4 only. Warning shown if placed after Slot 4.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <i className="bi bi-sunrise" /> Preferred Morning
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[--color-text]">Kiswahili / KSL, Social Studies</td>
                  <td className="px-3 py-2 text-[--color-muted]">Advisory warning only — no block.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-[--color-muted]">Flexible</td>
                  <td className="px-3 py-2 text-[--color-muted]">Creative Arts, PHE, Agriculture, Home Science, Religious Education, ICT, CTE</td>
                  <td className="px-3 py-2 text-[--color-muted]">No constraint.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Double lessons */}
        <div>
          <h3 className="font-semibold text-[--color-primary] flex items-center gap-2 mb-2">
            <i className="bi bi-layers-fill" /> Double Lesson Requirements
          </h3>
          <div className="rounded-xl border border-[--color-accent-light] overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-[--color-surface]">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-[--color-muted]">Level</th>
                  <th className="text-left px-3 py-2 font-semibold text-[--color-muted]">Subjects</th>
                  <th className="text-left px-3 py-2 font-semibold text-[--color-muted]">Placement Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[--color-surface]">
                <tr>
                  <td className="px-3 py-2 font-medium text-[#2E7D32]">Lower Primary</td>
                  <td className="px-3 py-2">Creative Arts & Craft</td>
                  <td className="px-3 py-2 text-[--color-muted]">Immediately before Break 1 or Break 2</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-[#1565C0]">Upper Primary</td>
                  <td className="px-3 py-2">Creative Arts; Home Science / Craft</td>
                  <td className="px-3 py-2 text-[--color-muted]">Immediately before a break slot</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-[#512DA8]">Junior Secondary</td>
                  <td className="px-3 py-2">Pre-Technical; Agriculture & Nutrition; Creative Arts & Sports</td>
                  <td className="px-3 py-2 text-[--color-muted]">Immediately before Break 2 or Lunch where possible</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-[--color-muted]">
            Double lessons count as 2 toward the weekly total and must be placed in consecutive slots.
          </p>
        </div>
      </div>
    </Modal>
  )
}

// ── AllocationRow ─────────────────────────────────────────────
// One row per subject per class
interface AllocationRowProps {
  alloc: SubjectAllocation
  subject: CbcSubject
  eligibleTeachers: Teacher[]
  moeDefault: number
  onChange: (updated: SubjectAllocation) => void
}

function AllocationRow({ alloc, subject, eligibleTeachers, moeDefault, onChange }: AllocationRowProps) {
  const morning = morningIcon(subject.code)
  const deviation = alloc.lessons_per_week - moeDefault
  const isPpi = subject.is_ppi

  const assignedTeacher = eligibleTeachers.find(t => t.id === alloc.teacher_id)

  const handleLessonsChange = (delta: number) => {
    const next = Math.max(1, Math.min(10, alloc.lessons_per_week + delta))
    onChange({ ...alloc, lessons_per_week: next })
  }

  const handleTeacherChange = (teacherId: string) => {
    onChange({ ...alloc, teacher_id: teacherId || undefined })
  }

  const handleDoubleToggle = () => {
    onChange({ ...alloc, requires_double: !alloc.requires_double })
  }

  return (
    <tr className="border-b border-[--color-surface] last:border-0 hover:bg-[#fafcfb] transition-colors group">
      {/* Subject name */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-[--color-text]">{subject.name}</span>
          {morning && (
            <span title={morning.tip}>
              <i className={`${morning.icon} ${morning.colour} text-[11px]`} />
            </span>
          )}
          {subject.requires_double && (
            <span title="Requires double lesson (MoE default)">
              <i className="bi bi-layers-fill text-[#512DA8] text-[10px]" />
            </span>
          )}
          {isPpi && (
            <span className="text-[9px] px-1.5 py-px rounded-full bg-[#FFF8E1] text-amber-700 font-semibold">PPI</span>
          )}
        </div>
      </td>

      {/* Lessons/week stepper */}
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-1.5 justify-center">
          <button
            onClick={() => handleLessonsChange(-1)}
            disabled={isPpi}
            className="w-5 h-5 rounded border border-[--color-accent-light] text-[--color-muted] flex items-center justify-center hover:border-[--color-primary] hover:text-[--color-primary] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <i className="bi bi-dash text-[10px]" />
          </button>
          <span className={`text-sm font-bold w-5 text-center ${
            deviation > 0 ? 'text-[--color-warn]' : deviation < 0 ? 'text-[--color-error]' : 'text-[--color-text]'
          }`}>
            {alloc.lessons_per_week}
          </span>
          <button
            onClick={() => handleLessonsChange(1)}
            disabled={isPpi}
            className="w-5 h-5 rounded border border-[--color-accent-light] text-[--color-muted] flex items-center justify-center hover:border-[--color-primary] hover:text-[--color-primary] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <i className="bi bi-plus text-[10px]" />
          </button>
          {/* Deviation badge */}
          {deviation !== 0 && (
            <span className={`text-[9px] px-1 py-px rounded font-semibold ${
              deviation > 0
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {deviation > 0 ? `+${deviation}` : deviation}
            </span>
          )}
        </div>
      </td>

      {/* Double lesson toggle */}
      <td className="px-2 py-2.5 text-center">
        <button
          onClick={handleDoubleToggle}
          title={alloc.requires_double ? 'Double lesson required (click to remove)' : 'Toggle double lesson'}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
            alloc.requires_double
              ? 'bg-[#EDE7F6] border-[#CE93D8] text-[#512DA8]'
              : 'bg-white border-[--color-accent-light] text-[--color-muted] hover:border-[#CE93D8]'
          }`}
        >
          <i className="bi bi-layers-fill text-[9px]" />
          {alloc.requires_double ? 'Yes' : 'No'}
        </button>
      </td>

      {/* Teacher assignment */}
      <td className="px-2 py-2.5">
        <div className="flex flex-col gap-1 min-w-[140px]">
          <select
            value={alloc.teacher_id ?? ''}
            onChange={e => handleTeacherChange(e.target.value)}
            className={`text-xs rounded-lg border px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[--color-primary] transition-colors ${
              !alloc.teacher_id
                ? 'border-[--color-warn] bg-amber-50 text-amber-800'
                : 'border-[--color-accent-light] bg-white text-[--color-text]'
            }`}
          >
            <option value="">— Assign teacher —</option>
            {eligibleTeachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {assignedTeacher && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[--color-muted]">
              <i className="bi bi-person-fill text-[--color-primary]" />
              {assignedTeacher.name}
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── ClassAllocationCard ───────────────────────────────────────
interface ClassAllocationCardProps {
  schoolClass: SchoolClass
  allocations: SubjectAllocation[]
  allTeachers: Teacher[]
  allTeacherSubjects: TeacherSubject[]
  onAllocChange: (updated: SubjectAllocation) => void
  expanded: boolean
  onToggleExpand: () => void
}

function ClassAllocationCard({
  schoolClass, allocations, allTeachers, allTeacherSubjects,
  onAllocChange, expanded, onToggleExpand,
}: ClassAllocationCardProps) {
  const level = GRADE_LEVEL[schoolClass.grade]
  const subjects = CBC_SUBJECTS_BY_LEVEL[level] ?? []
  const maxLessons = LEVEL_MAX_LESSONS[level]

  const totalLessons = allocations.reduce((s, a) => s + a.lessons_per_week, 0)
  const overMax = totalLessons > maxLessons
  const unassigned = allocations.filter(a => !a.teacher_id).length

  const BADGE = LEVEL_TAB_COLOUR[level]

  return (
    <div className="bg-white rounded-2xl border border-[--color-accent-light] shadow-sm overflow-hidden">
      {/* Card header — clickable to expand */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[--color-surface] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${BADGE}`}>
            Grade {schoolClass.grade}{schoolClass.stream}
          </span>
          <span className="text-xs text-[--color-muted]">{LEVEL_LABELS[level]}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Total lessons badge */}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
            overMax
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-[--color-surface] text-[--color-muted] border-[--color-accent-light]'
          }`}>
            {totalLessons}/{maxLessons} lessons
          </span>
          {/* Unassigned badge */}
          {unassigned > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {unassigned} unassigned
            </span>
          )}
          {unassigned === 0 && (
            <span className="text-[11px] text-[--color-primary] flex items-center gap-1">
              <i className="bi bi-check-circle-fill" /> All assigned
            </span>
          )}
          <i className={`bi bi-chevron-${expanded ? 'up' : 'down'} text-[--color-muted] text-sm transition-transform`} />
        </div>
      </button>

      {/* Expanded allocation table */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="table"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-[--color-accent-light] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[--color-surface] border-b border-[--color-accent-light]">
                    <th className="text-left px-3 py-2 text-[10px] font-semibold text-[--color-muted] uppercase tracking-wider w-[40%]">Subject</th>
                    <th className="text-center px-2 py-2 text-[10px] font-semibold text-[--color-muted] uppercase tracking-wider w-[15%]">Lessons/wk</th>
                    <th className="text-center px-2 py-2 text-[10px] font-semibold text-[--color-muted] uppercase tracking-wider w-[12%]">Double</th>
                    <th className="text-left px-2 py-2 text-[10px] font-semibold text-[--color-muted] uppercase tracking-wider">Teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(subject => {
                    const alloc = allocations.find(a => a.subject_code === subject.code)
                    if (!alloc) return null

                    // Teachers who can teach this subject at this grade
                    const eligible = allTeachers.filter(t => {
                      const ts = allTeacherSubjects.find(
                        x => x.teacher_id === t.id && x.subject_code === subject.code
                      )
                      return ts && ts.grades.includes(schoolClass.grade)
                    })

                    return (
                      <AllocationRow
                        key={subject.code}
                        alloc={alloc}
                        subject={subject}
                        eligibleTeachers={eligible}
                        moeDefault={subject.lessons_per_week}
                        onChange={onAllocChange}
                      />
                    )
                  })}
                </tbody>
                {/* Total row */}
                <tfoot>
                  <tr className={`border-t-2 ${overMax ? 'border-[--color-error]' : 'border-[--color-accent-light]'}`}>
                    <td className="px-3 py-2 text-xs font-bold text-[--color-text]">Total</td>
                    <td className={`px-2 py-2 text-center text-sm font-bold ${overMax ? 'text-[--color-error]' : 'text-[--color-primary]'}`}>
                      {totalLessons}
                    </td>
                    <td />
                    <td className="px-2 py-2">
                      {overMax && (
                        <span className="text-[11px] text-[--color-error] flex items-center gap-1">
                          <i className="bi bi-exclamation-circle-fill" />
                          Exceeds {maxLessons} max ({overMax ? totalLessons - maxLessons : 0} over)
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── AllocationPage ────────────────────────────────────────────
export default function AllocationPage() {
  const navigate = useNavigate()
  const { school } = useSchoolStore()
  const { user }   = useAuthStore()
  const {
    teachers, teacherSubjects,
    setTeachers, setTeacherSubjects,
  } = useTeacherStore()
  const {
    allocations, isDirty,
    setAllocations, upsertAllocation, bulkSetAllocations, markClean, setLoading, isLoading,
    getAllocationsForClass, getTotalLessonsForClass, hasUnassignedTeachers,
  } = useAllocationStore()

  const schoolId = school?.id ?? ''
  const schoolLevels: SchoolLevel[] = school?.levels ?? []

  const [classes, setClasses]             = useState<SchoolClass[]>([])
  const [expandedClasses, setExpanded]    = useState<Set<string>>(new Set())
  const [activeLevel, setActiveLevel]     = useState<SchoolLevel | 'all'>('all')
  const [guideOpen, setGuideOpen]         = useState(false)
  const [saving, setSaving]               = useState(false)
  const [resetting, setResetting]         = useState(false)
  const [resetConfirmOpen, setResetConfirm] = useState(false)

  // Load everything on mount
  useEffect(() => {
    if (!schoolId) return
    setLoading(true)

    Promise.all([
      fetchClasses(schoolId),
      fetchTeachers(schoolId),
      fetchAllTeacherSubjects(schoolId),
      fetchAllocations(schoolId),
    ]).then(([cls, tch, subs, allocs]) => {
      setClasses(cls)
      setTeachers(tch)
      setTeacherSubjects(subs)

      // Seed defaults for any class with no existing allocations
      const existingClassIds = new Set(allocs.map(a => a.class_id))
      const seedAllocations = cls
        .filter(c => !existingClassIds.has(c.id))
        .flatMap(c => buildDefaultAllocations(c, schoolId))

      setAllocations([...allocs, ...seedAllocations])

      // Expand first class by default
      if (cls.length > 0) setExpanded(new Set([cls[0].id]))
    }).catch(err => {
      toast.error('Failed to load data: ' + err.message)
    }).finally(() => setLoading(false))
  }, [schoolId]) // eslint-disable-line

  const toggleExpand = useCallback((classId: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(classId) ? next.delete(classId) : next.add(classId)
      return next
    })
  }, [])

  const expandAll  = () => setExpanded(new Set(classes.map(c => c.id)))
  const collapseAll = () => setExpanded(new Set())

  const handleAllocChange = useCallback((updated: SubjectAllocation) => {
    upsertAllocation(updated)
  }, [upsertAllocation])

  const handleSave = async () => {
    if (!schoolId) return
    setSaving(true)
    try {
      await bulkUpsertAllocations(allocations)
      markClean()
      toast.success('Allocations saved')
    } catch (err: any) {
      toast.error('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleResetDefaults = () => {
    const defaultAllocs = classes.flatMap(c => buildDefaultAllocations(c, schoolId))
    bulkSetAllocations(defaultAllocs)
    setResetConfirm(false)
    toast.success('Reset to MoE defaults')
  }

  // Filtered classes by active level tab
  const visibleClasses = useMemo(() => {
    if (activeLevel === 'all') return classes
    return classes.filter(c => GRADE_LEVEL[c.grade] === activeLevel)
  }, [classes, activeLevel])

  // Summary stats
  const totalUnassigned = useMemo(() =>
    classes.filter(c => hasUnassignedTeachers(c.id)).length,
    [classes, allocations] // eslint-disable-line
  )
  const totalOverMax = useMemo(() =>
    classes.filter(c => {
      const level = GRADE_LEVEL[c.grade]
      return getTotalLessonsForClass(c.id) > LEVEL_MAX_LESSONS[level]
    }).length,
    [classes, allocations] // eslint-disable-line
  )

  const canProceed = totalUnassigned === 0 && totalOverMax === 0

  return (
    <WizardLayout
      title="Lesson Allocation"
      subtitle="Review and adjust weekly lesson counts, assign teachers to each subject per class"
    >
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            icon="bi-arrow-left"
            onClick={() => navigate('/teachers')}
          >
            Back
          </Button>
          <button
            onClick={() => setGuideOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[--color-info] bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <i className="bi bi-question-circle" /> Placement Guide
          </button>
          <button
            onClick={() => setResetConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[--color-muted] bg-[--color-surface] border border-[--color-accent-light] hover:bg-[#e8f5e9] transition-colors"
          >
            <i className="bi bi-arrow-counterclockwise" /> Reset Defaults
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={expandAll} className="text-xs text-[--color-muted] hover:text-[--color-primary] transition-colors">
            Expand all
          </button>
          <span className="text-[--color-accent-light]">·</span>
          <button onClick={collapseAll} className="text-xs text-[--color-muted] hover:text-[--color-primary] transition-colors">
            Collapse all
          </button>
          {isDirty && (
            <Button size="sm" loading={saving} onClick={handleSave} icon="bi-cloud-arrow-up">
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Validation banners */}
      <AnimatePresence>
        {totalOverMax > 0 && (
          <motion.div
            key="over-max"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3 rounded-xl border border-[--color-error] bg-red-50 flex items-start gap-3"
          >
            <i className="bi bi-x-circle-fill text-[--color-error] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {totalOverMax} class{totalOverMax !== 1 ? 'es' : ''} exceed maximum lessons/week
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                Reduce lesson counts — this will block timetable generation.
              </p>
            </div>
          </motion.div>
        )}
        {totalUnassigned > 0 && (
          <motion.div
            key="unassigned"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3 rounded-xl border border-[--color-warn] bg-amber-50 flex items-start gap-3"
          >
            <i className="bi bi-exclamation-triangle-fill text-[--color-warn] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {totalUnassigned} class{totalUnassigned !== 1 ? 'es have' : ' has'} unassigned subjects
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Every subject must have a teacher before generation.
              </p>
            </div>
          </motion.div>
        )}
        {canProceed && classes.length > 0 && (
          <motion.div
            key="all-good"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3 rounded-xl border border-[--color-primary] bg-[--color-surface] flex items-center gap-3"
          >
            <i className="bi bi-check-circle-fill text-[--color-primary] shrink-0" />
            <p className="text-sm font-semibold text-[--color-primary]">
              All subjects assigned — ready to proceed to Review.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level tabs */}
      {schoolLevels.length > 1 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setActiveLevel('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeLevel === 'all'
                ? 'bg-[--color-primary] text-white border-[--color-primary]'
                : 'bg-white text-[--color-muted] border-[--color-accent-light] hover:border-[--color-primary]'
            }`}
          >
            All Levels
          </button>
          {schoolLevels.map(level => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeLevel === level
                  ? LEVEL_TAB_COLOUR[level].replace('bg-', 'bg-').replace('text-', 'text-') + ' border-current'
                  : 'bg-white text-[--color-muted] border-[--color-accent-light] hover:border-[--color-primary]'
              }`}
            >
              {LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
      )}

      {/* Class cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <SkeletonLoader key={i} className="h-14 rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {visibleClasses.map(sc => (
              <motion.div
                key={sc.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <ClassAllocationCard
                  schoolClass={sc}
                  allocations={getAllocationsForClass(sc.id)}
                  allTeachers={teachers}
                  allTeacherSubjects={teacherSubjects}
                  onAllocChange={handleAllocChange}
                  expanded={expandedClasses.has(sc.id)}
                  onToggleExpand={() => toggleExpand(sc.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {visibleClasses.length === 0 && (
            <div className="text-center py-12 text-[--color-muted] text-sm">
              <i className="bi bi-grid-3x3 text-3xl block mb-2 opacity-30" />
              No classes found for this level. Add classes in the Class Manager.
            </div>
          )}
        </div>
      )}

      {/* Bottom nav */}
      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" icon="bi-arrow-left" onClick={() => navigate('/teachers')}>
          Back to Teachers
        </Button>
        <div className="flex items-center gap-3">
          {isDirty && (
            <Button variant="secondary" loading={saving} onClick={handleSave} icon="bi-cloud-arrow-up">
              Save Changes
            </Button>
          )}
          <Button
            icon="bi-arrow-right"
            iconPosition="right"
            disabled={!canProceed}
            onClick={async () => {
              if (isDirty) {
                await handleSave()
              }
              navigate('/review')
            }}
          >
            Next: Review
          </Button>
        </div>
      </div>

      {/* Modals */}
      <PlacementGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />

      <Modal
        open={resetConfirmOpen}
        onClose={() => setResetConfirm(false)}
        title="Reset to MoE Defaults"
        size="sm"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setResetConfirm(false)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleResetDefaults} icon="bi-arrow-counterclockwise">
              Reset
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[--color-text]">
          This will restore all lesson counts to the MoE-mandated defaults and clear all teacher assignments.
        </p>
        <p className="mt-2 text-xs text-[--color-muted]">This action cannot be undone.</p>
      </Modal>
    </WizardLayout>
  )
}
