// ============================================================
// InstaRatiba — Segment 9
// DashboardPage.tsx
// Post-generation home: stats, quick access, duty roster,
// versioning, recent activity.
// §5.1 Dashboard  |  §5.2 Academic Year & Term Management
// §5.5 Multi-Timetable Versioning  |  §5.7 Duty Roster
// ============================================================

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore }       from '@/store/authStore'
import { useSchoolStore }     from '@/store/schoolStore'
import { useTimetableStore }  from '@/store/timetableStore'
import { useTeacherStore }    from '@/store/teacherStore'
import { useAllocationStore } from '@/store/allocationStore'
import { SkeletonLoader }     from '@/components/ui/SkeletonLoader'
import {
  fetchTimetables,
  deleteTimetable,
  duplicateTimetable,
} from '@/lib/supabase/dashboard'
import type { Timetable } from '@/types'
import DutyRosterPanel     from './DutyRosterPanel'
import SubstituteSwapModal from './SubstituteSwapModal'
import VersioningPanel     from './VersioningPanel'

// ── Stat card — redesigned with gold left border + Savanna Gold icon ──

// ── Emil Kowalski StatCard — precise, numbered, quietly premium ──
function StatCard({
  icon, label, value, sub, idx = 0, color: _c,
}: {
  icon: string; label: string; value: string | number; sub?: string; idx?: number; color?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -1, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
      style={{
        background: 'white',
        border: '1px solid #EDE7D9',
        borderRadius: 12,
        padding: '18px 20px',
        boxShadow: '0 1px 2px rgba(13,61,35,0.04), 0 4px 10px rgba(13,61,35,0.04)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{
          fontFamily: "'Outfit', sans-serif", fontWeight: 500, fontSize: '0.68rem',
          color: '#7A8C82', textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>
          {label}
        </span>
        <div style={{
          width: 28, height: 28, borderRadius: 7, background: 'rgba(200,146,42,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={icon} style={{ fontSize: '0.82rem', color: '#C8922A' }} />
        </div>
      </div>
      <p style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '2rem', fontWeight: 800,
        color: '#0D3D23', lineHeight: 1, letterSpacing: '-0.03em',
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontFamily: "'Figtree', sans-serif", fontSize: '0.72rem', color: '#7A8C82', marginTop: 5 }}>
          {sub}
        </p>
      )}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: '0 0 12px 12px',
        background: 'linear-gradient(90deg, #C8922A, transparent)',
      }} />
    </motion.div>
  )
}

// ── LevelCard — tight, spring hover ──
function LevelCard({
  level, grades, count, icon, onClick, idx = 0,
}: {
  level: string; grades: string; count: number; icon: string; onClick: () => void; idx?: number
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 + 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -1, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        background: '#F7F5EF', border: '1px solid #EDE7D9', borderRadius: 12,
        padding: '18px 20px', textAlign: 'left', cursor: 'pointer', width: '100%',
        transition: 'border-color 150ms, box-shadow 150ms', position: 'relative',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.borderColor = 'rgba(200,146,42,0.35)'
        el.style.boxShadow = '0 2px 8px rgba(200,146,42,0.08)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.borderColor = '#EDE7D9'
        el.style.boxShadow = 'none'
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: '#0D3D23',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
      }}>
        <i className={icon} style={{ color: 'white', fontSize: '0.85rem' }} />
      </div>
      <h3 style={{
        fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.845rem',
        color: '#1C2B22', letterSpacing: '-0.01em', marginBottom: 2,
      }}>
        {level}
      </h3>
      <p style={{ fontFamily: "'Figtree', sans-serif", fontSize: '0.7rem', color: '#7A8C82' }}>{grades}</p>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 14,
        paddingTop: 12, borderTop: '1px solid #EDE7D9',
      }}>
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.4rem', fontWeight: 800,
          color: '#0D3D23', letterSpacing: '-0.03em',
        }}>
          {count}
        </span>
        <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: '0.7rem', color: '#7A8C82' }}>classes</span>
      </div>
    </motion.button>
  )
}

// ── ActivityRow — clean list item ──
function ActivityRow({ icon, label, time, color }: {
  icon: string; label: string; time: string; color: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
      borderBottom: '1px solid #F7F5EF',
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7, background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: '0.7rem', flexShrink: 0,
      }}>
        <i className={icon} />
      </div>
      <span style={{ fontFamily: "'Figtree', sans-serif", fontSize: '0.84rem', color: '#1C2B22', flex: 1, letterSpacing: '-0.005em' }}>
        {label}
      </span>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#7A8C82', flexShrink: 0 }}>
        {time}
      </span>
    </div>
  )
}


// ── Status badge ───────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate  = useNavigate()
  const { school }        = useSchoolStore()
  const { user: _user }  = useAuthStore()
  const ttStore           = useTimetableStore()
  const { teachers }      = useTeacherStore()
  const { allocations }   = useAllocationStore()

  const [timetables, setTimetables]             = useState<Timetable[]>([])
  const [isLoading, setIsLoading]               = useState(true)
  const [_showDutyRoster, _setShowDutyRoster]     = useState(false) // eslint-disable-line
  const [_showVersioning, _setShowVersioning]     = useState(false) // eslint-disable-line
  const [showSubSwap, setShowSubSwap]           = useState(false)
  const [activeTab, setActiveTab]               = useState<'overview' | 'versions' | 'duty'>('overview')

  // ── Load timetables ────────────────────────────────────────
  const loadTimetables = useCallback(async () => {
    if (!school?.id) return
    try {
      const list = await fetchTimetables(school.id)
      setTimetables(list)
      // Activate the most recently published/draft one
      if (!ttStore.current && list.length > 0) {
        const active = list.find(t => t.status === 'published') ?? list[0]
        ttStore.setCurrent(active)
      }
    } catch {
      toast.error('Failed to load timetables')
    } finally {
      setIsLoading(false)
    }
  }, [school?.id]) // eslint-disable-line

  useEffect(() => { loadTimetables() }, [loadTimetables])

  // ── Derived stats ──────────────────────────────────────────
  const current = ttStore.current
  const hardConflicts = ttStore.hardConflictCount?.() ?? 0

  // Count classes per level from allocations (unique classIds)
  const classIds = [...new Set(allocations.map(a => a.class_id))]
  const totalClasses   = classIds.length
  const totalTeachers  = teachers.length
  const totalLessons   = allocations.reduce((s, a) => s + a.lessons_per_week, 0)

  const levels = school?.levels ?? []
  const levelCards = [
    { key: 'lower_primary',  label: 'Lower Primary', grades: 'Grade 1 – 3', icon: 'bi-1-circle' },
    { key: 'upper_primary',  label: 'Upper Primary', grades: 'Grade 4 – 6', icon: 'bi-4-circle' },
    { key: 'junior_secondary', label: 'Junior Secondary', grades: 'Grade 7 – 9', icon: 'bi-7-circle' },
  ].filter(l => (levels as string[]).includes(l.key))

  // ── Delete timetable ────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this timetable version? This cannot be undone.')) return
    try {
      await deleteTimetable(id)
      setTimetables(prev => prev.filter(t => t.id !== id))
      if (ttStore.current?.id === id) ttStore.setCurrent(null)
      toast.success('Timetable deleted')
    } catch {
      toast.error('Failed to delete timetable')
    }
  }

  // ── Duplicate timetable ─────────────────────────────────────
  const handleDuplicate = async (tt: Timetable) => {
    if (!school?.id) return
    try {
      const newTt = await duplicateTimetable(tt, school.id)
      setTimetables(prev => [newTt, ...prev])
      toast.success(`Duplicated as "${newTt.name}"`)
    } catch {
      toast.error('Failed to duplicate timetable')
    }
  }

  // ── Activate (set as current) ───────────────────────────────
  const handleActivate = (tt: Timetable) => {
    ttStore.setCurrent(tt)
    toast.success(`Switched to "${tt.name}"`)
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <SkeletonLoader lines={1} height="2rem" className="w-48 mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonLoader key={i} lines={3} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[--color-text]">Dashboard</h1>
          <p className="text-sm text-[--color-muted] mt-0.5">
            {school?.name ?? 'Your School'} · {current?.name ?? 'No active timetable'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {current && (
            <>
              <button
                onClick={() => setShowSubSwap(true)}
                className="btn-secondary text-sm"
              >
                <i className="bi bi-arrow-left-right mr-1.5" />Sub Swap
              </button>
              <button
                onClick={() => navigate('/timetable')}
                className="btn-primary text-sm"
              >
                <i className="bi bi-grid-3x3-gap mr-1.5" />View Timetable
              </button>
            </>
          )}
          {!current && (
            <button onClick={() => navigate('/review')} className="btn-primary text-sm">
              <i className="bi bi-play-circle mr-1.5" />Generate Timetable
            </button>
          )}
        </div>
      </div>

      {/* ── Offline banner handled by AppShell ─────────────── */}

      {/* ── Stats grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="bi-people-fill"       label="Teachers"          value={totalTeachers}  sub="on staff"          idx={0} />
        <StatCard icon="bi-collection-fill"   label="Classes"           value={totalClasses}   sub="streams"  idx={1} />
        <StatCard icon="bi-journal-text"      label="Lessons / Week"    value={totalLessons}   sub="scheduled" idx={2} />
        <StatCard
          icon="bi-exclamation-triangle-fill"
          label="Hard Conflicts"
          value={hardConflicts}
          sub={hardConflicts === 0 ? 'all clear ✓' : 'need fixing'}
          color={hardConflicts === 0 ? '#0D3D23' : '#A01F1F'}
        />
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="border-b border-[--color-accent-light] flex gap-6">
        {(['overview', 'versions', 'duty'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#C8922A] text-[#C8922A]'
                : 'border-transparent text-[--color-muted] hover:text-[--color-text]'
            }`}
          >
            {tab === 'versions' ? 'Versions' : tab === 'duty' ? 'Duty Roster' : 'Overview'}
          </button>
        ))}
      </div>

      {/* ─────────────────────── OVERVIEW TAB ─────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Level quick-access */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-[--color-text] uppercase tracking-wider">School Levels</h2>
            {levelCards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {levelCards.map(lc => (
                  <LevelCard
                    key={lc.key}
                    level={lc.label}
                    grades={lc.grades}
                    icon={lc.icon}
                    count={classIds.length}   // approximate; real per-level count needs classes store
                    onClick={() => navigate('/timetable')}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-[--color-muted] bg-[--color-surface] rounded-xl p-4">
                No school levels configured.{' '}
                <button onClick={() => navigate('/setup')} className="text-[--color-primary] underline">Go to Setup</button>
              </div>
            )}

            {/* Term planner */}
            <div className="bg-white border border-[--color-accent-light] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[--color-text] uppercase tracking-wider">Term Planner</h2>
                <i className="bi bi-calendar3 text-[--color-muted]" />
              </div>
              <TermPlanner />
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-white border border-[--color-accent-light] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-[--color-text] uppercase tracking-wider mb-4">Recent Activity</h2>
            <RecentActivity timetables={timetables} />
          </div>
        </div>
      )}

      {/* ─────────────────────── VERSIONS TAB ─────────────── */}
      {activeTab === 'versions' && (
        <VersioningPanel
          timetables={timetables}
          currentId={current?.id}
          onActivate={handleActivate}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onReload={loadTimetables}
          schoolId={school?.id ?? ''}
        />
      )}

      {/* ─────────────────────── DUTY ROSTER TAB ──────────── */}
      {activeTab === 'duty' && (
        <DutyRosterPanel timetableId={current?.id} teachers={teachers} />
      )}

      {/* ── Modals ─────────────────────────────────────────── */}
      {showSubSwap && (
        <SubstituteSwapModal
          timetableId={current?.id ?? ''}
          teachers={teachers}
          onClose={() => setShowSubSwap(false)}
        />
      )}
    </div>
  )
}

// ── Term planner sub-component ────────────────────────────────
function TermPlanner() {
  const terms = [
    { term: 'Term 1', weeks: '10 weeks', dates: 'Jan – Apr', status: 'active' },
    { term: 'Term 2', weeks: '10 weeks', dates: 'May – Aug', status: 'upcoming' },
    { term: 'Term 3', weeks: '10 weeks', dates: 'Sep – Nov', status: 'upcoming' },
  ]
  return (
    <div className="space-y-3">
      {terms.map(t => (
        <div key={t.term} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${t.status === 'active' ? 'bg-[--color-primary]' : 'bg-[--color-accent-light]'}`} />
            <span className="font-medium text-[--color-text]">{t.term}</span>
          </div>
          <span className="text-[--color-muted]">{t.dates}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            t.status === 'active' ? 'bg-[#EDE7D9] text-[#0D3D23]' : 'bg-[#EDE7D9] text-[#7A8C82]'
          }`}>{t.status}</span>
        </div>
      ))}
    </div>
  )
}

// ── Recent activity sub-component ────────────────────────────
function RecentActivity({ timetables }: { timetables: Timetable[] }) {
  const activities = timetables.slice(0, 5).map(tt => ({
    icon: tt.status === 'published' ? 'bi-check-lg' : tt.status === 'pending' ? 'bi-hourglass-split' : 'bi-pencil',
    label: `${tt.name} — ${tt.status}`,
    time: new Date(tt.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
    color: tt.status === 'published' ? '#0D3D23' : tt.status === 'pending' ? '#FFB300' : '#1565C0',
  }))

  if (activities.length === 0) {
    return <p className="text-sm text-[--color-muted]">No timetables yet.</p>
  }

  return (
    <div>
      {activities.map((a, i) => (
        <ActivityRow key={i} {...a} />
      ))}
    </div>
  )
}
