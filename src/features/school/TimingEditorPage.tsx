// ============================================================
// InstaRatiba — Segment 3
// Screen 2b: Timing Editor — per-level timing configuration
// §4.2.4, Amendment 4, Amendment C
// ============================================================

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useSchoolStore } from '@/store/schoolStore'
import type { SchoolLevel, LevelTiming } from '@/types'
import { Button, Card, Badge } from '@/components/ui'
import { WizardLayout } from '@/components/layout'

// ── CBC mandatory weekly lessons per level ─────────────────
const REQUIRED_LESSONS: Record<SchoolLevel, number> = {
  lower_primary:    31,
  upper_primary:    40,
  junior_secondary: 40,
}

const LEVEL_LABELS: Record<SchoolLevel, { label: string; icon: string; grades: string }> = {
  lower_primary:    { label: 'Lower Primary', icon: 'bi-1-circle', grades: 'Grade 1–3' },
  upper_primary:    { label: 'Upper Primary', icon: 'bi-4-circle', grades: 'Grade 4–6' },
  junior_secondary: { label: 'Junior Secondary', icon: 'bi-7-circle', grades: 'Grade 7–9' },
}

// ── Time maths helpers ──────────────────────────────────────

/** Parse "HH:MM" → total minutes since midnight */
function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Format minutes-since-midnight → "HH:MM" */
function formatTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Format to 12-hour display */
function fmt12(t: string): string {
  const mins = parseTime(t)
  const h    = Math.floor(mins / 60)
  const m    = mins % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr   = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`
}

interface SlotInfo {
  index: number
  type: 'assembly' | 'lesson' | 'break' | 'lunch' | 'non_formal'
  label: string
  start: string
  end: string
  durationMin: number
}

/** Build the visual timeline from a LevelTiming config */
function buildTimeline(t: LevelTiming): SlotInfo[] {
  const slots: SlotInfo[] = []
  let cursor = parseTime('08:00')

  // Assembly
  slots.push({ index: -1, type: 'assembly', label: 'Assembly & Roll Call', start: formatTime(cursor), end: formatTime(cursor + 20), durationMin: 20 })
  cursor += 20

  let lessonNum = 0
  const totalLessons = REQUIRED_LESSONS[t.level]
  const lessonsPerDay = Math.ceil(totalLessons / 5)

  for (let i = 0; i < lessonsPerDay; i++) {
    lessonNum++
    const end = cursor + t.lesson_duration_min
    slots.push({
      index: lessonNum, type: 'lesson',
      label: `Lesson ${lessonNum}`, start: formatTime(cursor), end: formatTime(end), durationMin: t.lesson_duration_min,
    })
    cursor = end

    // Breaks
    if (lessonNum === t.break1_after_lesson) {
      slots.push({ index: -1, type: 'break', label: `Health Break 1 (${t.break1_duration_min} min)`, start: formatTime(cursor), end: formatTime(cursor + t.break1_duration_min), durationMin: t.break1_duration_min })
      cursor += t.break1_duration_min
    }
    if (lessonNum === t.break2_after_lesson) {
      slots.push({ index: -1, type: 'break', label: `Health Break 2 (${t.break2_duration_min} min)`, start: formatTime(cursor), end: formatTime(cursor + t.break2_duration_min), durationMin: t.break2_duration_min })
      cursor += t.break2_duration_min
    }
    if (t.lunch_enabled && t.lunch_after_lesson && lessonNum === t.lunch_after_lesson) {
      const dur = t.lunch_duration_min ?? 60
      slots.push({ index: -1, type: 'lunch', label: `Lunch Break (${dur} min)`, start: formatTime(cursor), end: formatTime(cursor + dur), durationMin: dur })
      cursor += dur
    }
  }

  // Non-formal
  if (t.non_formal_start) {
    const dur = t.non_formal_end ? parseTime(t.non_formal_end) - parseTime(t.non_formal_start) : 60
    slots.push({ index: -1, type: 'non_formal', label: 'Non-Formal Programmes', start: t.non_formal_start, end: t.non_formal_end ?? formatTime(parseTime(t.non_formal_start) + dur), durationMin: dur })
  }

  return slots
}

/** Count available lesson slots in a day */
function countDailyLessonSlots(t: LevelTiming): number {
  // Simple: count how many lessons fit in the day before 6 PM
  let cursor = parseTime('08:20')
  const endOfDay = parseTime('18:00')
  let count = 0
  let lessonNum = 0

  while (cursor + t.lesson_duration_min <= endOfDay) {
    lessonNum++
    count++
    cursor += t.lesson_duration_min

    if (lessonNum === t.break1_after_lesson) cursor += t.break1_duration_min
    if (lessonNum === t.break2_after_lesson) cursor += t.break2_duration_min
    if (t.lunch_enabled && t.lunch_after_lesson && lessonNum === t.lunch_after_lesson)
      cursor += (t.lunch_duration_min ?? 60)
    if (count >= 12) break // safety
  }
  return count
}

// ── Slot colour coding ─────────────────────────────────────
const SLOT_COLOURS: Record<SlotInfo['type'], string> = {
  assembly:   'bg-[#F7F5EF] border-[#EDE7D9] text-[#0D3D23]',
  lesson:     'bg-white border-[--color-accent-light] text-[--color-text]',
  break:      'bg-[#ECEFF1] border-[#B0BEC5] text-[#546E7A]',
  lunch:      'bg-[#FFF8E1] border-[#FFE082] text-[#F57F17]',
  non_formal: 'bg-[#F3E5F5] border-[#CE93D8] text-[#6A1B9A]',
}

// ── Number input helper ─────────────────────────────────────
function NumberStepper({ label, value, min, max, step = 5, unit = 'min', onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[--color-text]">{label}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(min, value - step))}
                className="w-7 h-7 rounded-full border border-[--color-accent-light] flex items-center justify-center hover:bg-[--color-surface] text-sm font-bold">−</button>
        <span className="w-16 text-center text-sm font-semibold">
          {value} {unit}
        </span>
        <button onClick={() => onChange(Math.min(max, value + step))}
                className="w-7 h-7 rounded-full border border-[--color-accent-light] flex items-center justify-center hover:bg-[--color-surface] text-sm font-bold">+</button>
      </div>
    </div>
  )
}

// ── Time input ──────────────────────────────────────────────
function TimeInput({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[--color-text]">{label}</span>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border border-[--color-accent-light] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
      />
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────
export default function TimingEditorPage() {
  const navigate = useNavigate()
  const { school, timings, setTiming, resetTiming } = useSchoolStore()
  const levels = (school?.levels ?? ['lower_primary', 'upper_primary', 'junior_secondary']) as SchoolLevel[]
  const [activeLevel, setActiveLevel] = useState<SchoolLevel>(levels[0] ?? 'lower_primary')
  const [saving, setSaving] = useState(false)

  const timing = timings[activeLevel]

  const update = (patch: Partial<LevelTiming>) =>
    setTiming(activeLevel, { ...timing, ...patch })

  // ── Derived: check slot count ───────────────────────────
  const weeklySlots = useMemo(() => countDailyLessonSlots(timing) * 5, [timing])
  const required    = REQUIRED_LESSONS[activeLevel]
  const slotOk      = weeklySlots >= required
  const totalContactHoursWeek = useMemo(() =>
    (countDailyLessonSlots(timing) * timing.lesson_duration_min * 5) / 60
  , [timing])
  const minContactHours = activeLevel === 'junior_secondary' ? 26.7 : 23.3 // approx MoE mins

  // ── Timeline ────────────────────────────────────────────
  const timeline = useMemo(() => buildTimeline(timing), [timing])
  const endTime  = timeline[timeline.length - 1]?.end ?? '17:00'

  // ── Save & proceed ──────────────────────────────────────
  const handleSaveAndContinue = async () => {
    setSaving(true)
    try {
      // Timings are already in the Zustand store (persisted).
      // In a full implementation, upsert timing rows to Supabase here.
      await new Promise(r => setTimeout(r, 400)) // simulate
      toast.success('Timings saved!')
      navigate('/classes')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <WizardLayout step={0} title="Timing Configuration" subtitle="Set daily schedule per school level">
      <div className="max-w-3xl mx-auto pb-24">

        {/* ── Level Tabs ── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {levels.map(level => {
            const meta = LEVEL_LABELS[level]
            const active = level === activeLevel
            return (
              <button key={level} onClick={() => setActiveLevel(level)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                  active
                    ? 'border-[--color-primary] bg-[--color-surface] text-[--color-primary]'
                    : 'border-[--color-accent-light] text-[--color-muted] hover:border-[--color-mid]'
                }`}>
                <i className={`${meta.icon} mr-1`} />
                {meta.label}
              </button>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* ── LEFT: Controls ── */}
          <div className="space-y-4">
            <Card>
              <div className="p-4 space-y-1 divide-y divide-[--color-surface]">
                <h3 className="text-sm font-semibold text-[--color-text] pb-2">
                  <i className="bi bi-clock text-[--color-primary] mr-2" />
                  Lesson Settings
                </h3>

                <TimeInput label="Lessons Begin"
                  value={timing.lesson_start} onChange={v => update({ lesson_start: v })} />
                <NumberStepper label="Lesson Duration" min={20} max={60} step={5}
                  value={timing.lesson_duration_min} onChange={v => update({ lesson_duration_min: v })} />
              </div>
            </Card>

            <Card>
              <div className="p-4 space-y-1 divide-y divide-[--color-surface]">
                <h3 className="text-sm font-semibold text-[--color-text] pb-2">
                  <i className="bi bi-cup-hot text-[--color-primary] mr-2" />
                  Breaks
                </h3>
                <NumberStepper label="Break 1 — after lesson" min={1} max={4} step={1} unit=""
                  value={timing.break1_after_lesson} onChange={v => update({ break1_after_lesson: v })} />
                <NumberStepper label="Break 1 Duration" min={5} max={30} step={5}
                  value={timing.break1_duration_min} onChange={v => update({ break1_duration_min: v })} />
                <NumberStepper label="Break 2 — after lesson" min={2} max={6} step={1} unit=""
                  value={timing.break2_after_lesson} onChange={v => update({ break2_after_lesson: v })} />
                <NumberStepper label="Break 2 Duration" min={15} max={60} step={5}
                  value={timing.break2_duration_min} onChange={v => update({ break2_duration_min: v })} />
              </div>
            </Card>

            <Card>
              <div className="p-4 space-y-1 divide-y divide-[--color-surface]">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-sm font-semibold text-[--color-text]">
                    <i className="bi bi-sun text-[--color-primary] mr-2" />
                    Lunch Break
                  </h3>
                  <button
                    onClick={() => update({ lunch_enabled: !timing.lunch_enabled })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${timing.lunch_enabled ? 'bg-[--color-primary]' : 'bg-[#EDE7D9]'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${timing.lunch_enabled ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
                {timing.lunch_enabled && (
                  <>
                    <NumberStepper label="Lunch after lesson" min={4} max={8} step={1} unit=""
                      value={timing.lunch_after_lesson ?? 6} onChange={v => update({ lunch_after_lesson: v })} />
                    <NumberStepper label="Lunch Duration" min={30} max={90} step={5}
                      value={timing.lunch_duration_min ?? 60} onChange={v => update({ lunch_duration_min: v })} />
                  </>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-4 space-y-1 divide-y divide-[--color-surface]">
                <h3 className="text-sm font-semibold text-[--color-text] pb-2">
                  <i className="bi bi-people text-[--color-primary] mr-2" />
                  Non-Formal Programmes
                </h3>
                <TimeInput label="Start Time"
                  value={timing.non_formal_start ?? '15:30'} onChange={v => update({ non_formal_start: v })} />
                <TimeInput label="End Time"
                  value={timing.non_formal_end ?? '17:00'} onChange={v => update({ non_formal_end: v })} />
              </div>
            </Card>

            {/* Reset */}
            <button
              onClick={() => { resetTiming(activeLevel); toast.success('Reset to MoE defaults') }}
              className="text-sm text-[--color-muted] hover:text-[--color-primary] flex items-center gap-1"
            >
              <i className="bi bi-arrow-counterclockwise" /> Reset to MoE defaults
            </button>
          </div>

          {/* ── RIGHT: Timeline Preview ── */}
          <div className="space-y-4">
            {/* Warnings */}
            {!slotOk && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 p-3 rounded-xl bg-[#FFF3E0] border border-[#FFB300] text-sm">
                <i className="bi bi-exclamation-triangle text-[--color-warn] text-lg flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[--color-warn]">Slot count alert</p>
                  <p className="text-[#795548]">
                    Current schedule allows ~<strong>{weeklySlots}</strong> slots/week but{' '}
                    {LEVEL_LABELS[activeLevel].label} requires <strong>{required}</strong> lessons.
                    Increase lesson time or reduce breaks.
                  </p>
                </div>
              </motion.div>
            )}
            {totalContactHoursWeek < minContactHours && (
              <div className="flex gap-3 p-3 rounded-xl bg-[#FCE4EC] border border-[#F48FB1] text-sm">
                <i className="bi bi-exclamation-circle text-[--color-error] text-lg flex-shrink-0 mt-0.5" />
                <p className="text-[#B71C1C]">
                  Total contact time <strong>{totalContactHoursWeek.toFixed(1)} hrs/week</strong> is
                  below MoE minimum of <strong>{minContactHours} hrs</strong>.
                </p>
              </div>
            )}

            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={slotOk ? 'success' : 'error'}>
                {weeklySlots} slots / {required} required
              </Badge>
              <Badge variant="info">
                End: {fmt12(endTime)}
              </Badge>
              <Badge variant={totalContactHoursWeek >= minContactHours ? 'success' : 'warning'}>
                {totalContactHoursWeek.toFixed(1)} hrs contact/wk
              </Badge>
            </div>

            {/* Visual timeline */}
            <Card>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[--color-text] mb-3">
                  <i className="bi bi-clock-history text-[--color-primary] mr-2" />
                  Daily Schedule Preview
                </h3>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {timeline.map((slot, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border text-xs ${SLOT_COLOURS[slot.type]}`}
                    >
                      <div className="flex-shrink-0 w-24 font-mono">
                        {fmt12(slot.start)}
                      </div>
                      <div className="flex-1 font-medium">{slot.label}</div>
                      <div className="flex-shrink-0 text-[--color-muted]">
                        {slot.durationMin} min
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/setup')}>
            <i className="bi bi-arrow-left mr-1" /> Back
          </Button>
          <Button variant="primary" size="lg" loading={saving}
                  onClick={handleSaveAndContinue} className="flex-1">
            Save & Continue to Classes <i className="bi bi-arrow-right ml-2" />
          </Button>
        </div>
      </div>
    </WizardLayout>
  )
}
