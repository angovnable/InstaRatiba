import { useState } from 'react'
import { Users, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { useStore } from '@/store'
import { DAYS, T } from '@/lib/constants'
import type { Teacher } from '@/types'
import toast from 'react-hot-toast'

const EMPTY: Omit<Teacher, 'id'> = {
  name: '', tsc: '', maxWeek: 27, maxDay: 7,
  isBOM: false, bomDays: [], unavailSlots: [],
}

function WorkloadRing({ load, max }: { load: number; max: number }) {
  const pct = Math.min(1, load / max)
  const r = 18, cx = 22, cy = 22
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  const color = load > max ? 'var(--danger)' : pct > 0.85 ? 'var(--warning)' : pct > 0.4 ? 'var(--success)' : 'var(--skyblue)'
  return (
    <div className="workload-ring">
      <svg width={44} height={44} viewBox="0 0 44 44">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-default)" strokeWidth={4} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s var(--ease-out)' }} />
      </svg>
      <div className="ring-label" style={{ color }}><span>{load}</span></div>
    </div>
  )
}

export function StepTeachers() {
  const { classes, teachers, addTeacher, deleteTeacher, updateTeacher, setStep, lang } = useStore()
  const t = T[lang]
  const [form, setForm] = useState<Omit<Teacher, 'id'>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [unavailDay, setUnavailDay] = useState('')
  const [unavailStart, setUnavailStart] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const patch = (p: Partial<Omit<Teacher, 'id'>>) => setForm(f => ({ ...f, ...p }))

  function handleSave() {
    if (!form.name.trim()) { toast.error('Teacher name required'); return }
    const unavailSlots = (unavailDay && unavailStart) ? [{ day: unavailDay, start: unavailStart }] : []
    const data = { ...form, unavailSlots }
    if (editId) {
      updateTeacher(editId, data)
      toast.success(`${form.name} updated`)
      setEditId(null)
    } else {
      addTeacher(data)
      toast.success(`${form.name} added ✓`)
    }
    setForm(EMPTY); setUnavailDay(''); setUnavailStart('')
  }

  function handleEdit(te: Teacher) {
    setForm({ name: te.name, tsc: te.tsc ?? '', maxWeek: te.maxWeek, maxDay: te.maxDay, isBOM: te.isBOM, bomDays: te.bomDays, unavailSlots: te.unavailSlots })
    setUnavailDay(te.unavailSlots[0]?.day ?? '')
    setUnavailStart(te.unavailSlots[0]?.start ?? '')
    setEditId(te.id)
  }

  function getLoad(tid: string) {
    let load = 0
    for (const cls of classes) for (const sub of cls.subjects) if (sub.teacherId === tid) load += sub.periods
    return load
  }

  function getAssigned(tid: string) {
    const res: { grade: string; stream: string; subject: string; color: string }[] = []
    for (const cls of classes) for (const sub of cls.subjects) if (sub.teacherId === tid)
      res.push({ grade: cls.grade, stream: cls.stream, subject: sub.name, color: sub.color || '#455A64' })
    return res
  }

  function assignTeacher(tid: string, classId: string, subjectId: string) {
    const store = useStore.getState()
    const cls = classes.find(c => c.id === classId)
    if (!cls) return

    // If deassigning (none selected), just remove this teacher from whatever subject they had
    if (!subjectId) {
      const updated = cls.subjects.map(s => s.teacherId === tid ? { ...s, teacherId: undefined } : s)
      store.updateClass(classId, { subjects: updated })
      return
    }

    const sub = cls.subjects.find(s => s.id === subjectId)
    const te = teachers.find(t => t.id === tid)
    if (sub && te) {
      const currentSubLoad = cls.subjects.find(s => s.id === subjectId)?.periods ?? 0
      const previousLoad = cls.subjects.find(s => s.teacherId === tid && s.id !== subjectId)?.periods ?? 0
      if (getLoad(tid) - previousLoad - currentSubLoad + sub.periods > te.maxWeek) {
        toast.error(`${te.name} would exceed ${te.maxWeek} lessons/week`); return
      }
    }

    // Find if this teacher already teaches another subject in this class — only clear that one
    const previousSubject = cls.subjects.find(s => s.teacherId === tid && s.id !== subjectId)
    const updated = cls.subjects
      .map(s => s.id === previousSubject?.id ? { ...s, teacherId: undefined } : s)
      .map(s => s.id === subjectId ? { ...s, teacherId: subjectId ? tid : undefined } : s)
    store.updateClass(classId, { subjects: updated })
  }

  const lbl = (text: string) => (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>{text}</label>
  )

  return (
    <section className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--orange-glow)', border: '1px solid color-mix(in srgb, var(--orange) 30%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Users size={22} style={{ color: 'var(--orange)' }} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{t.teachersStaff}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            {lang === 'sw' ? 'Ongeza walimu, weka mipaka, kisha gawanya masomo' : 'Add teachers, set constraints, assign subjects'}
          </p>
        </div>
      </div>

      <div className="steps-two-col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,300px) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        {/* FORM */}
        <div className="card">
          <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
            {editId ? (lang === 'sw' ? 'Hariri Mwalimu' : 'Edit Teacher') : (lang === 'sw' ? 'Ongeza Mwalimu' : 'Add Teacher')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>{lbl(lang === 'sw' ? 'Jina Kamili *' : 'Full Name *')}
              <input className="input-field" placeholder="e.g. Jane Mwangi" value={form.name} onChange={e => patch({ name: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleSave()} />
            </div>
            <div>{lbl('TSC Number')}
              <input className="input-field" style={{ fontFamily: 'var(--font-mono)' }} placeholder="Optional" value={form.tsc} onChange={e => patch({ tsc: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>{lbl(lang === 'sw' ? 'Maks/Wiki' : 'Max/Week')}
                <input type="number" className="input-field" min={1} max={45} value={form.maxWeek} onChange={e => patch({ maxWeek: +e.target.value })} />
              </div>
              <div>{lbl(lang === 'sw' ? 'Maks/Siku' : 'Max/Day')}
                <input type="number" className="input-field" min={1} max={9} value={form.maxDay} onChange={e => patch({ maxDay: +e.target.value })} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', transition: 'all 0.15s' }}>
              <input type="checkbox" checked={form.isBOM} onChange={e => patch({ isBOM: e.target.checked, bomDays: [] })} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Board of Management (BOM)</span>
            </label>

            {form.isBOM && (
              <div className="animate-slide-in">
                {lbl(lang === 'sw' ? 'Siku Zinazopatikana' : 'Available Days')}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {DAYS.map(day => (
                    <label key={day} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '5px 10px', borderRadius: 7, border: `1.5px solid ${form.bomDays.includes(day) ? 'var(--gold)' : 'var(--border-default)'}`, background: form.bomDays.includes(day) ? 'var(--gold-glow)' : 'var(--bg-elevated)', color: form.bomDays.includes(day) ? 'var(--gold-dark)' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                      <input type="checkbox" checked={form.bomDays.includes(day)} style={{ display: 'none' }}
                        onChange={e => patch({ bomDays: e.target.checked ? [...form.bomDays, day] : form.bomDays.filter(d => d !== day) })} />
                      {day.slice(0, 3)}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>{lbl(lang === 'sw' ? 'Siku Haipatikani' : 'Unavail Day')}
                <select className="input-field" value={unavailDay} onChange={e => setUnavailDay(e.target.value)}>
                  <option value="">— none —</option>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>{lbl(lang === 'sw' ? 'Kuanzia' : 'From Time')}
                <input type="time" className="input-field" value={unavailStart} onChange={e => setUnavailStart(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-orange" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave}>
                <Plus size={14} /> {editId ? (lang === 'sw' ? 'Hifadhi' : 'Save Changes') : (lang === 'sw' ? 'Ongeza' : 'Add Teacher')}
              </button>
              {editId && <button className="btn btn-ghost" onClick={() => { setEditId(null); setForm(EMPTY) }}><X size={14} /></button>}
            </div>
          </div>
        </div>

        {/* TEACHER LIST */}
        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {teachers.length === 0 ? (
            <div className="card" style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
              <Users size={44} style={{ opacity: 0.15 }} />
              <p style={{ fontSize: 13, fontStyle: 'italic' }}>{lang === 'sw' ? 'Ongeza mwalimu kwa fomu' : 'Add a teacher using the form'}</p>
            </div>
          ) : teachers.map(te => {
            const load = getLoad(te.id)
            const assigned = getAssigned(te.id)
            const isExpanded = expandedId === te.id
            const pct = load / te.maxWeek
            return (
              <div key={te.id} className="card animate-slide-in" style={{ padding: 0, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : te.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <WorkloadRing load={load} max={te.maxWeek} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{te.name}</span>
                      {te.isBOM && <span className="badge badge-gold">BOM</span>}
                      {load > te.maxWeek && <span className="badge badge-danger"><AlertTriangle size={8} /> Overloaded</span>}
                      {pct >= 0.9 && load <= te.maxWeek && <span className="badge badge-warning">Near limit</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {load}/{te.maxWeek} lessons · {assigned.length} assignment{assigned.length !== 1 ? 's' : ''}
                      {te.tsc ? ` · TSC ${te.tsc}` : ''}
                    </div>
                    {assigned.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {assigned.map((a, i) => (
                          <span key={i} style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: `${a.color}22`, border: `1px solid ${a.color}55`, color: a.color }}>
                            {a.grade.replace('Grade ', 'G')}{a.stream} · {a.subject}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button className="btn btn-secondary" style={{ padding: '5px 8px' }} onClick={() => handleEdit(te)}><Edit2 size={12} /></button>
                    <button className="btn btn-danger" style={{ padding: '5px 8px' }} onClick={() => { deleteTeacher(te.id); if (expandedId === te.id) setExpandedId(null); toast.success(`${te.name} removed`) }}><Trash2 size={12} /></button>
                    {isExpanded ? <ChevronUp size={15} style={{ color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 2 }} /> : <ChevronDown size={15} style={{ color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 2 }} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="animate-slide-in" style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 16px', background: 'var(--bg-elevated)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Subject Assignments</div>
                    {classes.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Add classes first.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {classes.map(cls => {
                          const available = cls.subjects.filter(s => !s.teacherId || s.teacherId === te.id)
                          const current = cls.subjects.find(s => s.teacherId === te.id)
                          return (
                            <div key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', fontSize: 12 }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', minWidth: 72 }}>{cls.grade.replace('Grade ', 'G')} {cls.stream}</span>
                              <select
                                style={{ flex: 1, padding: '5px 8px', borderRadius: 7, background: 'var(--bg-input)', border: `1px solid ${current ? 'var(--success)' : 'var(--border-default)'}`, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none' }}
                                value={current?.id ?? ''}
                                onChange={e => assignTeacher(te.id, cls.id, e.target.value)}
                              >
                                <option value="">— none —</option>
                                {available.map(sub => <option key={sub.id} value={sub.id}>{sub.name} ({sub.periods}p)</option>)}
                                {available.length === 0 && cls.subjects.length > 0 && <option disabled>All subjects assigned</option>}
                              </select>
                              {current && <span className="badge badge-success" style={{ fontSize: 9 }}>✓ {current.periods}p</span>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border-subtle)', marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={() => setStep(1)}><ChevronLeft size={15} /> {lang === 'sw' ? 'Rudi' : 'Back'}</button>
        <button className="btn btn-gold" onClick={() => setStep(3)} style={{ padding: '11px 26px' }}>
          {lang === 'sw' ? 'Ijayo: Tengeneza' : 'Next: Generate'} <ChevronRight size={16} />
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
