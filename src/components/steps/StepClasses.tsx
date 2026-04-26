import { useState } from 'react'
import { BookOpen, Plus, Trash2, ChevronRight, ChevronLeft, Minus, Edit2, DoorOpen, X, Check } from 'lucide-react'
import { useStore } from '@/store'
import { CBC_PRESETS, uid, getSubjectColor, SUBJECT_COLORS, T } from '@/lib/constants'
import type { SchoolClass, Subject, SchoolLevel } from '@/types'
import toast from 'react-hot-toast'

function getLevel(grade: string): SchoolLevel {
  if (['Grade 7', 'Grade 8', 'Grade 9'].includes(grade)) return 'jss'
  if (['Grade 4', 'Grade 5', 'Grade 6'].includes(grade)) return 'upper_primary'
  return 'lower_primary'
}

// Simple confirmation dialog
function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="card animate-scale-in" style={{ maxWidth: 360, width: '90%', padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}><Trash2 size={13} /> Delete</button>
        </div>
      </div>
    </div>
  )
}

// Inline subject edit modal
function EditSubjectModal({ subject, onSave, onClose }: {
  subject: Subject
  onSave: (updated: Partial<Subject>) => void
  onClose: () => void
}) {
  const [name, setName] = useState(subject.name)
  const [color, setColor] = useState(subject.color || getSubjectColor(subject.name))

  const presetColors = Object.values(SUBJECT_COLORS).filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="card animate-scale-in" style={{ maxWidth: 340, width: '90%', padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Edit Subject</h3>
          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}><X size={14} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Subject Name</label>
            <input
              className="input-field"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onSave({ name, color })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {presetColors.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 24, height: 24, borderRadius: '50%', background: c, border: `2.5px solid ${color === c ? 'white' : 'transparent'}`,
                  outline: color === c ? `2px solid ${c}` : 'none', cursor: 'pointer', transition: 'all 0.15s',
                }} />
              ))}
            </div>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ width: '100%', height: 36, borderRadius: 8, border: '1px solid var(--border-default)', cursor: 'pointer', background: 'var(--bg-input)' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => onSave({ name: name.trim() || subject.name, color })}>
              <Check size={13} /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function StepClasses() {
  const { classes, teachers, addClass, deleteClass, updateClass, setStep, lang } = useStore()
  const t = T[lang]
  const [grade, setGrade] = useState('Grade 7')
  const [stream, setStream] = useState('A')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedClass = classes.find(c => c.id === selectedId) ?? null

  // FIX #13: confirmation state
  const [confirmDeleteClass, setConfirmDeleteClass] = useState<string | null>(null)
  const [confirmDeleteSubject, setConfirmDeleteSubject] = useState<string | null>(null)

  // FIX #12: edit subject modal state
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)

  // FIX #15: custom subject form
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [customSubjectName, setCustomSubjectName] = useState('')
  const [customSubjectColor, setCustomSubjectColor] = useState('#455A64')

  function handleAdd() {
    if (!grade) { toast.error('Select a grade'); return }
    const s = stream.trim().toUpperCase() || 'A'
    if (classes.find(c => c.grade === grade && c.stream === s)) {
      toast.error(`${grade} ${s} already exists`); return
    }
    addClass({ grade, stream: s, level: getLevel(grade), subjects: [] })
    setStream('')
    toast.success(`${grade} ${s} added ✓`)
  }

  function handleQuickAdd(type: 'jss' | 'primary' | 'lower') {
    const map: Record<string, [string, string][]> = {
      jss:     [['Grade 7','A'],['Grade 8','A'],['Grade 9','A']],
      primary: [['Grade 4','A'],['Grade 5','A'],['Grade 6','A']],
      lower:   [['Grade 1','A'],['Grade 2','A'],['Grade 3','A']],
    }
    let added = 0
    for (const [g, s] of map[type]) {
      if (!classes.find(c => c.grade === g && c.stream === s)) {
        addClass({ grade: g, stream: s, level: getLevel(g), subjects: [] })
        added++
      }
    }
    toast(added > 0 ? `Added ${added} stream(s)` : 'Streams already added', { icon: added > 0 ? '✓' : 'ℹ️' })
  }

  function handleLoadPreset() {
    if (!selectedClass) return
    const preset = CBC_PRESETS[selectedClass.level]
    if (!preset) return
    const subjects: Subject[] = preset.subjects.map(s => ({ ...s, id: uid() }))
    updateClass(selectedClass.id, { subjects })
    toast.success(`Loaded ${preset.label} (${subjects.length} subjects)`)
  }

  function changePeriod(subId: string, delta: number) {
    if (!selectedClass) return
    const updated = selectedClass.subjects.map(s =>
      s.id === subId ? { ...s, periods: Math.max(1, s.periods + delta) } : s
    )
    updateClass(selectedClass.id, { subjects: updated })
  }

  // FIX #13: confirmed delete subject
  function removeSubject(subId: string) {
    setConfirmDeleteSubject(subId)
  }

  function confirmRemoveSubject() {
    if (!selectedClass || !confirmDeleteSubject) return
    updateClass(selectedClass.id, { subjects: selectedClass.subjects.filter(s => s.id !== confirmDeleteSubject) })
    setConfirmDeleteSubject(null)
  }

  // FIX #3: Fixed assignTeacherToSubject — no longer clears teacher from OTHER subjects in the same class
  function assignTeacherToSubject(subId: string, teacherId: string) {
    if (!selectedClass) return
    if (teacherId) {
      const sub = selectedClass.subjects.find(s => s.id === subId)
      const teacher = teachers.find(t => t.id === teacherId)
      if (sub && teacher) {
        let currentLoad = 0
        for (const cls of classes) {
          for (const s of cls.subjects) {
            if (s.teacherId === teacherId && !(cls.id === selectedClass.id && s.id === subId)) currentLoad += s.periods
          }
        }
        if (currentLoad + sub.periods > teacher.maxWeek) {
          toast.error(`${teacher.name} would exceed ${teacher.maxWeek} lessons/week`); return
        }
      }
    }
    // FIXED: only update the targeted subject — don't touch other subjects
    const updated = selectedClass.subjects.map(s => {
      if (s.id === subId) return { ...s, teacherId: teacherId || undefined }
      return s
    })
    updateClass(selectedClass.id, { subjects: updated })
    if (teacherId) {
      const teacher = teachers.find(t => t.id === teacherId)
      toast.success(`${teacher?.name} assigned`)
    }
  }

  // FIX #12: save edited subject
  function handleSaveSubjectEdit(updated: Partial<Subject>) {
    if (!selectedClass || !editingSubject) return
    const subjects = selectedClass.subjects.map(s =>
      s.id === editingSubject.id ? { ...s, ...updated } : s
    )
    updateClass(selectedClass.id, { subjects })
    setEditingSubject(null)
    toast.success('Subject updated')
  }

  // FIX #15: add custom subject
  function handleAddCustomSubject() {
    if (!selectedClass || !customSubjectName.trim()) { toast.error('Enter a subject name'); return }
    const newSub: Subject = {
      id: uid(),
      name: customSubjectName.trim(),
      periods: 2,
      color: customSubjectColor,
      isCore: false,
    }
    updateClass(selectedClass.id, { subjects: [...selectedClass.subjects, newSub] })
    setCustomSubjectName('')
    setCustomSubjectColor('#455A64')
    setShowAddSubject(false)
    toast.success(`"${newSub.name}" added`)
  }

  // FIX #5: show all teachers with a "(taken)" label rather than hiding them
  function getTeacherLabel(te: { id: string; name: string; maxWeek: number }, sub: Subject): string {
    let load = 0
    for (const cls of classes) {
      for (const s of cls.subjects) {
        if (s.teacherId === te.id && !(cls.id === selectedClass?.id && s.id === sub.id)) load += s.periods
      }
    }
    const over = load + sub.periods > te.maxWeek
    // Check if teacher is already assigned to a DIFFERENT subject in THIS class
    const takenInClass = selectedClass?.subjects.some(s => s.teacherId === te.id && s.id !== sub.id)
    if (takenInClass) return `${te.name} (already in class)`
    if (over) return `${te.name} (${load}/${te.maxWeek} ⚠)`
    return `${te.name} (${load}/${te.maxWeek})`
  }

  const lbl = (text: string) => (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{text}</label>
  )

  return (
    <section className="animate-fade-in">
      {/* Confirm delete class modal */}
      {confirmDeleteClass && (
        <ConfirmModal
          message="Delete this class and all its subject assignments? This cannot be undone."
          onConfirm={() => {
            deleteClass(confirmDeleteClass)
            if (selectedId === confirmDeleteClass) setSelectedId(null)
            setConfirmDeleteClass(null)
          }}
          onCancel={() => setConfirmDeleteClass(null)}
        />
      )}

      {/* Confirm delete subject modal */}
      {confirmDeleteSubject && (
        <ConfirmModal
          message="Remove this subject from the class?"
          onConfirm={confirmRemoveSubject}
          onCancel={() => setConfirmDeleteSubject(null)}
        />
      )}

      {/* Edit subject modal */}
      {editingSubject && (
        <EditSubjectModal
          subject={editingSubject}
          onSave={handleSaveSubjectEdit}
          onClose={() => setEditingSubject(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--success-glow)', border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookOpen size={22} style={{ color: 'var(--success)' }} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{t.classesSubjects}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            {lang === 'sw' ? 'Ongeza mitiririko, pakia masomo ya CBC, weka walimu' : 'Add streams, load CBC subjects, assign teachers'}
          </p>
        </div>
      </div>

      <div className="steps-two-col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,280px) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        {/* LEFT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
              {lang === 'sw' ? 'Ongeza Mkondo' : 'Add Stream'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                {lbl(lang === 'sw' ? 'Darasa' : 'Grade')}
                <select className="input-field" value={grade} onChange={e => setGrade(e.target.value)}>
                  {['Grade 7','Grade 8','Grade 9','Grade 4','Grade 5','Grade 6','Grade 1','Grade 2','Grade 3'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                {lbl('Stream')}
                <input className="input-field" placeholder="A, B, Red, East…" value={stream}
                  onChange={e => setStream(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              </div>
              <button className="btn btn-primary" onClick={handleAdd} style={{ justifyContent: 'center' }}>
                <Plus size={14} /> {lang === 'sw' ? 'Ongeza Mkondo' : 'Add Stream'}
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 14, paddingTop: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Quick Add</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[['jss','JSS 7–9'],['primary','Upper 4–6'],['lower','Lower 1–3']].map(([k, l]) => (
                  <button key={k} className="btn btn-secondary" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => handleQuickAdd(k as any)}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Stream list */}
          <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {classes.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                {lang === 'sw' ? 'Hakuna mitiririko bado.' : 'No streams yet.'}
              </div>
            ) : classes.map(cls => {
              const totalP = cls.subjects.reduce((s, sub) => s + sub.periods, 0)
              const assigned = cls.subjects.filter(s => s.teacherId).length
              const isSelected = selectedId === cls.id
              return (
                <div key={cls.id} onClick={() => setSelectedId(cls.id)} className="animate-slide-in card-hover"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 14px', borderRadius: 12,
                    background: isSelected ? 'color-mix(in srgb, var(--gold) 12%, var(--bg-surface))' : 'var(--bg-surface)',
                    border: `1.5px solid ${isSelected ? 'var(--gold)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer', transition: 'all 0.18s',
                    boxShadow: isSelected ? 'var(--shadow-gold)' : 'var(--shadow-card)',
                  }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                      {cls.grade} {cls.stream}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {cls.subjects.length} subjects · {totalP} periods · {assigned}/{cls.subjects.length} assigned
                    </div>
                    {cls.roomName && (
                      <div style={{ fontSize: 10, color: 'var(--skyblue)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <DoorOpen size={9} /> {cls.roomName}
                      </div>
                    )}
                  </div>
                  {/* FIX #13: confirmation before delete */}
                  <button className="btn btn-danger" style={{ padding: '4px 8px', opacity: 0.7 }}
                    onClick={e => { e.stopPropagation(); setConfirmDeleteClass(cls.id) }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT: Subject panel */}
        <div>
          {!selectedClass ? (
            <div className="card" style={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
              <BookOpen size={44} style={{ opacity: 0.18 }} />
              <p style={{ fontSize: 13, fontStyle: 'italic' }}>
                {lang === 'sw' ? 'Chagua mkondo kushughulikia masomo' : 'Select a stream to manage subjects'}
              </p>
            </div>
          ) : (
            <div className="card animate-scale-in">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
                    {selectedClass.grade} {selectedClass.stream}
                  </h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{CBC_PRESETS[selectedClass.level]?.label}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    className="input-field"
                    placeholder={lang === 'sw' ? 'Chumba (hiari)' : 'Room name (optional)'}
                    value={selectedClass.roomName || ''}
                    onChange={e => updateClass(selectedClass.id, { roomName: e.target.value })}
                    style={{ width: 140, fontSize: 12 }}
                  />
                  <button className="btn btn-gold" style={{ fontSize: 12, padding: '7px 14px' }} onClick={handleLoadPreset}>
                    {lang === 'sw' ? 'Pakia CBC' : 'Load CBC Preset'}
                  </button>
                </div>
              </div>

              {selectedClass.subjects.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, border: '2px dashed var(--border-default)', borderRadius: 10 }}>
                  {lang === 'sw'
                    ? 'Bado hakuna masomo. Bonyeza "Pakia CBC" kujaza kiotomatiki.'
                    : 'No subjects yet. Click "Load CBC Preset" to auto-fill.'}
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px auto auto auto', gap: 8, padding: '4px 10px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
                    {['Subject', 'Teacher', 'Periods', '', ''].map((h, i) => (
                      <span key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: i === 2 ? 'center' : 'left' }}>{h}</span>
                    ))}
                  </div>

                  <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {selectedClass.subjects.map(sub => {
                      const color = sub.color || getSubjectColor(sub.name)
                      return (
                        <div key={sub.id} className="animate-fade-in" style={{
                          display: 'grid', gridTemplateColumns: '1fr 130px auto auto auto',
                          gap: 8, alignItems: 'center',
                          padding: '8px 10px', borderRadius: 9,
                          border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-elevated)',
                          transition: 'background 0.15s',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 0 2px ${color}33` }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.name}</div>
                              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                {sub.isCore ? 'core' : sub.isOptional ? 'optional' : 'elective'}
                                {sub.doubleMandatory ? ` · ×${sub.doubleCount} double` : ''}
                                {sub.locked ? ' · 🔒 locked' : ''}
                              </div>
                            </div>
                          </div>

                          {/* FIX #5: show ALL teachers, label taken ones instead of hiding */}
                          <div>
                            <select
                              value={sub.teacherId ?? ''}
                              onChange={e => assignTeacherToSubject(sub.id, e.target.value)}
                              style={{
                                width: '100%', padding: '5px 6px', borderRadius: 7,
                                background: sub.teacherId ? 'color-mix(in srgb, var(--success) 10%, var(--bg-input))' : 'var(--bg-input)',
                                border: `1.5px solid ${sub.teacherId ? 'var(--success)' : 'var(--border-default)'}`,
                                color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 11,
                                outline: 'none', cursor: 'pointer', transition: 'border-color 0.15s',
                              }}
                            >
                              <option value="">— assign —</option>
                              {teachers.map(te => (
                                <option key={te.id} value={te.id}>
                                  {getTeacherLabel(te, sub)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button onClick={() => changePeriod(sub.id, -1)} style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                              <Minus size={10} />
                            </button>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, minWidth: 20, textAlign: 'center', fontWeight: 800, color: 'var(--text-primary)' }}>{sub.periods}</span>
                            <button onClick={() => changePeriod(sub.id, 1)} style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                              <Plus size={10} />
                            </button>
                          </div>

                          {/* FIX #12: edit button */}
                          <button onClick={() => setEditingSubject(sub)} style={{ width: 24, height: 24, borderRadius: 6, background: 'none', border: '1px solid var(--border-default)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <Edit2 size={10} />
                          </button>

                          {/* FIX #13: confirmation before delete subject */}
                          <button onClick={() => removeSubject(sub.id)} style={{ width: 24, height: 24, borderRadius: 6, background: 'none', border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* FIX #15: Add custom subject */}
                  {showAddSubject ? (
                    <div className="animate-slide-in" style={{ marginTop: 10, padding: '12px 14px', borderRadius: 10, border: '1.5px dashed var(--border-default)', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Custom Subject</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          className="input-field"
                          placeholder="Subject name…"
                          value={customSubjectName}
                          onChange={e => setCustomSubjectName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddCustomSubject()}
                          style={{ flex: 1, fontSize: 12 }}
                          autoFocus
                        />
                        <input
                          type="color"
                          value={customSubjectColor}
                          onChange={e => setCustomSubjectColor(e.target.value)}
                          style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border-default)', cursor: 'pointer', background: 'var(--bg-input)', padding: 2 }}
                        />
                        <button className="btn btn-primary" style={{ padding: '7px 12px', fontSize: 12 }} onClick={handleAddCustomSubject}>
                          <Check size={13} /> Add
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '7px 10px' }} onClick={() => { setShowAddSubject(false); setCustomSubjectName('') }}>
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn btn-ghost"
                      style={{ marginTop: 10, width: '100%', justifyContent: 'center', fontSize: 12, border: '1.5px dashed var(--border-default)', borderRadius: 9, padding: '8px' }}
                      onClick={() => setShowAddSubject(true)}
                    >
                      <Plus size={13} /> {lang === 'sw' ? 'Ongeza Somo la Ziada' : 'Add Custom Subject'}
                    </button>
                  )}

                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Total periods/week:</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-primary)', fontSize: 14 }}>
                      {selectedClass.subjects.reduce((s, sub) => s + sub.periods, 0)}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={() => setStep(0)}><ChevronLeft size={15} /> {lang === 'sw' ? 'Rudi' : 'Back'}</button>
        <button className="btn btn-gold" onClick={() => setStep(2)} style={{ padding: '11px 26px' }}>
          {lang === 'sw' ? 'Ijayo: Walimu' : 'Next: Teachers'} <ChevronRight size={16} />
        </button>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .steps-two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
