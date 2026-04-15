import { useState } from 'react'
import {
  Cpu, ChevronLeft, AlertTriangle, CheckCircle, Download, Printer,
  RefreshCw, BarChart2, FileText, FileSpreadsheet, Users, Layers,
  Share2, Loader2
} from 'lucide-react'
import { useStore } from '@/store'
import { solveAllClasses } from '@/lib/solver'
import {
  exportStreamPDF, exportTeacherPDF, exportAllClassesPDF,
  exportAllTeachersPDF, exportMasterPDF, exportMoEReportPDF
} from '@/lib/pdf'
import { exportExcel } from '@/lib/excel'
import { TimetableGrid } from '@/components/timetable/TimetableGrid'
import { AnalyticsDashboard } from '@/components/ui/AnalyticsDashboard'
import { T } from '@/lib/constants'
import toast from 'react-hot-toast'
import type { TimetableView } from '@/types'

function SkeletonGrid() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 6 }}>
          <div className="skeleton" style={{ width: 88, height: 52, flexShrink: 0 }} />
          {[...Array(5)].map((_, j) => (
            <div key={j} className="skeleton" style={{ flex: 1, height: 52, animationDelay: `${(i * 5 + j) * 0.04}s` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

type ActiveTab = 'view' | 'analytics'

export function StepGenerate() {
  const {
    school, classes, teachers, setStep,
    setGenerateResult, generatedTimetable,
    conflicts, warnings, compliance,
    saveTimetable, userId, lang,
  } = useStore()
  const t = T[lang]

  const [generating, setGenerating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [view, setView] = useState<TimetableView>('class')
  const [selectedId, setSelectedId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<ActiveTab>('view')
  const [bwMode, setBwMode] = useState(false)

  function handleGenerate() {
    if (classes.length === 0) { toast.error(lang === 'sw' ? 'Ongeza mkondo kwanza' : 'Add at least one stream first'); return }
    setGenerating(true)
    setTimeout(() => {
      try {
        const result = solveAllClasses(classes, teachers)
        setGenerateResult(result)
        if (!selectedId && classes.length > 0) setSelectedId(classes[0].id)
        const hasConflicts = result.conflicts.length > 0
        if ('vibrate' in navigator) navigator.vibrate(hasConflicts ? [100, 50, 100] : [60])
        toast[hasConflicts ? 'error' : 'success'](
          hasConflicts
            ? `Generated with ${result.conflicts.length} conflict(s)`
            : lang === 'sw' ? '🎉 Ratiba imefanikiwa!' : '🎉 Timetable generated successfully!',
          { duration: 4000 }
        )
      } catch (e: any) {
        toast.error('Generation failed: ' + e.message)
      } finally {
        setGenerating(false)
      }
    }, 80)
  }

  async function handleExcel() {
    if (!generatedTimetable) return
    setExporting(true)
    try {
      await exportExcel(school, classes, teachers, generatedTimetable)
      toast.success('Excel exported!')
    } catch (e: any) {
      toast.error('Excel export failed: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  function handleWhatsApp() {
    if (view === 'teacher' && selectedId) {
      const te = teachers.find(t => t.id === selectedId)
      const msg = encodeURIComponent(
        `${lang === 'sw' ? 'Ratiba yako ya wiki' : 'Your weekly timetable'} — ${school.name} ${school.term}\n${te?.name || ''}\nInstaRatiba — CBC Timetable System`
      )
      window.open(`https://wa.me/?text=${msg}`, '_blank')
    } else {
      const msg = encodeURIComponent(
        `${school.name} ${school.term} — ${lang === 'sw' ? 'Ratiba imetayarishwa' : 'Timetable ready'}\nInstaRatiba CBC System`
      )
      window.open(`https://wa.me/?text=${msg}`, '_blank')
    }
  }

  const totalSubjects = classes.reduce((s, c) => s + c.subjects.length, 0)
  const totalPeriods  = classes.reduce((s, c) => s + c.subjects.reduce((p, sub) => p + sub.periods, 0), 0)
  const allWarnings   = [...conflicts, ...warnings]
  const hasGenerated  = !!generatedTimetable

  const currentClass   = view === 'class'   ? classes.find(c => c.id === selectedId) : undefined
  const currentTeacher = view === 'teacher' ? teachers.find(te => te.id === selectedId) : undefined

  return (
    <section className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gold-glow)', border: '1px solid color-mix(in srgb, var(--gold) 40%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Cpu size={22} style={{ color: 'var(--gold)' }} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{t.generateTimetable}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            {lang === 'sw' ? 'Kagua mpangilio wako, kisha tengeneza ratiba isiyo na migongano' : 'Review setup then generate a conflict-free CBC timetable'}
          </p>
        </div>
      </div>

      {/* Summary + Generate */}
      <div className="card animate-slide-up" style={{ marginBottom: 16, textAlign: 'center', background: hasGenerated ? 'var(--bg-surface)' : 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { num: classes.length,  label: lang === 'sw' ? 'Mitiririko' : 'Streams',  color: 'var(--skyblue)' },
            { num: teachers.length, label: lang === 'sw' ? 'Walimu' : 'Teachers',     color: 'var(--orange)' },
            { num: totalSubjects,   label: lang === 'sw' ? 'Masomo' : 'Subjects',     color: 'var(--gold)' },
            { num: totalPeriods,    label: lang === 'sw' ? 'Vipindi' : 'Periods',     color: 'var(--success)' },
          ].map(({ num, label, color }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span className={hasGenerated ? '' : 'animate-bounce'} style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 38, color, lineHeight: 1, display: 'block' }}>{num}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>

        <button
          className={`btn ${hasGenerated ? 'btn-secondary' : 'btn-gold'} ${!hasGenerated ? 'animate-glow' : ''}`}
          onClick={handleGenerate}
          disabled={generating || classes.length === 0}
          style={{
            width: '100%', justifyContent: 'center',
            fontSize: 16, padding: '16px 28px', minHeight: 58,
            borderRadius: 12, fontWeight: 800, letterSpacing: '0.03em',
            ...(generating ? {
              background: 'linear-gradient(90deg, var(--accent) 0%, var(--skyblue) 50%, var(--accent) 100%)',
              backgroundSize: '200% 100%',
              animation: 'sweep 1.2s linear infinite',
              color: 'white',
            } : {})
          }}
        >
          {generating
            ? <><Cpu size={18} className="animate-spin" /> {lang === 'sw' ? 'Inatengeneza…' : 'Generating…'}</>
            : hasGenerated
              ? <><RefreshCw size={18} /> {t.regenerate}</>
              : <><Cpu size={18} /> {t.generateTimetable}</>
          }
        </button>
        <p style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
          Shortcut: <kbd style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border-default)', fontSize: 10 }}>Ctrl+G</kbd>
        </p>
      </div>

      {/* Skeleton while generating */}
      {generating && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
            {lang === 'sw' ? 'Inajaza ratiba yako…' : 'Building your timetable…'}
          </div>
          <SkeletonGrid />
        </div>
      )}

      {/* Warnings */}
      {!generating && allWarnings.length > 0 && (
        <div className="card animate-slide-in" style={{ marginBottom: 16, borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              {allWarnings.length} {lang === 'sw' ? 'Onyo' : 'Warning'}{allWarnings.length !== 1 ? 's' : ''}
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
            {allWarnings.map((w, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-secondary)', padding: '5px 10px', borderRadius: 6, background: 'var(--warning-glow)' }}>
                <AlertTriangle size={12} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
                <div><strong>{w.class}:</strong> {w.msg}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content after generation */}
      {!generating && hasGenerated && (
        <>
          {/* Tabs: View / Analytics */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {(['view', 'analytics'] as ActiveTab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                borderRadius: 9, background: activeTab === tab ? 'var(--gold-glow)' : 'var(--bg-elevated)',
                border: `1.5px solid ${activeTab === tab ? 'var(--gold)' : 'var(--border-subtle)'}`,
                color: activeTab === tab ? 'var(--gold-dark)' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                transition: 'all 0.18s', letterSpacing: '0.04em',
              }}>
                {tab === 'view' ? <Layers size={14} /> : <BarChart2 size={14} />}
                {tab === 'view' ? (lang === 'sw' ? 'Tazama Ratiba' : 'View Timetable') : (lang === 'sw' ? 'Takwimu' : 'Analytics')}
              </button>
            ))}
          </div>

          {activeTab === 'analytics' && <AnalyticsDashboard />}

          {activeTab === 'view' && (
            <div className="card animate-fade-in" style={{ marginBottom: 16 }}>
              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {/* View toggle */}
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', padding: 3, borderRadius: 10 }}>
                  {(['class', 'teacher'] as TimetableView[]).map(v => (
                    <button key={v}
                      onClick={() => {
                        setView(v)
                        setSelectedId(v === 'class' ? (classes[0]?.id ?? '') : (teachers[0]?.id ?? ''))
                      }}
                      style={{
                        padding: '6px 12px', borderRadius: 8,
                        background: view === v ? 'var(--bg-surface)' : 'transparent',
                        border: view === v ? '1px solid var(--border-default)' : '1px solid transparent',
                        color: view === v ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                        transition: 'all 0.15s', boxShadow: view === v ? 'var(--shadow-card)' : 'none',
                      }}>
                      {v === 'class' ? '🏫 ' + t.classView : '👤 ' + t.teacherView}
                    </button>
                  ))}
                </div>

                {/* Selector */}
                <select
                  style={{ flex: 1, minWidth: 120, maxWidth: 220, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none' }}
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                >
                  {view === 'class'
                    ? classes.map(c => <option key={c.id} value={c.id}>{c.grade} {c.stream}</option>)
                    : teachers.map(te => <option key={te.id} value={te.id}>{te.name}</option>)
                  }
                </select>

                {/* B&W toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={bwMode} onChange={e => setBwMode(e.target.checked)} />
                  B&amp;W
                </label>

                {/* Export actions */}
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" style={{ fontSize: 11, padding: '6px 10px' }} onClick={() => window.print()}>
                    <Printer size={12} /> Print
                  </button>

                  {/* Export dropdown group */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {view === 'class' && currentClass && (
                      <button className="btn btn-primary" style={{ fontSize: 11, padding: '6px 10px' }}
                        onClick={() => { exportStreamPDF(school, currentClass, teachers, generatedTimetable!, bwMode); toast.success('Stream PDF exported') }}>
                        <FileText size={12} /> {t.streamPDF}
                      </button>
                    )}
                    {view === 'teacher' && currentTeacher && (
                      <button className="btn btn-orange" style={{ fontSize: 11, padding: '6px 10px' }}
                        onClick={() => { exportTeacherPDF(school, currentTeacher, classes, generatedTimetable!, bwMode); toast.success('Teacher PDF exported') }}>
                        <Users size={12} /> {t.teacherPDF}
                      </button>
                    )}
                    <button className="btn btn-skyblue" style={{ fontSize: 11, padding: '6px 10px' }}
                      onClick={() => { exportMasterPDF(school, classes, teachers, generatedTimetable!); toast.success('Master PDF exported') }}>
                      <Layers size={12} /> {t.masterPDF}
                    </button>
                    <button className="btn btn-gold" style={{ fontSize: 11, padding: '6px 10px' }}
                      onClick={() => { exportMoEReportPDF(school, classes, compliance, teachers); toast.success('MoE Report exported') }}>
                      <FileText size={12} /> {t.complianceReport}
                    </button>
                    <button className="btn btn-secondary" style={{ fontSize: 11, padding: '6px 10px' }} onClick={handleExcel} disabled={exporting}>
                      {exporting ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />} {t.exportExcel}
                    </button>
                  </div>

                  {/* WhatsApp */}
                  <button className="btn" style={{ fontSize: 11, padding: '6px 10px', background: '#25D366', color: 'white' }} onClick={handleWhatsApp}>
                    <Share2 size={12} /> WhatsApp
                  </button>

                  {/* Save */}
                  {userId && (
                    <button className="btn btn-secondary" style={{ fontSize: 11, padding: '6px 10px' }} onClick={() => saveTimetable()}>
                      ☁ {t.save}
                    </button>
                  )}

                  {/* All-class & all-teacher PDFs */}
                  <button className="btn btn-ghost" style={{ fontSize: 11, padding: '6px 10px', border: '1px solid var(--border-default)' }}
                    onClick={() => { exportAllClassesPDF(school, classes, teachers, generatedTimetable!, bwMode); toast.success('All classes PDF exported') }}>
                    <Download size={12} /> All Classes
                  </button>
                  <button className="btn btn-ghost" style={{ fontSize: 11, padding: '6px 10px', border: '1px solid var(--border-default)' }}
                    onClick={() => { exportAllTeachersPDF(school, teachers, classes, generatedTimetable!); toast.success('All teachers PDF exported') }}>
                    <Download size={12} /> All Teachers
                  </button>
                </div>
              </div>

              {selectedId
                ? <TimetableGrid view={view} selectedId={selectedId} />
                : <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px', textAlign: 'center' }}>
                    {view === 'class' ? 'Select a class' : 'Select a teacher'}
                  </p>
              }
            </div>
          )}

          {/* Compliance dashboard */}
          {activeTab === 'view' && Object.keys(compliance).length > 0 && (
            <div className="card animate-slide-up" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 5, height: 18, borderRadius: 3, background: 'var(--gold)' }} />
                <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  {lang === 'sw' ? 'Ukaguzi wa Utiifu' : 'MoE Compliance Check'}
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {classes.map(cls => {
                  const comp = compliance[cls.id] ?? {}
                  const subjects = Object.values(comp)
                  const allOk = subjects.every(s => s.placed >= s.required)
                  return (
                    <div key={cls.id} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)', border: `1px solid ${allOk ? 'color-mix(in srgb, var(--success) 25%, transparent)' : 'color-mix(in srgb, var(--warning) 25%, transparent)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        {allOk ? <CheckCircle size={13} style={{ color: 'var(--success)' }} /> : <AlertTriangle size={13} style={{ color: 'var(--warning)' }} />}
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{cls.grade} {cls.stream}</span>
                        <span className={`badge ${allOk ? 'badge-success' : 'badge-warning'}`}>{allOk ? '✓ Complete' : '⚠ Incomplete'}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {subjects.map(s => (
                          <span key={s.name} style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
                            background: s.placed >= s.required ? 'var(--success-glow)' : 'var(--danger-glow)',
                            color: s.placed >= s.required ? 'var(--success)' : 'var(--danger)',
                            border: `1px solid ${s.placed >= s.required ? 'color-mix(in srgb, var(--success) 30%, transparent)' : 'color-mix(in srgb, var(--danger) 30%, transparent)'}`
                          }}>
                            {s.name}: {s.placed}/{s.required}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ paddingTop: 8 }}>
        <button className="btn btn-ghost" onClick={() => setStep(2)}><ChevronLeft size={15} /> {lang === 'sw' ? 'Rudi' : 'Back'}</button>
      </div>
    </section>
  )
}
