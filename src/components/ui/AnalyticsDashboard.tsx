import { BarChart2, Users, BookOpen, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { useStore } from '@/store'
import { T } from '@/lib/constants'

export function AnalyticsDashboard() {
  const { classes, teachers, compliance, conflicts, warnings, generatedTimetable, lang } = useStore()
  const t = T[lang]

  // Teacher workload data
  const teacherStats = teachers.map(te => {
    let load = 0
    for (const cls of classes) for (const sub of cls.subjects) if (sub.teacherId === te.id) load += sub.periods
    return { ...te, load, pct: Math.min(100, Math.round((load / te.maxWeek) * 100)) }
  }).sort((a, b) => b.pct - a.pct)

  // Subject coverage
  const subjectTotals: Record<string, number> = {}
  for (const cls of classes) for (const sub of cls.subjects) {
    subjectTotals[sub.name] = (subjectTotals[sub.name] || 0) + sub.periods
  }

  // Compliance summary
  let totalOk = 0, totalMissing = 0
  for (const clsComp of Object.values(compliance)) {
    for (const item of Object.values(clsComp)) {
      if (item.placed >= item.required) totalOk++
      else totalMissing++
    }
  }
  const totalSubjectSlots = totalOk + totalMissing
  const compliancePct = totalSubjectSlots > 0 ? Math.round((totalOk / totalSubjectSlots) * 100) : 0

  const totalPeriods = classes.reduce((s, c) => s + c.subjects.reduce((p, sub) => p + sub.periods, 0), 0)
  const assignedSubjects = classes.reduce((s, c) => s + c.subjects.filter(sub => sub.teacherId).length, 0)
  const totalSubjectCount = classes.reduce((s, c) => s + c.subjects.length, 0)

  const stats = [
    { label: lang === 'sw' ? 'Mitiririko' : 'Streams', value: classes.length, color: 'var(--skyblue)' },
    { label: lang === 'sw' ? 'Walimu' : 'Teachers', value: teachers.length, color: 'var(--orange)' },
    { label: lang === 'sw' ? 'Vipindi/Wiki' : 'Periods/Week', value: totalPeriods, color: 'var(--gold)' },
    { label: lang === 'sw' ? 'Utiifu wa MoE' : 'MoE Compliance', value: `${compliancePct}%`, color: compliancePct >= 90 ? 'var(--success)' : 'var(--warning)' },
  ]

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        {stats.map(({ label, value, color }) => (
          <div key={label} className="card card-hover" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color, lineHeight: 1, marginBottom: 6 }}>{value}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Teacher workload bars */}
      {teacherStats.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 5, height: 18, borderRadius: 3, background: 'var(--orange)' }} />
            <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {lang === 'sw' ? 'Mzigo wa Walimu' : 'Teacher Workload'}
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {teacherStats.map(te => {
              const color = te.load > te.maxWeek ? 'var(--danger)' : te.pct > 85 ? 'var(--warning)' : te.pct > 40 ? 'var(--success)' : 'var(--skyblue)'
              return (
                <div key={te.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{te.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color, fontWeight: 700 }}>{te.load}/{te.maxWeek}</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 5, width: `${te.pct}%`, background: color, transition: 'width 0.7s var(--ease-out)' }} />
                  </div>
                  {te.load > te.maxWeek && (
                    <div style={{ fontSize: 10, color: 'var(--danger)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <AlertTriangle size={9} /> {lang === 'sw' ? 'Amezidiwa' : 'Overloaded by'} {te.load - te.maxWeek}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Subject distribution */}
      {Object.keys(subjectTotals).length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 5, height: 18, borderRadius: 3, background: 'var(--skyblue)' }} />
            <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {lang === 'sw' ? 'Usambazaji wa Masomo' : 'Subject Distribution'}
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {Object.entries(subjectTotals).sort((a, b) => b[1] - a[1]).map(([name, periods]) => {
              const maxP = Math.max(...Object.values(subjectTotals))
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, width: `${(periods / maxP) * 100}%`, background: 'linear-gradient(90deg, var(--skyblue), var(--accent))', transition: 'width 0.6s var(--ease-out)' }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', minWidth: 24, textAlign: 'right' }}>{periods}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Compliance summary */}
      {generatedTimetable && totalSubjectSlots > 0 && (
        <div className="card" style={{ borderColor: compliancePct >= 90 ? 'color-mix(in srgb, var(--success) 30%, transparent)' : 'color-mix(in srgb, var(--warning) 30%, transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {compliancePct >= 90 ? <CheckCircle size={16} style={{ color: 'var(--success)' }} /> : <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />}
            <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {lang === 'sw' ? 'Muhtasari wa Utiifu' : 'Compliance Summary'}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--success)' }}>{totalOk}</span>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang === 'sw' ? 'Sawa' : 'Met'}</div>
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: totalMissing > 0 ? 'var(--danger)' : 'var(--text-faint)' }}>{totalMissing}</span>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang === 'sw' ? 'Zinakosekana' : 'Missing'}</div>
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: conflicts.length > 0 ? 'var(--danger)' : 'var(--success)' }}>{conflicts.length}</span>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang === 'sw' ? 'Migongano' : 'Conflicts'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment coverage */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {lang === 'sw' ? 'Ufunikaji wa Masomo' : 'Subject Coverage'}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: totalSubjectCount > 0 && assignedSubjects === totalSubjectCount ? 'var(--success)' : 'var(--warning)' }}>
            {assignedSubjects}/{totalSubjectCount}
          </span>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 5, width: totalSubjectCount > 0 ? `${(assignedSubjects / totalSubjectCount) * 100}%` : '0%', background: 'linear-gradient(90deg, var(--gold), var(--orange))', transition: 'width 0.8s var(--ease-out)' }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
          {totalSubjectCount - assignedSubjects > 0
            ? `${totalSubjectCount - assignedSubjects} ${lang === 'sw' ? 'masomo bila mwalimu' : 'subjects without a teacher'}`
            : `✓ ${lang === 'sw' ? 'Masomo yote yamepewa walimu' : 'All subjects have teachers assigned'}`}
        </div>
      </div>
    </div>
  )
}
