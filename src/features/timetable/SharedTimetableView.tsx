// ============================================================
// InstaRatiba — Segment 7
// SharedTimetableView — public read-only timetable viewer
// §5.12 Shareable Read-Only Timetable Link
// Route: /timetable/share/:token  (no auth required)
// ============================================================

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { buildDayLayout, DEFAULT_TIMINGS, gradeToLevel } from '@/lib/cbc/timing'
import { getSubjectByCode } from '@/lib/cbc/subjects'
import { getCellColour, DAY_LABELS, DAYS } from './cellHelpers'
import type { Timetable, TimetableSlot, SchoolClass, Teacher, School } from '@/types'

interface SharedData {
  timetable:  Timetable
  school:     School
  slots:      TimetableSlot[]
  classes:    SchoolClass[]
  teachers:   Teacher[]
}

export default function SharedTimetableView() {
  const { token } = useParams<{ token: string }>()
  const [data,    setData]    = useState<SharedData | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [activeDay, setActiveDay] = useState<string>('monday')

  useEffect(() => {
    if (!token) { setError('Invalid share link'); setLoading(false); return }

    const load = async () => {
      try {
        // Verify token
        const { data: tokenRow, error: tokenErr } = await supabase
          .from('timetable_share_tokens')
          .select('timetable_id, revoked_at')
          .eq('token', token)
          .single()

        if (tokenErr || !tokenRow) { setError('Share link not found'); return }
        if (tokenRow.revoked_at)   { setError('This share link has been revoked'); return }

        const ttId = tokenRow.timetable_id

        // Fetch timetable + school
        const { data: tt } = await supabase.from('timetables').select('*').eq('id', ttId).single()
        if (!tt || tt.status !== 'published') { setError('Timetable is not yet published'); return }

        const { data: school } = await supabase.from('schools').select('*').eq('id', tt.school_id).single()
        const { data: slots }  = await supabase.from('timetable_slots').select('*').eq('timetable_id', ttId)
        const { data: classes } = await supabase.from('classes').select('*').eq('school_id', tt.school_id)
        const { data: teachers } = await supabase.from('teachers').select('*').eq('school_id', tt.school_id)

        const classesArr = (classes ?? []) as SchoolClass[]
        setSelectedClassId(classesArr[0]?.id ?? null)
        setData({
          timetable: tt as Timetable,
          school:    school as School,
          slots:     (slots ?? [])   as TimetableSlot[],
          classes:   classesArr,
          teachers:  (teachers ?? []) as Teacher[],
        })
      } catch {
        setError('Failed to load timetable')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  // ── Loading ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--color-bg]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[--color-accent-light] border-t-[--color-primary] rounded-full animate-spin" />
          <p className="text-sm text-[--color-muted]">Loading timetable…</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--color-bg] px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[rgba(160,31,31,0.10)] flex items-center justify-center mx-auto mb-4">
            <i className="bi bi-link-45deg text-3xl text-[--color-error]" />
          </div>
          <h2 className="text-lg font-bold text-[--color-text]">{error ?? 'Something went wrong'}</h2>
          <p className="text-sm text-[--color-muted] mt-1">
            Check the link or contact the school administrator.
          </p>
        </div>
      </div>
    )
  }

  const { timetable, school, slots, classes, teachers } = data
  const teacherMap = new Map(teachers.map(t => [t.id, t]))
  const sortedClasses = [...classes].sort((a, b) => a.grade !== b.grade ? a.grade - b.grade : a.stream.localeCompare(b.stream))
  const selectedClass = sortedClasses.find(c => c.id === selectedClassId) ?? sortedClasses[0]

  if (!selectedClass) return null

  const level   = gradeToLevel(selectedClass.grade)
  const layout  = buildDayLayout(DEFAULT_TIMINGS[level])
  const slotIdx = new Map<string, TimetableSlot>()
  for (const s of slots) {
    if (s.class_id === selectedClass.id) slotIdx.set(`${s.day}::${s.slot_index}`, s)
  }

  return (
    <div className="min-h-screen bg-[--color-bg]">
      {/* Header */}
      <div className="bg-[--color-primary] text-white px-4 py-4 shadow">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {school.logo_url && (
              <img src={school.logo_url} alt="School logo" className="w-10 h-10 rounded-full object-cover bg-white" />
            )}
            <div>
              <h1 className="font-bold text-base leading-tight">{school.name}</h1>
              <p className="text-xs text-[rgba(200,146,42,0.7)]">
                Term {school.current_term} · {school.academic_year} · {timetable.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-white/20 px-3 py-1.5 rounded-full">
            <i className="bi bi-eye" /> View only
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Class selector */}
        <div>
          <p className="text-xs font-semibold text-[--color-muted] uppercase tracking-wide mb-2">Select Class</p>
          <div className="flex flex-wrap gap-2">
            {sortedClasses.map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={[
                  'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all',
                  selectedClassId === cls.id
                    ? 'bg-[--color-primary] text-white border-[--color-primary]'
                    : 'bg-white text-[--color-text] border-[--color-accent-light] hover:border-[--color-primary]',
                ].join(' ')}
              >
                Grade {cls.grade}{cls.stream}
              </button>
            ))}
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-[--color-accent-light] p-1 w-fit shadow-sm">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={[
                'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                activeDay === day ? 'bg-[--color-primary] text-white' : 'text-[--color-muted] hover:text-[--color-text]',
              ].join(' ')}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>

        {/* Timetable for selected class + day */}
        <motion.div
          key={`${selectedClass.id}-${activeDay}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-[--color-accent-light] shadow-sm overflow-hidden"
        >
          <div className="px-4 py-3 bg-[--color-surface] border-b border-[--color-accent-light]">
            <h2 className="font-bold text-[--color-text]">
              Grade {selectedClass.grade}{selectedClass.stream} · {DAY_LABELS[activeDay]}day
            </h2>
          </div>
          <div className="divide-y divide-[--color-accent-light]">
            {layout.map(layoutSlot => {
              const slot    = slotIdx.get(`${activeDay}::${layoutSlot.slot_index}`)
              const colour  = slot ? getCellColour(slot) : { bg: '#F9FBE7', text: '#827717', border: '#F0F4C3' }
              const teacher = slot?.teacher_id ? teacherMap.get(slot.teacher_id) : null
              const subject = slot?.subject_code ? getSubjectByCode(slot.subject_code) : null

              return (
                <div
                  key={layoutSlot.slot_index}
                  className="flex items-center gap-4 px-4 py-3"
                  style={{ background: colour.bg }}
                >
                  {/* Time */}
                  <div className="w-20 shrink-0 text-[10px] text-[--color-muted]">
                    <div className="font-semibold">{layoutSlot.start_time}</div>
                    <div className="opacity-60">{layoutSlot.end_time}</div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0" style={{ color: colour.text }}>
                    {slot?.is_assembly ? (
                      <p className="font-semibold text-sm">Assembly / Roll Call</p>
                    ) : slot?.is_break ? (
                      <p className="font-semibold text-sm">
                        {layoutSlot.kind === 'lunch' ? 'Lunch Break' : 'Health Break'} · {layoutSlot.duration_min} min
                      </p>
                    ) : slot?.is_non_formal ? (
                      <p className="font-semibold text-sm">Non-Formal Programmes</p>
                    ) : slot?.subject_code ? (
                      <div>
                        <p className="font-semibold text-sm">{subject?.name ?? slot.subject_code}</p>
                        {teacher && (
                          <p className="text-xs opacity-70 mt-0.5">{teacher.name}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm opacity-40">—</p>
                    )}
                  </div>

                  {/* Lesson number tag */}
                  {layoutSlot.kind === 'lesson' && (
                    <div className="shrink-0 text-[10px] font-bold text-[--color-muted] opacity-60">
                      L{layoutSlot.lesson_number}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-[--color-muted] pb-4">
          Powered by <strong>InstaRatiba</strong> · AG Computer Solutions ·
          Published timetable — read only
        </p>
      </div>
    </div>
  )
}
