// ============================================================
// InstaRatiba — Segment 9
// DashboardPage.tsx
// Post-generation home: stats, quick access, duty roster,
// versioning, recent activity.
// §5.1 Dashboard  |  §5.2 Academic Year & Term Management
// §5.5 Multi-Timetable Versioning  |  §5.7 Duty Roster
// ============================================================

import { useEffect, useState, useCallback } from 'react'
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

// ── Stat card ─────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, color = '#2E7D32',
}: {
  icon: string; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="bg-white border border-[--color-accent-light] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[--color-muted] uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-[--color-muted] mt-1">{sub}</p>}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg"
          style={{ background: color }}
        >
          <i className={icon} />
        </div>
      </div>
    </div>
  )
}

// ── Level quick-access card ────────────────────────────────────
function LevelCard({
  level, grades, count, icon, onClick,
}: {
  level: string; grades: string; count: number; icon: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bg-[--color-surface] border border-[--color-accent-light] rounded-2xl p-5 text-left
                 hover:border-[--color-primary] hover:shadow-md transition-all group"
    >
      <div className="w-10 h-10 rounded-lg bg-[--color-primary] text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        <i className={`${icon} text-lg`} />
      </div>
      <h3 className="font-semibold text-[--color-text] text-sm">{level}</h3>
      <p className="text-xs text-[--color-muted] mt-0.5">{grades}</p>
      <div className="mt-3 pt-3 border-t border-[--color-accent-light]">
        <span className="text-lg font-bold text-[--color-primary]">{count}</span>
        <span className="text-xs text-[--color-muted] ml-1">classes</span>
      </div>
    </button>
  )
}

// ── Activity row ───────────────────────────────────────────────
function ActivityRow({ icon, label, time, color }: {
  icon: string; label: string; time: string; color: string
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[--color-surface] last:border-0">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
           style={{ background: color }}>
        <i className={icon} />
      </div>
      <span className="text-sm text-[--color-text] flex-1">{label}</span>
      <span className="text-xs text-[--color-muted] flex-shrink-0">{time}</span>
    </div>
  )
}

// ── Status badge ───────────────────────────────────────────────
function StatusBadge({ status }: { status: Timetable['status'] }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft:     { label: 'Draft',    cls: 'bg-gray-100 text-gray-600' },
    pending:   { label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
    published: { label: 'Live',     cls: 'bg-green-100 text-green-700' },
    archived:  { label: 'Archived', cls: 'bg-slate-100 text-slate-500' },
  }
  const { label, cls } = map[status] ?? map.draft
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate  = useNavigate()
  const { school }        = useSchoolStore()
  const { user }          = useAuthStore()
  const ttStore           = useTimetableStore()
  const { teachers }      = useTeacherStore()
  const { allocations }   = useAllocationStore()

  const [timetables, setTimetables]             = useState<Timetable[]>([])
  const [isLoading, setIsLoading]               = useState(true)
  const [showDutyRoster, setShowDutyRoster]     = useState(false)
  const [showVersioning, setShowVersioning]     = useState(false)
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
        <StatCard icon="bi-people-fill"       label="Teachers"          value={totalTeachers}  sub="on staff" />
        <StatCard icon="bi-collection-fill"   label="Classes"           value={totalClasses}   sub="streams"  color="#1565C0" />
        <StatCard icon="bi-journal-text"      label="Lessons / Week"    value={totalLessons}   sub="scheduled" color="#00695C" />
        <StatCard
          icon="bi-exclamation-triangle-fill"
          label="Hard Conflicts"
          value={hardConflicts}
          sub={hardConflicts === 0 ? 'all clear ✓' : 'need fixing'}
          color={hardConflicts === 0 ? '#2E7D32' : '#E53935'}
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
                ? 'border-[--color-primary] text-[--color-primary]'
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
            t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
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
    color: tt.status === 'published' ? '#2E7D32' : tt.status === 'pending' ? '#FFB300' : '#1565C0',
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
