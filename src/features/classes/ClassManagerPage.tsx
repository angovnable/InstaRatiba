// ============================================================
// InstaRatiba — Segment 4
// Screen 3: Class Manager — grades, streams, class teachers
// §4.2.5, Amendment D
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { v4 as uuid } from 'uuid'
import { useSchoolStore } from '@/store/schoolStore'
import { useAuthStore } from '@/store/authStore'
import {
  fetchClasses, upsertClass, deleteClass,
  fetchTeachers,
} from '@/lib/supabase/classes'
import type { SchoolClass, Teacher, SchoolLevel } from '@/types'
import { Button, Badge, Modal, Input, SkeletonLoader } from '@/components/ui'
import { WizardLayout } from '@/components/layout'

// ── Grade → level mapping ────────────────────────────────────
const GRADE_LEVEL: Record<number, SchoolLevel> = {
  1: 'lower_primary', 2: 'lower_primary', 3: 'lower_primary',
  4: 'upper_primary', 5: 'upper_primary', 6: 'upper_primary',
  7: 'junior_secondary', 8: 'junior_secondary', 9: 'junior_secondary',
}

const LEVEL_GRADES: Record<SchoolLevel, number[]> = {
  lower_primary:    [1, 2, 3],
  upper_primary:    [4, 5, 6],
  junior_secondary: [7, 8, 9],
}

const LEVEL_LABELS: Record<SchoolLevel, string> = {
  lower_primary:    'Lower Primary',
  upper_primary:    'Upper Primary',
  junior_secondary: 'Junior Secondary',
}

const LEVEL_COLOUR: Record<SchoolLevel, string> = {
  lower_primary:    'bg-[#F7F5EF] text-[#0D3D23] border-[#EDE7D9]',
  upper_primary:    'bg-[#E3F2FD] text-[#1565C0] border-[#90CAF9]',
  junior_secondary: 'bg-[#EDE7F6] text-[#512DA8] border-[#CE93D8]',
}

function levelForGrade(g: number): SchoolLevel { return GRADE_LEVEL[g] }

/** Generate default stream label (A, B, C …) */
function streamLabel(idx: number) { return String.fromCharCode(65 + idx) }

// ── Class Card ───────────────────────────────────────────────
interface ClassCardProps {
  sc: SchoolClass
  teachers: Teacher[]
  onEdit: (sc: SchoolClass) => void
  onDelete: (id: string) => void
}

function ClassCard({ sc, teachers, onEdit, onDelete }: ClassCardProps) {
  const level   = levelForGrade(sc.grade)
  const teacher = teachers.find(t => t.id === sc.class_teacher_id)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-2xl border border-[--color-accent-light] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      {/* Grade badge strip */}
      <div className={`rounded-t-2xl border-b px-4 py-2 flex items-center justify-between text-xs font-semibold ${LEVEL_COLOUR[level]}`}>
        <span>Grade {sc.grade}{sc.stream}</span>
        <span>{LEVEL_LABELS[level]}</span>
      </div>

      <div className="p-4 space-y-2">
        {/* Class teacher */}
        <div className="flex items-center gap-2">
          <i className="bi bi-person-circle text-[--color-muted] text-lg" />
          <div>
            <p className="text-xs text-[--color-muted]">Class Teacher</p>
            <p className="text-sm font-medium">
              {teacher ? teacher.name : <span className="text-[--color-muted] italic">Not assigned</span>}
            </p>
          </div>
        </div>

        {/* Class size */}
        {sc.size && (
          <div className="flex items-center gap-2">
            <i className="bi bi-people text-[--color-muted]" />
            <p className="text-sm">{sc.size} learners</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(sc)} className="flex-1">
            <i className="bi bi-pencil mr-1" /> Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(sc.id)}
                  className="text-[--color-error] hover:bg-[#FCE4EC]">
            <i className="bi bi-trash" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Edit Modal ───────────────────────────────────────────────
interface EditModalProps {
  sc: SchoolClass | null
  teachers: Teacher[]
  open: boolean
  onClose: () => void
  onSave: (sc: SchoolClass) => void
}

function EditModal({ sc, teachers, open, onClose, onSave }: EditModalProps) {
  const [stream, setStream]   = useState('')
  const [size, setSize]       = useState('')
  const [teacherId, setTeacherId] = useState('')

  useEffect(() => {
    if (sc) {
      setStream(sc.stream)
      setSize(sc.size?.toString() ?? '')
      setTeacherId(sc.class_teacher_id ?? '')
    }
  }, [sc])

  if (!sc) return null

  const level = levelForGrade(sc.grade)
  const eligible = teachers.filter((_t) => {
    // Teacher's grades should include this class's grade
    return true // We'll filter more precisely when TeacherSubject data is available
  })

  return (
    <Modal open={open} onClose={onClose} title={`Edit Grade ${sc.grade}${sc.stream}`} size="sm">
      <div className="space-y-4 p-1">
        <Input label="Stream Name" value={stream}
               onChange={e => setStream(e.target.value.toUpperCase().slice(0, 4))}
               placeholder="e.g. A" />
        <Input label="Class Size (optional)" type="number" value={size}
               onChange={e => setSize(e.target.value)} placeholder="e.g. 45" />

        <div className="space-y-1">
          <label className="text-xs font-medium text-[--color-muted] uppercase tracking-wide">
            Class Teacher
          </label>
          <select value={teacherId} onChange={e => setTeacherId(e.target.value)}
                  className="w-full px-3 py-2 border border-[--color-accent-light] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] bg-white">
            <option value="">— Not assigned —</option>
            {eligible.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={() =>
            onSave({ ...sc, stream: stream || sc.stream, size: size ? parseInt(size) : undefined, class_teacher_id: teacherId || undefined })
          } className="flex-1">Save</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Add Streams Modal ────────────────────────────────────────
interface AddStreamsModalProps {
  open: boolean
  onClose: () => void
  onAdd: (grade: number, count: number) => void
  existingClasses: SchoolClass[]
  availableGrades: number[]
}

function AddStreamsModal({ open, onClose, onAdd, existingClasses, availableGrades }: AddStreamsModalProps) {
  const [grade, setGrade] = useState<number>(availableGrades[0] ?? 1)
  const [count, setCount] = useState(1)

  const existingStreams = existingClasses.filter(c => c.grade === grade).length

  return (
    <Modal open={open} onClose={onClose} title="Add Streams" size="sm">
      <div className="space-y-4 p-1">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[--color-muted] uppercase tracking-wide">Grade</label>
          <select value={grade} onChange={e => setGrade(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-[--color-accent-light] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] bg-white">
            {availableGrades.map(g => (
              <option key={g} value={g}>
                Grade {g} — {existingClasses.filter(c => c.grade === g).length} stream(s) existing
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[--color-muted] uppercase tracking-wide">
            Number of streams to add
          </label>
          <div className="flex items-center gap-3">
            <button onClick={() => setCount(Math.max(1, count - 1))}
                    className="w-9 h-9 rounded-full border border-[--color-accent-light] flex items-center justify-center text-lg font-bold hover:bg-[--color-surface]">−</button>
            <span className="text-2xl font-bold w-8 text-center">{count}</span>
            <button onClick={() => setCount(Math.min(12 - existingStreams, count + 1))}
                    className="w-9 h-9 rounded-full border border-[--color-accent-light] flex items-center justify-center text-lg font-bold hover:bg-[--color-surface]">+</button>
          </div>
          <p className="text-xs text-[--color-muted]">
            Will create streams {streamLabel(existingStreams)}–{streamLabel(existingStreams + count - 1)} for Grade {grade}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={() => { onAdd(grade, count); onClose() }} className="flex-1">
            Add {count} Stream{count !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Delete confirm ───────────────────────────────────────────
interface DeleteConfirmProps { open: boolean; onClose: () => void; onConfirm: () => void; label: string }
function DeleteConfirm({ open, onClose, onConfirm, label }: DeleteConfirmProps) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Class?" size="sm">
      <div className="space-y-4 p-1">
        <p className="text-sm text-[--color-text]">
          Delete <strong>{label}</strong>? This will remove all subject allocations for this class.
        </p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1">Delete</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function ClassManagerPage() {
  const navigate = useNavigate()
  const { school } = useSchoolStore()
  const { user: _user } = useAuthStore()
  const schoolId   = school?.id ?? ''

  const [classes, setClasses]   = useState<SchoolClass[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading]   = useState(true)

  const [editTarget, setEditTarget]   = useState<SchoolClass | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null)
  const [showAdd, setShowAdd]         = useState(false)
  const [saving, setSaving]           = useState(false)

  const levels = (school?.levels ?? []) as SchoolLevel[]

  // All grades the school teaches
  const availableGrades = levels.flatMap(l => LEVEL_GRADES[l]).sort((a, b) => a - b)

  // ── Load ───────────────────────────────────────────────
  useEffect(() => {
    if (!schoolId) return
    Promise.all([
      fetchClasses(schoolId),
      fetchTeachers(schoolId),
    ]).then(([cls, tch]) => {
      setClasses(cls)
      setTeachers(tch)
    }).catch(e => toast.error((e as Error).message))
      .finally(() => setLoading(false))
  }, [schoolId])

  // ── Add streams ──────────────────────────────────────
  const handleAddStreams = useCallback(async (grade: number, count: number) => {
    const existing = classes.filter(c => c.grade === grade)
    const newClasses: SchoolClass[] = Array.from({ length: count }, (_, i) => ({
      id: uuid(),
      school_id: schoolId,
      grade,
      stream: streamLabel(existing.length + i),
    }))

    setSaving(true)
    try {
      for (const nc of newClasses) await upsertClass(nc)
      setClasses(prev => [...prev, ...newClasses])
      toast.success(`Added ${count} stream${count > 1 ? 's' : ''} for Grade ${grade}`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }, [classes, schoolId])

  // ── Edit save ────────────────────────────────────────
  const handleSaveEdit = useCallback(async (updated: SchoolClass) => {
    setSaving(true)
    try {
      await upsertClass(updated)
      setClasses(prev => prev.map(c => c.id === updated.id ? updated : c))
      setEditTarget(null)
      toast.success('Class updated')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }, [])

  // ── Delete ───────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteClass(deleteTarget.id)
      setClasses(prev => prev.filter(c => c.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast.success('Class removed')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }, [deleteTarget])

  // ── Group by level for display ───────────────────────
  const classesByLevel = levels.map(level => ({
    level,
    classes: classes.filter(c => levelForGrade(c.grade) === level)
      .sort((a, b) => a.grade - b.grade || a.stream.localeCompare(b.stream)),
  }))

  const hasClasses = classes.length > 0

  return (
    <WizardLayout step={1} title="Class Manager" subtitle="Define your school's grade streams">
      <div className="max-w-4xl mx-auto pb-24">

        {/* ── Header actions ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Badge variant={hasClasses ? 'success' : 'warning'}>
              {classes.length} class{classes.length !== 1 ? 'es' : ''}
            </Badge>
            {!hasClasses && (
              <span className="text-sm text-[--color-muted]">Add at least one class to continue</span>
            )}
          </div>
          <Button variant="primary" onClick={() => setShowAdd(true)} disabled={saving}>
            <i className="bi bi-plus-lg mr-1" /> Add Streams
          </Button>
        </div>

        {/* ── Loading state ── */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonLoader key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && classes.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-20">
            <i className="bi bi-people text-6xl text-[--color-accent-light]" />
            <h3 className="mt-4 text-lg font-semibold text-[--color-text]">No classes yet</h3>
            <p className="mt-1 text-sm text-[--color-muted]">
              Click "Add Streams" to define your grade bands and streams.
            </p>
          </motion.div>
        )}

        {/* ── Classes by level ── */}
        {!loading && classesByLevel.map(({ level, classes: levelClasses }) => {
          if (levelClasses.length === 0) return null
          return (
            <div key={level} className="mb-8">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${LEVEL_COLOUR[level]}`}>
                <i className="bi bi-layer-forward" />
                {LEVEL_LABELS[level]}
                <span className="ml-1 opacity-70">
                  ({levelClasses.length} class{levelClasses.length !== 1 ? 'es' : ''})
                </span>
              </div>

              <AnimatePresence>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {levelClasses.map(sc => (
                    <ClassCard key={sc.id} sc={sc} teachers={teachers}
                               onEdit={setEditTarget} onDelete={id => setDeleteTarget(classes.find(c => c.id === id) ?? null)} />
                  ))}
                </div>
              </AnimatePresence>
            </div>
          )
        })}

        {/* ── Navigation ── */}
        <div className="mt-8 flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/setup/timing')}>
            <i className="bi bi-arrow-left mr-1" /> Back
          </Button>
          <Button
            variant="primary" size="lg" className="flex-1"
            disabled={!hasClasses}
            onClick={() => navigate('/rooms')}
          >
            Continue to Rooms <i className="bi bi-arrow-right ml-2" />
          </Button>
        </div>
      </div>

      {/* ── Modals ── */}
      <AddStreamsModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAddStreams}
        existingClasses={classes}
        availableGrades={availableGrades}
      />
      <EditModal
        open={!!editTarget}
        sc={editTarget}
        teachers={teachers}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
      />
      <DeleteConfirm
        open={!!deleteTarget}
        label={deleteTarget ? `Grade ${deleteTarget.grade}${deleteTarget.stream}` : ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </WizardLayout>
  )
}
