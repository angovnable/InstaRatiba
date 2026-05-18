// ============================================================
// InstaRatiba — Segment 5
// Screen 4: Teacher Manager
// §4.2.6 — CRUD, subject assignment, grade allocation,
//           max lessons, consecutive limit, free periods
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { v4 as uuid } from 'uuid'
import { useSchoolStore } from '@/store/schoolStore'
import { useAuthStore } from '@/store/authStore'
import { useTeacherStore } from '@/store/teacherStore'
import {
  fetchTeachers,
  upsertTeacher,
  deleteTeacher,
  fetchAllTeacherSubjects,
  upsertTeacherSubjects,
} from '@/lib/supabase/teachers'
import { CBC_SUBJECTS_BY_LEVEL } from '@/lib/cbc/subjects'
import type { Teacher, TeacherSubject, SchoolLevel } from '@/types'
import { Button, Modal, Input, SkeletonLoader } from '@/components/ui'
import { WizardLayout } from '@/components/layout'

// ── Level helpers ────────────────────────────────────────────
const LEVEL_LABELS: Record<SchoolLevel, string> = {
  lower_primary:    'Lower Primary (Gr 1–3)',
  upper_primary:    'Upper Primary (Gr 4–6)',
  junior_secondary: 'Junior Secondary (Gr 7–9)',
}
const LEVEL_GRADES: Record<SchoolLevel, number[]> = {
  lower_primary:    [1, 2, 3],
  upper_primary:    [4, 5, 6],
  junior_secondary: [7, 8, 9],
}
const LEVEL_BADGE: Record<SchoolLevel, string> = {
  lower_primary:    'bg-[#F7F5EF] text-[#0D3D23]',
  upper_primary:    'bg-[#E3F2FD] text-[#1565C0]',
  junior_secondary: 'bg-[#EDE7F6] text-[#512DA8]',
}

// Deterministic colour from name (for avatar initial background)
function avatarColour(name: string) {
  const palette = [
    '#0D3D23','#1565C0','#512DA8','#AD1457',
    '#E65100','#558B2F','#00695C','#37474F',
  ]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

// ── TeacherFormModal ─────────────────────────────────────────
interface TeacherFormProps {
  teacher: Teacher | null
  open: boolean
  schoolId: string
  schoolLevels: SchoolLevel[]
  existingSubjects: TeacherSubject[]
  onClose: () => void
  onSave: (t: Teacher, subjects: { subject_code: string; grades: number[] }[]) => void
}

function TeacherFormModal({
  teacher, open, schoolId, schoolLevels, existingSubjects, onClose, onSave,
}: TeacherFormProps) {
  const isEdit = !!teacher?.name

  const [name, setName]             = useState('')
  const [tscNo, setTscNo]           = useState('')
  const [email, setEmail]           = useState('')
  const [phone, setPhone]           = useState('')
  const [maxDay, setMaxDay]         = useState(6)
  const [maxConsec, setMaxConsec]   = useState(3)
  const [minFree, setMinFree]       = useState(1)
  const [saving, setSaving]         = useState(false)

  // Subject assignments: subjectCode → grades[]
  const [assignments, setAssignments] = useState<Record<string, number[]>>({})

  // Available subjects per school levels
  const availableSubjects = useMemo(() =>
    schoolLevels.flatMap(l =>
      (CBC_SUBJECTS_BY_LEVEL[l] ?? []).map(s => ({ ...s, level: l }))
    ).filter((v, i, a) => a.findIndex(x => x.code === v.code) === i),
    [schoolLevels]
  )

  useEffect(() => {
    if (teacher) {
      setName(teacher.name)
      setTscNo(teacher.tsc_no ?? '')
      setEmail(teacher.email ?? '')
      setPhone(teacher.phone ?? '')
      setMaxDay(teacher.max_lessons_day)
      setMaxConsec(teacher.max_consecutive)
      setMinFree(teacher.min_free_periods_day ?? 1)
      // Rebuild assignment map from existing TeacherSubject rows
      const map: Record<string, number[]> = {}
      existingSubjects.forEach(ts => { map[ts.subject_code] = ts.grades })
      setAssignments(map)
    } else {
      setName(''); setTscNo(''); setEmail(''); setPhone('')
      setMaxDay(6); setMaxConsec(3); setMinFree(1)
      setAssignments({})
    }
  }, [teacher, open, existingSubjects])

  const toggleSubjectLevel = (subjectCode: string, grade: number) => {
    setAssignments(prev => {
      const cur = prev[subjectCode] ?? []
      const next = cur.includes(grade) ? cur.filter(g => g !== grade) : [...cur, grade].sort()
      if (!next.length) {
        const { [subjectCode]: _removed, ...rest } = prev // eslint-disable-line @typescript-eslint/no-unused-vars
        return rest
      }
      return { ...prev, [subjectCode]: next }
    })
  }

  const toggleAllGradesForSubject = (subjectCode: string, level: SchoolLevel) => {
    const grades = LEVEL_GRADES[level]
    setAssignments(prev => {
      const cur = prev[subjectCode] ?? []
      const allSelected = grades.every(g => cur.includes(g))
      const others = cur.filter(g => !grades.includes(g))
      const next = allSelected ? others : [...others, ...grades].sort()
      if (!next.length) {
        const { [subjectCode]: _removed, ...rest } = prev // eslint-disable-line @typescript-eslint/no-unused-vars
        return rest
      }
      return { ...prev, [subjectCode]: next }
    })
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Teacher name is required'); return }
    setSaving(true)
    try {
      const t: Teacher = {
        id:                   teacher?.id ?? uuid(),
        school_id:            schoolId,
        name:                 name.trim(),
        tsc_no:               tscNo.trim() || undefined,
        email:                email.trim() || undefined,
        phone:                phone.trim() || undefined,
        max_lessons_day:      maxDay,
        max_consecutive:      maxConsec,
        min_free_periods_day: minFree,
      }
      const subjectList = Object.entries(assignments).map(([subject_code, grades]) => ({
        subject_code,
        grades,
      }))
      onSave(t, subjectList)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Teacher' : 'Add Teacher'}
      size="lg"
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={handleSave} icon="bi-check-lg">
            {isEdit ? 'Save Changes' : 'Add Teacher'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Personal details */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[--color-muted] mb-3">
            Personal Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name *"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Jane Njoroge"
            />
            <Input
              label="TSC Number"
              value={tscNo}
              onChange={e => setTscNo(e.target.value)}
              placeholder="e.g. 0123456"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="teacher@school.ac.ke"
            />
            <Input
              label="Phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+254 7XX XXX XXX"
            />
          </div>
        </div>

        {/* Load limits */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[--color-muted] mb-3">
            Teaching Load Limits
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {/* Max lessons/day */}
            <div className="bg-[--color-surface] rounded-xl p-3 text-center border border-[--color-accent-light]">
              <p className="text-[10px] text-[--color-muted] uppercase tracking-wider mb-2">Max / Day</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setMaxDay(v => Math.max(1, v - 1))}
                  className="w-7 h-7 rounded-full bg-white border border-[--color-accent-light] text-[--color-primary] flex items-center justify-center hover:bg-[--color-surface] transition-colors"
                >
                  <i className="bi bi-dash text-sm" />
                </button>
                <span className="text-xl font-bold text-[--color-text] w-6 text-center">{maxDay}</span>
                <button
                  onClick={() => setMaxDay(v => Math.min(9, v + 1))}
                  className="w-7 h-7 rounded-full bg-white border border-[--color-accent-light] text-[--color-primary] flex items-center justify-center hover:bg-[--color-surface] transition-colors"
                >
                  <i className="bi bi-plus text-sm" />
                </button>
              </div>
            </div>

            {/* Max consecutive */}
            <div className="bg-[--color-surface] rounded-xl p-3 text-center border border-[--color-accent-light]">
              <p className="text-[10px] text-[--color-muted] uppercase tracking-wider mb-2">Max Consec.</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setMaxConsec(v => Math.max(1, v - 1))}
                  className="w-7 h-7 rounded-full bg-white border border-[--color-accent-light] text-[--color-primary] flex items-center justify-center hover:bg-[--color-surface] transition-colors"
                >
                  <i className="bi bi-dash text-sm" />
                </button>
                <span className="text-xl font-bold text-[--color-text] w-6 text-center">{maxConsec}</span>
                <button
                  onClick={() => setMaxConsec(v => Math.min(6, v + 1))}
                  className="w-7 h-7 rounded-full bg-white border border-[--color-accent-light] text-[--color-primary] flex items-center justify-center hover:bg-[--color-surface] transition-colors"
                >
                  <i className="bi bi-plus text-sm" />
                </button>
              </div>
              <p className="text-[9px] text-[--color-muted] mt-1">soft constraint</p>
            </div>

            {/* Min free periods */}
            <div className="bg-[--color-surface] rounded-xl p-3 text-center border border-[--color-accent-light]">
              <p className="text-[10px] text-[--color-muted] uppercase tracking-wider mb-2">Min Free/Day</p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setMinFree(v => Math.max(0, v - 1))}
                  className="w-7 h-7 rounded-full bg-white border border-[--color-accent-light] text-[--color-primary] flex items-center justify-center hover:bg-[--color-surface] transition-colors"
                >
                  <i className="bi bi-dash text-sm" />
                </button>
                <span className="text-xl font-bold text-[--color-text] w-6 text-center">{minFree}</span>
                <button
                  onClick={() => setMinFree(v => Math.min(4, v + 1))}
                  className="w-7 h-7 rounded-full bg-white border border-[--color-accent-light] text-[--color-primary] flex items-center justify-center hover:bg-[--color-surface] transition-colors"
                >
                  <i className="bi bi-plus text-sm" />
                </button>
              </div>
              <p className="text-[9px] text-[--color-muted] mt-1">soft constraint</p>
            </div>
          </div>
        </div>

        {/* Subject assignments */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[--color-muted] mb-3">
            Subject & Grade Assignment
          </h3>
          {schoolLevels.length === 0 ? (
            <p className="text-sm text-[--color-muted] italic">No school levels configured yet.</p>
          ) : (
            <div className="space-y-4">
              {schoolLevels.map(level => {
                const levelSubjects = availableSubjects.filter(s => s.level === level)
                const grades = LEVEL_GRADES[level]
                return (
                  <div key={level}>
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${LEVEL_BADGE[level]}`}>
                      {LEVEL_LABELS[level]}
                    </div>
                    <div className="rounded-xl border border-[--color-accent-light] overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-[--color-surface] border-b border-[--color-accent-light]">
                            <th className="text-left px-3 py-2 text-[--color-muted] font-semibold">Subject</th>
                            {grades.map(g => (
                              <th key={g} className="px-2 py-2 text-[--color-muted] font-semibold text-center">
                                Gr {g}
                              </th>
                            ))}
                            <th className="px-2 py-2 text-[--color-muted] font-semibold text-center">All</th>
                          </tr>
                        </thead>
                        <tbody>
                          {levelSubjects.map((s, idx) => {
                            const cur = assignments[s.code] ?? []
                            const allSelected = grades.every(g => cur.includes(g))
                            return (
                              <tr
                                key={s.code}
                                className={`border-b border-[--color-surface] last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-[--color-surface]/40'}`}
                              >
                                <td className="px-3 py-2 font-medium text-[--color-text]">{s.name}</td>
                                {grades.map(g => (
                                  <td key={g} className="px-2 py-2 text-center">
                                    <button
                                      onClick={() => toggleSubjectLevel(s.code, g)}
                                      className={`w-5 h-5 rounded border transition-all flex items-center justify-center mx-auto ${
                                        cur.includes(g)
                                          ? 'bg-[--color-primary] border-[--color-primary]'
                                          : 'border-[--color-accent-light] hover:border-[--color-primary]'
                                      }`}
                                    >
                                      {cur.includes(g) && <i className="bi bi-check text-white text-[10px]" />}
                                    </button>
                                  </td>
                                ))}
                                {/* All grades toggle */}
                                <td className="px-2 py-2 text-center">
                                  <button
                                    onClick={() => toggleAllGradesForSubject(s.code, level)}
                                    className={`w-5 h-5 rounded border transition-all flex items-center justify-center mx-auto ${
                                      allSelected
                                        ? 'bg-[--color-mid] border-[--color-mid]'
                                        : 'border-[--color-accent-light] hover:border-[--color-mid]'
                                    }`}
                                  >
                                    {allSelected && <i className="bi bi-check-all text-white text-[10px]" />}
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ── Teacher Card ─────────────────────────────────────────────
interface TeacherCardProps {
  teacher: Teacher
  subjects: TeacherSubject[]
  onEdit: (t: Teacher) => void
  onDelete: (id: string) => void
}

function TeacherCard({ teacher, subjects, onEdit, onDelete }: TeacherCardProps) {
  const colour = avatarColour(teacher.name)
  const initial = teacher.name.trim().charAt(0).toUpperCase()
  const subjectCount = subjects.length
  const gradeCount = [...new Set(subjects.flatMap(ts => ts.grades))].length

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-2xl border border-[--color-accent-light] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{ backgroundColor: colour }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[--color-text] truncate">{teacher.name}</p>
          {teacher.tsc_no && (
            <p className="text-[11px] text-[--color-muted] truncate">TSC: {teacher.tsc_no}</p>
          )}
          {teacher.email && (
            <p className="text-[11px] text-[--color-muted] truncate">{teacher.email}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(teacher)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[--color-muted] hover:text-[--color-primary] hover:bg-[--color-surface] transition-colors"
          >
            <i className="bi bi-pencil text-sm" />
          </button>
          <button
            onClick={() => onDelete(teacher.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[--color-muted] hover:text-[--color-error] hover:bg-[rgba(160,31,31,0.06)] transition-colors"
          >
            <i className="bi bi-trash text-sm" />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="px-4 pb-3 flex gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[--color-surface] text-[10px] text-[--color-muted] border border-[--color-accent-light]">
          <i className="bi bi-book text-[--color-primary]" />
          {subjectCount} subject{subjectCount !== 1 ? 's' : ''}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[--color-surface] text-[10px] text-[--color-muted] border border-[--color-accent-light]">
          <i className="bi bi-mortarboard text-[--color-primary]" />
          {gradeCount} grade{gradeCount !== 1 ? 's' : ''}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[--color-surface] text-[10px] text-[--color-muted] border border-[--color-accent-light]">
          <i className="bi bi-clock text-[--color-primary]" />
          Max {teacher.max_lessons_day}/day
        </span>
      </div>

      {/* Subject chips */}
      {subjects.length > 0 && (
        <div className="px-4 pb-4 flex flex-wrap gap-1">
          {subjects.slice(0, 5).map(ts => (
            <span
              key={ts.subject_code}
              className="px-2 py-0.5 rounded-full bg-[--color-surface] border border-[--color-accent-light] text-[10px] text-[--color-text]"
            >
              {ts.subject_code.split('_').slice(0, 2).join(' ')}
            </span>
          ))}
          {subjects.length > 5 && (
            <span className="px-2 py-0.5 rounded-full bg-[--color-accent-light] text-[10px] text-[--color-primary]">
              +{subjects.length - 5} more
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── Delete Confirm ────────────────────────────────────────────
function DeleteConfirmModal({
  name, open, onClose, onConfirm, deleting,
}: { name: string; open: boolean; onClose: () => void; onConfirm: () => void; deleting: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title="Remove Teacher" size="sm"
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={onConfirm} icon="bi-trash">
            Remove
          </Button>
        </div>
      }
    >
      <p className="text-sm text-[--color-text]">
        Are you sure you want to remove <strong>{name}</strong>?
        Their subject assignments will also be deleted.
      </p>
      <p className="mt-2 text-xs text-[--color-muted]">
        This will also unassign them from any lesson allocations.
      </p>
    </Modal>
  )
}

// ── TeacherManagerPage ───────────────────────────────────────
export default function TeacherManagerPage() {
  const navigate  = useNavigate()
  const { school } = useSchoolStore()
  const { user: _user } = useAuthStore()
  const {
    teachers, teacherSubjects,
    setTeachers, addTeacher, updateTeacher, removeTeacher,
    setTeacherSubjects, setSubjectsForTeacher,
    setLoading, isLoading,
    getSubjectsForTeacher,
  } = useTeacherStore()

  const schoolId    = school?.id ?? ''
  const schoolLevels: SchoolLevel[] = school?.levels ?? []

  const [formOpen, setFormOpen]       = useState(false)
  const [editingTeacher, setEditing]  = useState<Teacher | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null)
  const [deleting, setDeleting]       = useState(false)
  const [searchQuery, setSearch]      = useState('')
  const [saving, setSaving]           = useState(false)

  // Load teachers on mount
  useEffect(() => {
    if (!schoolId) return
    setLoading(true)
    Promise.all([
      fetchTeachers(schoolId),
      fetchAllTeacherSubjects(schoolId),
    ]).then(([ts, subs]) => {
      setTeachers(ts)
      setTeacherSubjects(subs)
    }).catch(err => {
      toast.error('Failed to load teachers: ' + (err as Error).message)
    }).finally(() => setLoading(false))
  }, [schoolId]) // eslint-disable-line

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return teachers.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.tsc_no ?? '').toLowerCase().includes(q) ||
      (t.email  ?? '').toLowerCase().includes(q)
    )
  }, [teachers, searchQuery])

  const handleOpenAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (t: Teacher) => {
    setEditing(t)
    setFormOpen(true)
  }

  const handleSave = useCallback(
    async (t: Teacher, subjectList: { subject_code: string; grades: number[] }[]) => {
      setSaving(true)
      try {
        await upsertTeacher(t)
        await upsertTeacherSubjects(t.id, subjectList)

        const newSubjectRows = subjectList.map((s, _i) => ({
          id:           `${t.id}_${s.subject_code}`,
          teacher_id:   t.id,
          subject_code: s.subject_code,
          grades:       s.grades,
        }))

        if (editingTeacher) {
          updateTeacher(t)
        } else {
          addTeacher(t)
        }
        setSubjectsForTeacher(t.id, newSubjectRows)

        toast.success(editingTeacher ? 'Teacher updated' : 'Teacher added')
        setFormOpen(false)
      } catch (err) {
        toast.error('Failed to save: ' + (err as Error).message)
      } finally {
        setSaving(false)
      }
    },
    [editingTeacher, updateTeacher, addTeacher, setSubjectsForTeacher]
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTeacher(deleteTarget.id)
      removeTeacher(deleteTarget.id)
      toast.success(`${deleteTarget.name} removed`)
    } catch (err) {
      toast.error('Failed to delete: ' + (err as Error).message)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const canProceed = teachers.length > 0

  return (
    <WizardLayout
      step={4}
      total={7}
      title="Teacher Manager"
      subtitle="Add teachers, assign their subjects and grade levels"
      onBack={() => navigate('/rooms')}
      onNext={() => navigate('/allocation')}
      nextDisabled={!canProceed}
      nextLabel="Next: Lesson Allocation"
    >
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-[--color-muted]" />
          <input
            type="text"
            placeholder="Search teachers by name, TSC, email…"
            value={searchQuery}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[--color-accent-light] bg-white text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-[--color-primary] placeholder-[--color-muted]"
          />
        </div>
        <Button icon="bi-plus-lg" onClick={handleOpenAdd}>
          Add Teacher
        </Button>
      </div>

      {/* Validation nudge */}
      {teachers.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl border border-[--color-warn] bg-[rgba(200,146,42,0.07)] flex items-start gap-3"
        >
          <i className="bi bi-exclamation-triangle-fill text-[--color-warn] mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#9B6E1A]">No teachers added yet</p>
            <p className="text-xs text-[#9B6E1A] mt-0.5">
              Add at least one teacher to proceed to Lesson Allocation.
            </p>
          </div>
        </motion.div>
      )}

      {/* Teacher grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonLoader key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {filteredTeachers.length === 0 && searchQuery && (
            <div className="text-center py-10 text-[--color-muted] text-sm">
              No teachers match "<strong>{searchQuery}</strong>"
            </div>
          )}
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeachers.map(t => (
                <TeacherCard
                  key={t.id}
                  teacher={t}
                  subjects={getSubjectsForTeacher(t.id)}
                  onEdit={handleOpenEdit}
                  onDelete={id => setDeleteTarget(teachers.find(x => x.id === id) ?? null)}
                />
              ))}
            </div>
          </AnimatePresence>
        </>
      )}

      {/* Summary footer */}
      {teachers.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-[--color-surface] border border-[--color-accent-light] flex items-center gap-4 flex-wrap text-sm text-[--color-muted]">
          <span className="flex items-center gap-1.5">
            <i className="bi bi-person-badge text-[--color-primary]" />
            <strong className="text-[--color-text]">{teachers.length}</strong> teacher{teachers.length !== 1 ? 's' : ''} added
          </span>
          <span className="flex items-center gap-1.5">
            <i className="bi bi-book text-[--color-primary]" />
            <strong className="text-[--color-text]">{teacherSubjects.length}</strong> subject assignments
          </span>
          <span className="flex items-center gap-1.5">
            <i className="bi bi-exclamation-circle text-[#C8922A]" />
            <strong className="text-[--color-text]">
              {teachers.filter(t => getSubjectsForTeacher(t.id).length === 0).length}
            </strong> without subjects
          </span>
        </div>
      )}

      {/* Modals */}
      <TeacherFormModal
        open={formOpen}
        teacher={editingTeacher}
        schoolId={schoolId}
        schoolLevels={schoolLevels}
        existingSubjects={editingTeacher ? getSubjectsForTeacher(editingTeacher.id) : []}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        name={deleteTarget?.name ?? ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </WizardLayout>
  )
}
