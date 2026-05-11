// ============================================================
// InstaRatiba — Segment 4
// Screen 6: Room / Venue Manager
// §4.2.8 — special-purpose rooms, conflict-blocking
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { v4 as uuid } from 'uuid'
import { useSchoolStore } from '@/store/schoolStore'
import { fetchRooms, upsertRoom, deleteRoom } from '@/lib/supabase/rooms'
import { CBC_SUBJECTS_BY_LEVEL } from '@/lib/cbc/subjects'
import type { Room, SchoolLevel } from '@/types'
import { Button, Card, Badge, Modal, Input, SkeletonLoader } from '@/components/ui'
import { WizardLayout } from '@/components/layout'

// ── Preset room templates ───────────────────────────────────
const ROOM_PRESETS: { name: string; icon: string; subjects: string[] }[] = [
  { name: 'Science Laboratory',   icon: 'bi-thermometer-half', subjects: ['sci_tech', 'integ_sci'] },
  { name: 'Computer Laboratory',  icon: 'bi-pc-display',        subjects: ['ict', 'cte'] },
  { name: 'Home Science Room',    icon: 'bi-house-heart',       subjects: ['home_sci'] },
  { name: 'Music Room',           icon: 'bi-music-note-beamed', subjects: ['creative_arts', 'creative_arts_sports'] },
  { name: 'Art / Craft Room',     icon: 'bi-palette',           subjects: ['creative_arts', 'creative_arts_sports'] },
  { name: 'Pre-Tech Workshop',    icon: 'bi-tools',             subjects: ['pre_tech'] },
  { name: 'Agriculture Shamba',   icon: 'bi-tree',              subjects: ['agri', 'agri_nutrition'] },
  { name: 'Library',              icon: 'bi-book',              subjects: [] },
  { name: 'Sports Ground / Gym',  icon: 'bi-dribbble',          subjects: ['phe', 'creative_arts_sports'] },
]

const LEVEL_LABELS: Record<SchoolLevel, string> = {
  lower_primary:    'Lower Primary (Gr 1–3)',
  upper_primary:    'Upper Primary (Gr 4–6)',
  junior_secondary: 'Junior Secondary (Gr 7–9)',
}

// ── Room Form Modal ──────────────────────────────────────────
interface RoomFormProps {
  room: Room | null
  open: boolean
  schoolLevels: SchoolLevel[]
  onClose: () => void
  onSave: (room: Room) => void
  schoolId: string
}

function RoomFormModal({ room, open, schoolLevels, onClose, onSave, schoolId }: RoomFormProps) {
  const isEdit = !!room?.name
  const [name, setName]             = useState('')
  const [capacity, setCapacity]     = useState('')
  const [subjectCodes, setSubjectCodes] = useState<string[]>([])
  const [levels, setLevels]         = useState<SchoolLevel[]>([])
  const [preset, setPreset]         = useState<string>('')

  useEffect(() => {
    if (room) {
      setName(room.name)
      setCapacity(room.capacity?.toString() ?? '')
      setSubjectCodes(room.subject_codes)
      setLevels(room.levels)
    } else {
      setName(''); setCapacity(''); setSubjectCodes([]); setLevels([])
    }
    setPreset('')
  }, [room, open])

  // All subjects for the selected levels
  const availableSubjects = levels.flatMap(l =>
    (CBC_SUBJECTS_BY_LEVEL[l] ?? []).map(s => ({ code: s.code, name: s.name, level: l }))
  ).filter((v, i, a) => a.findIndex(x => x.code === v.code) === i)

  const applyPreset = (p: typeof ROOM_PRESETS[0]) => {
    setName(p.name)
    setSubjectCodes(p.subjects)
  }

  const toggleSubject = (code: string) =>
    setSubjectCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])

  const toggleLevel = (l: SchoolLevel) =>
    setLevels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])

  const handleSave = () => {
    if (!name.trim()) { toast.error('Room name is required'); return }
    if (levels.length === 0) { toast.error('Select at least one school level'); return }
    onSave({
      id:            room?.id ?? uuid(),
      school_id:     schoolId,
      name:          name.trim(),
      capacity:      capacity ? parseInt(capacity) : undefined,
      subject_codes: subjectCodes,
      levels,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Room' : 'Add Room / Venue'} size="md">
      <div className="space-y-5 p-1">

        {/* Presets (only when creating) */}
        {!isEdit && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-[--color-muted] uppercase tracking-wide">Quick presets</p>
            <div className="flex flex-wrap gap-2">
              {ROOM_PRESETS.map(p => (
                <button key={p.name}
                  onClick={() => applyPreset(p)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border border-[--color-accent-light] hover:border-[--color-primary] hover:bg-[--color-surface] transition-colors"
                >
                  <i className={p.icon} /> {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <Input label="Room Name *" value={name} onChange={e => setName(e.target.value)}
               placeholder="e.g. Science Laboratory" />
        <Input label="Capacity (optional)" type="number" value={capacity}
               onChange={e => setCapacity(e.target.value)} placeholder="e.g. 40 students" />

        {/* School levels this room serves */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[--color-muted] uppercase tracking-wide">
            Used by *
          </label>
          <div className="flex flex-wrap gap-2">
            {schoolLevels.map(l => (
              <button key={l} onClick={() => toggleLevel(l)}
                className={`px-3 py-1.5 text-xs rounded-xl border-2 font-medium transition-all ${
                  levels.includes(l)
                    ? 'border-[--color-primary] bg-[--color-surface] text-[--color-primary]'
                    : 'border-[--color-accent-light] text-[--color-muted] hover:border-[--color-mid]'
                }`}>
                {LEVEL_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Subject assignment */}
        {availableSubjects.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-[--color-muted] uppercase tracking-wide">
              Subjects using this room
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {availableSubjects.map(s => (
                <button key={s.code} onClick={() => toggleSubject(s.code)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                    subjectCodes.includes(s.code)
                      ? 'bg-[--color-primary] text-white border-[--color-primary]'
                      : 'border-[--color-accent-light] text-[--color-text] hover:border-[--color-mid]'
                  }`}>
                  {s.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-[--color-muted]">
              The generator will block double-booking for these subjects in this room.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSave} className="flex-1">
            {isEdit ? 'Save Changes' : 'Add Room'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Room Card ────────────────────────────────────────────────
interface RoomCardProps {
  room: Room
  onEdit: (r: Room) => void
  onDelete: (id: string) => void
}

function RoomCard({ room, onEdit, onDelete }: RoomCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-2xl border border-[--color-accent-light] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[--color-surface] flex items-center justify-center">
              <i className="bi bi-door-open text-[--color-primary]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[--color-text]">{room.name}</p>
              {room.capacity && (
                <p className="text-xs text-[--color-muted]">Capacity: {room.capacity}</p>
              )}
            </div>
          </div>
        </div>

        {/* Levels */}
        <div className="flex flex-wrap gap-1">
          {room.levels.map(l => (
            <span key={l} className="text-xs px-2 py-0.5 rounded-full bg-[--color-surface] text-[--color-muted] border border-[--color-accent-light]">
              {LEVEL_LABELS[l].split('(')[0].trim()}
            </span>
          ))}
        </div>

        {/* Subject chips */}
        {room.subject_codes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {room.subject_codes.slice(0, 3).map(code => (
              <span key={code} className="text-xs px-2 py-0.5 rounded-full bg-[--color-primary] text-white">
                {code}
              </span>
            ))}
            {room.subject_codes.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[--color-surface] text-[--color-muted]">
                +{room.subject_codes.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(room)} className="flex-1">
            <i className="bi bi-pencil mr-1" /> Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(room.id)}
                  className="text-[--color-error] hover:bg-[#FCE4EC]">
            <i className="bi bi-trash" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function RoomManagerPage() {
  const navigate  = useNavigate()
  const { school } = useSchoolStore()
  const schoolId   = school?.id ?? ''
  const levels     = (school?.levels ?? []) as SchoolLevel[]

  const [rooms, setRooms]     = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [formTarget, setFormTarget]   = useState<Room | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)
  const [showForm, setShowForm]       = useState(false)
  const [saving, setSaving]           = useState(false)

  // ── Load ───────────────────────────────────────────────
  useEffect(() => {
    if (!schoolId) return
    fetchRooms(schoolId)
      .then(setRooms)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [schoolId])

  // ── Save ───────────────────────────────────────────────
  const handleSave = useCallback(async (room: Room) => {
    setSaving(true)
    try {
      await upsertRoom(room)
      setRooms(prev => {
        const exists = prev.find(r => r.id === room.id)
        return exists ? prev.map(r => r.id === room.id ? room : r) : [...prev, room]
      })
      setShowForm(false)
      setFormTarget(null)
      toast.success(formTarget ? 'Room updated' : 'Room added')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }, [formTarget])

  // ── Delete ─────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteRoom(deleteTarget.id)
      setRooms(prev => prev.filter(r => r.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast.success('Room removed')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }, [deleteTarget])

  const openEdit = (room: Room) => { setFormTarget(room); setShowForm(true) }
  const openAdd  = () => { setFormTarget(null); setShowForm(true) }

  return (
    <WizardLayout step={2} title="Room Manager" subtitle="Define special-purpose venues">
      <div className="max-w-4xl mx-auto pb-24">

        {/* Info banner */}
        <div className="mb-5 flex gap-3 p-3 rounded-xl bg-[--color-surface] border border-[--color-accent-light] text-sm">
          <i className="bi bi-info-circle text-[--color-info] text-lg flex-shrink-0 mt-0.5" />
          <p className="text-[--color-text]">
            Define special-purpose rooms (labs, computer rooms, etc.). The generator will
            prevent two classes from using the same room at the same time.
            Regular classrooms do not need to be added here.
          </p>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Badge variant={rooms.length > 0 ? 'success' : 'neutral'}>
            {rooms.length} room{rooms.length !== 1 ? 's' : ''} defined
          </Badge>
          <Button variant="primary" onClick={openAdd}>
            <i className="bi bi-plus-lg mr-1" /> Add Room
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonLoader key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && rooms.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-16">
            <i className="bi bi-door-open text-6xl text-[--color-accent-light]" />
            <h3 className="mt-4 text-lg font-semibold text-[--color-text]">No rooms defined</h3>
            <p className="mt-1 text-sm text-[--color-muted] max-w-sm mx-auto">
              Add special-purpose venues. This step is optional — skip if your school has no shared spaces.
            </p>
          </motion.div>
        )}

        {/* Grid */}
        {!loading && (
          <AnimatePresence>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {rooms.map(room => (
                <RoomCard key={room.id} room={room}
                          onEdit={openEdit}
                          onDelete={id => setDeleteTarget(rooms.find(r => r.id === id) ?? null)} />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/classes')}>
            <i className="bi bi-arrow-left mr-1" /> Back
          </Button>
          <Button variant="primary" size="lg" className="flex-1"
                  onClick={() => navigate('/teachers')}>
            Continue to Teachers <i className="bi bi-arrow-right ml-2" />
          </Button>
        </div>
      </div>

      {/* Form Modal */}
      <RoomFormModal
        open={showForm}
        room={formTarget}
        schoolLevels={levels}
        schoolId={schoolId}
        onClose={() => { setShowForm(false); setFormTarget(null) }}
        onSave={handleSave}
      />

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
             title="Delete Room?" size="sm">
        <div className="space-y-4 p-1">
          <p className="text-sm text-[--color-text]">
            Delete <strong>{deleteTarget?.name}</strong>? Any subject assignments to this room
            will be removed.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} className="flex-1">Cancel</Button>
            <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
          </div>
        </div>
      </Modal>
    </WizardLayout>
  )
}
