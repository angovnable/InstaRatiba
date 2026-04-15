import { useState } from 'react'
import { BookOpen, Plus, Trash2, ChevronRight, ChevronLeft, Minus, User, DoorOpen } from 'lucide-react'
import { useStore } from '@/store'
import { CBC_PRESETS, uid, getSubjectColor, T } from '@/lib/constants'
import type { SchoolClass, Subject, SchoolLevel } from '@/types'
import toast from 'react-hot-toast'

function getLevel(grade: string): SchoolLevel {
  if (['Grade 7', 'Grade 8', 'Grade 9'].includes(grade)) return 'jss'
  if (['Grade 4', 'Grade 5', 'Grade 6'].includes(grade)) return 'upper_primary'
  return 'lower_primary'
}

export function StepClasses() {
  const { classes, teachers, addClass, deleteClass, updateClass, setStep, lang } = useStore()
  const t = T[lang]
  const [grade, setGrade] = useState('Grade 7')
  const [stream, setStream] = useState('A')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedClass = classes.find(c => c.id === selectedId) ?? null

  function handleAdd() {
    if (!grade) { toast.error('Select a grade'); return }
    const s = stream.trim().toUpperCase() || 'A'
    
    if (classes.find(c => c.grade === grade && c.stream === s)) {
      toast.error(`${grade} ${s} already exists`); return
    }

    // Fixed: Passing parameters without manual ID to satisfy Omit<SchoolClass, "id">
    addClass({ 
      grade, 
      stream: s, 
      level: getLevel(grade), 
      subjects: [] 
    })
    
    // Note: If you need to select the new class immediately, ensure your 
    // store's addClass returns the new ID or use a different selection logic.
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
        // Fixed: Removed manual id: uid() to match store expectations
        addClass({ 
          grade: g, 
          stream: s, 
          level: getLevel(g), 
          subjects: [] 
        })
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

  function removeSubject(subId: string) {
    if (!selectedClass) return
    updateClass(selectedClass.id, { subjects: selectedClass.subjects.filter(s => s.id !== subId) })
  }

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
    const updated = selectedClass.subjects.map(s => {
      if (s.id === subId) return { ...s, teacherId: teacherId || undefined }
      if (s.teacherId === teacherId && teacherId) return { ...s, teacherId: undefined }
      return s
    })
    updateClass(selectedClass.id, { subjects: updated })
    if (teacherId) {
      const teacher = teachers.find(t => t.id === teacherId)
      toast.success(`${teacher?.name} assigned`)
    }
  }

  function getTeachersAlreadyAssigned(subName: string, excludeSubId: string): string[] {
    const taken = new Set<string>()
    for (const cls of classes) {
      if (cls.id === selectedClass?.id) continue
      for (const s of cls.subjects) {
        if (s.name === subName && s.teacherId && s.id !== excludeSubId) taken.add(s.teacherId)
      }
    }
    return [...taken]
  }

  const lbl = (text: string) => (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{text}</label>
  )

  return (
    <section className="animate-fade-in">
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
                  <button className="btn btn-danger" style={{ padding: '4px 8px', opacity: 0.7 }}
                    onClick={e => { e.stopPropagation(); deleteClass(cls.id); if (selectedId === cls.id) setSelectedId(null) }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px auto auto', gap: 8, padding: '4px 10px 8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
                    {['Subject', 'Teacher', 'Periods', ''].map((h, i) => (
                      <span key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: i === 2 ? 'center' : 'left' }}>{h}</span>
                    ))}
                  </div>

                  <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {selectedClass.subjects.map(sub => {
                      const color = sub.color || getSubjectColor(sub.name)
                      const assignedTeacher = teachers.find(te => te.id === sub.teacherId)
                      const takenIds = getTeachersAlreadyAssigned(sub.name, sub.id)
                      return (
                        <div key={sub.id} className="animate-fade-in" style={{
                          display: 'grid', gridTemplateColumns: '1fr 130px auto auto',
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
                              {teachers.map(te => {
                                const isTaken = takenIds.includes(te.id) && te.id !== sub.teacherId
                                let load = 0
                                for (const cls of classes) for (const s of cls.subjects) if (s.teacherId === te.id && !(cls.id === selectedClass.id && s.id === sub.id)) load += s.periods
                                const over = load + sub.periods > te.maxWeek
                                return (
                                  <option key={te.id} value={te.id} disabled={isTaken}>
                                    {isTaken ? `${te.name} (taken)` : over ? `${te.name} (${load}/${te.maxWeek} ⚠)` : `${te.name} (${load}/${te.maxWeek})`}
                                  </option>
                                )
                              })}
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

                          <button onClick={() => removeSubject(sub.id)} style={{ width: 24, height: 24, borderRadius: 6, background: 'none', border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                            <Trash2 size={10} />
                          </button>
                        </div>
                      )
                    })}
                  </div>

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