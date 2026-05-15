// ============================================================
// InstaRatiba — Segment 6
// PreGenerateReviewPage
// §4.2.9 Screen 7 — Pre-Generate Review
// Validation panel + conflict list + generate CTA
// ============================================================

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSchoolStore }     from '@/store/schoolStore'
import { useTeacherStore }    from '@/store/teacherStore'
import { useAllocationStore } from '@/store/allocationStore'
import { useTimetableStore }  from '@/store/timetableStore'
import { useGenerate }        from './useGenerate'
import type { Conflict }      from '@/types'

// ── Helpers ───────────────────────────────────────────────────

function severityIcon(severity: Conflict['severity'], resolved: boolean) {
  if (resolved) return <i className="bi bi-check-circle-fill text-[--color-primary]" />
  if (severity === 'hard') return <i className="bi bi-x-circle-fill text-[--color-error]" />
  return <i className="bi bi-exclamation-triangle-fill text-[--color-warn]" />
}

function ConflictRow({ conflict }: { conflict: Conflict }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm
        ${conflict.resolved
          ? 'bg-[--color-surface] border-[--color-accent-light] opacity-60'
          : conflict.severity === 'hard'
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}
    >
      <span className="mt-0.5 text-base shrink-0">
        {severityIcon(conflict.severity, conflict.resolved)}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`leading-snug ${conflict.resolved ? 'line-through text-[--color-muted]' : 'text-[--color-text]'}`}>
          {conflict.description}
        </p>
        <span className={`mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full
          ${conflict.severity === 'hard'
            ? 'bg-red-100 text-red-700'
            : 'bg-amber-100 text-amber-700'
          }`}>
          {conflict.severity === 'hard' ? 'Hard — must fix' : 'Warning — review'}
        </span>
      </div>
    </motion.div>
  )
}

// ── Validation section accordion ─────────────────────────────

type Section = {
  key: string
  label: string
  icon: string
  types: Conflict['type'][]
}

const SECTIONS: Section[] = [
  {
    key: 'teachers',
    label: 'Teacher Assignments',
    icon: 'bi-person-badge',
    types: ['no_teacher_assigned', 'teacher_double_booked', 'teacher_near_max_lessons', 'teacher_consecutive_exceeded', 'teacher_gap_large'],
  },
  {
    key: 'lessons',
    label: 'Lesson Counts',
    icon: 'bi-list-ol',
    types: ['lesson_count_wrong', 'unintended_double_lesson'],
  },
  {
    key: 'schedule',
    label: 'Schedule & Timing',
    icon: 'bi-clock',
    types: ['custom_schedule_slots_short', 'creative_arts_not_before_break', 'similar_subjects_consecutive'],
  },
  {
    key: 'rooms',
    label: 'Rooms & Venues',
    icon: 'bi-building',
    types: ['room_double_booked'],
  },
  {
    key: 'balance',
    label: 'Morning / Afternoon Balance',
    icon: 'bi-sun',
    types: ['morning_afternoon_imbalance', 'core_subject_afternoon', 'class_teacher_unassigned'],
  },
]

function ValidationSection({
  section,
  conflicts,
  defaultOpen,
}: {
  section: Section
  conflicts: Conflict[]
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const sectionConflicts = conflicts.filter(c => section.types.includes(c.type))
  const hardCount = sectionConflicts.filter(c => c.severity === 'hard' && !c.resolved).length
  const softCount = sectionConflicts.filter(c => c.severity === 'soft' && !c.resolved).length
  const allClear  = hardCount === 0 && softCount === 0

  return (
    <div className="border border-[--color-accent-light] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[--color-surface] hover:bg-[--color-accent-light]/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <i className={`${section.icon} text-[--color-primary] text-lg`} />
          <span className="font-semibold text-[--color-text] text-sm">{section.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {allClear && (
            <span className="flex items-center gap-1 text-xs font-medium text-[--color-primary]">
              <i className="bi bi-check-lg" /> All clear
            </span>
          )}
          {hardCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              <i className="bi bi-x-circle-fill" /> {hardCount}
            </span>
          )}
          {softCount > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              <i className="bi bi-exclamation-triangle-fill" /> {softCount}
            </span>
          )}
          <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'} text-[--color-muted] ml-1`} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 space-y-2 bg-white">
              {sectionConflicts.length === 0 ? (
                <p className="text-sm text-[--color-muted] italic">No issues in this category.</p>
              ) : (
                sectionConflicts.map(c => <ConflictRow key={c.id} conflict={c} />)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Summary stats card ────────────────────────────────────────

function SummaryCard() {
  const { school, classes, rooms } = useSchoolStore()
  const { teachers } = useTeacherStore()
  const { allocations } = useAllocationStore()
  const totalSubjects = new Set(allocations.map(a => a.subject_code)).size

  const stats = [
    { label: 'School Levels', value: school?.levels.length ?? 0, icon: 'bi-layers' },
    { label: 'Classes',       value: classes.length,             icon: 'bi-people' },
    { label: 'Teachers',      value: teachers.length,            icon: 'bi-person-badge' },
    { label: 'Subject Types', value: totalSubjects,              icon: 'bi-book' },
    { label: 'Rooms / Venues',value: rooms.length,               icon: 'bi-building' },
  ]

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-[--color-text] mb-3">
        <i className="bi bi-clipboard2-data mr-2 text-[--color-primary]" />
        School Summary
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(s => (
          <div key={s.label} className="flex flex-col items-center text-center p-3 rounded-lg bg-[--color-surface]">
            <i className={`${s.icon} text-2xl text-[--color-primary] mb-1`} />
            <span className="text-xl font-bold text-[--color-text]">{s.value}</span>
            <span className="text-xs text-[--color-muted] mt-0.5">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Generation progress overlay ───────────────────────────────

function GeneratingOverlay({ progress }: { progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
    >
      <div className="w-24 h-24 mb-6">
        {/* Spinning ring */}
        <svg className="animate-spin w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#A5D6A7" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke="#2E7D32" strokeWidth="8"
            strokeDasharray="251"
            strokeDashoffset={251 - (251 * progress) / 100}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
      </div>
      <p className="text-xl font-bold text-[--color-primary] mb-1">Generating Timetable…</p>
      <p className="text-sm text-[--color-muted] mb-4">Applying CBC constraints and placing lessons</p>
      <div className="w-64 bg-[--color-accent-light] rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-[--color-primary] rounded-full"
          style={{ width: `${progress}%` }}
          transition={{ type: 'tween', ease: 'linear', duration: 0.3 }}
        />
      </div>
      <p className="mt-2 text-sm font-semibold text-[--color-primary]">{progress}%</p>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────

export default function PreGenerateReviewPage() {
  const navigate = useNavigate()
  const { validate, generate, isValidating, isGenerating, progress, validationResult, canGenerate } = useGenerate()

  // Auto-validate on mount
  useEffect(() => {
    if (!validationResult) validate()
  }, []) // eslint-disable-line

  const allConflicts  = validationResult?.conflicts ?? []
  const hardCount     = validationResult?.hardCount ?? 0
  const softCount     = validationResult?.softCount ?? 0

  const handleGenerate = async () => {
    await generate()
    if (useTimetableStore.getState().slots.length > 0) {
      navigate('/timetable')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {isGenerating && <GeneratingOverlay progress={progress} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[--color-text]">Pre-Generate Review</h1>
        <p className="text-sm text-[--color-muted] mt-1">
          Review all constraints before generating the timetable. All hard conflicts must be resolved.
        </p>
      </div>

      {/* School summary */}
      <SummaryCard />

      {/* Conflict summary bar */}
      <div className={`flex items-center justify-between px-5 py-4 rounded-xl border-2 
        ${hardCount > 0 ? 'bg-red-50 border-red-300' : 'bg-green-50 border-[--color-primary]'}`}
      >
        <div className="flex items-center gap-3">
          {hardCount > 0
            ? <i className="bi bi-x-octagon-fill text-[--color-error] text-2xl" />
            : <i className="bi bi-check-circle-fill text-[--color-primary] text-2xl" />
          }
          <div>
            <p className="font-bold text-[--color-text]">
              {hardCount > 0
                ? `${hardCount} hard conflict${hardCount > 1 ? 's' : ''} remaining`
                : 'Ready to generate'
              }
            </p>
            <p className="text-xs text-[--color-muted]">
              {softCount > 0 ? `${softCount} warning(s) — can proceed` : 'No warnings'}
            </p>
          </div>
        </div>
        <button
          onClick={validate}
          disabled={isValidating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[--color-primary] text-[--color-primary] text-sm font-semibold hover:bg-[--color-surface] transition-colors disabled:opacity-50"
        >
          {isValidating
            ? <><i className="bi bi-arrow-repeat animate-spin" /> Checking…</>
            : <><i className="bi bi-arrow-clockwise" /> Re-validate</>
          }
        </button>
      </div>

      {/* Validation sections */}
      {isValidating ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 rounded-xl bg-[--color-surface] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {SECTIONS.map((section, i) => (
            <ValidationSection
              key={section.key}
              section={section}
              conflicts={allConflicts}
              defaultOpen={i === 0 || allConflicts.some(c => section.types.includes(c.type) && c.severity === 'hard')}
            />
          ))}
        </div>
      )}

      {/* Navigation + Generate */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={() => navigate('/allocation')}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[--color-accent-light] text-[--color-text] text-sm font-semibold hover:bg-[--color-surface] transition-colors"
        >
          <i className="bi bi-arrow-left" /> Back to Allocation
        </button>

        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating || isValidating}
          className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-white font-bold text-base transition-all
            ${canGenerate && !isGenerating
              ? 'bg-[--color-primary] hover:bg-[--color-mid] shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]'
              : 'bg-[--color-muted] cursor-not-allowed opacity-60'
            }`}
        >
          <i className="bi bi-lightning-fill text-lg" />
          {isGenerating ? 'Generating…' : 'Generate Timetable'}
          {canGenerate && !isGenerating && (
            <i className="bi bi-arrow-right" />
          )}
        </button>
      </div>

      {!canGenerate && hardCount > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-[--color-error]"
        >
          <i className="bi bi-lock-fill mr-1" />
          Resolve all {hardCount} hard conflict{hardCount > 1 ? 's' : ''} to unlock generation
        </motion.p>
      )}
    </div>
  )
}
