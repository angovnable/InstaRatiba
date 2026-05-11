// ============================================================
// InstaRatiba — Segment 7
// TimetablePage — main timetable viewer
// §4.2.10 Screen 8 — Timetable Generator & Viewer
// §4.2.11 Screen 9 — Approval & Publishing
// ============================================================

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useSchoolStore }    from '@/store/schoolStore'
import { useTeacherStore }   from '@/store/teacherStore'
import { useTimetableStore } from '@/store/timetableStore'
import { useTimetable }      from './useTimetable'
import MasterGrid            from './MasterGrid'
import ClassView             from './ClassView'
import TeacherView           from './TeacherView'
import SlotEditModal         from './SlotEditModal'
import ApprovalPanel         from './ApprovalPanel'
import type { TimetableSlot, SchoolClass } from '@/types'
import { ExportModal } from '@/features/export'

// ── View mode tab ─────────────────────────────────────────────
type ViewMode = 'master' | 'class' | 'teacher'

function ViewTab({ mode, label, icon, active, onClick }: {
  mode: ViewMode; label: string; icon: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'relative px-4 py-2 text-sm font-semibold transition-colors rounded-lg',
        active
          ? 'text-[--color-primary] bg-[--color-surface]'
          : 'text-[--color-muted] hover:text-[--color-text]',
      ].join(' ')}
    >
      <i className={`${icon} mr-1.5`} />
      {label}
      {active && (
        <motion.div
          layoutId="view-tab-underline"
          className="absolute bottom-0 left-2 right-2 h-0.5 bg-[--color-primary] rounded-full"
        />
      )}
    </button>
  )
}

// ── Conflict sidebar ──────────────────────────────────────────
function ConflictSidebar({
  conflicts,
  onClose,
}: {
  conflicts: ReturnType<typeof useTimetable>['conflicts']
  onClose: () => void
}) {
  const hard = conflicts.filter(c => c.severity === 'hard' && !c.resolved)
  const soft = conflicts.filter(c => c.severity === 'soft' && !c.resolved)

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed right-0 top-[var(--navbar-h)] bottom-[var(--footer-h)] w-80 bg-white shadow-xl border-l border-[--color-accent-light] z-40 flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[--color-accent-light]">
        <h3 className="font-bold text-[--color-text]">
          <i className="bi bi-exclamation-triangle-fill text-[--color-warn] mr-2" />
          Conflicts
        </h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[--color-surface] transition-colors">
          <i className="bi bi-x-lg text-[--color-muted]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {hard.length === 0 && soft.length === 0 && (
          <div className="text-center py-8 text-[--color-muted]">
            <i className="bi bi-check-circle-fill text-[--color-primary] text-3xl block mb-2" />
            <p className="text-sm">No active conflicts</p>
          </div>
        )}

        {hard.length > 0 && (
          <>
            <p className="text-[10px] font-bold text-[--color-error] uppercase tracking-widest">
              Hard Conflicts ({hard.length})
            </p>
            {hard.map(c => (
              <div key={c.id} className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[--color-text]">
                <i className="bi bi-x-circle-fill text-[--color-error] mr-1.5" />
                {c.description}
              </div>
            ))}
          </>
        )}

        {soft.length > 0 && (
          <>
            <p className="text-[10px] font-bold text-[--color-warn] uppercase tracking-widest mt-3">
              Warnings ({soft.length})
            </p>
            {soft.map(c => (
              <div key={c.id} className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-[--color-text]">
                <i className="bi bi-exclamation-triangle-fill text-[--color-warn] mr-1.5" />
                {c.description}
              </div>
            ))}
          </>
        )}
      </div>
    </motion.div>
  )
}

// ── Skeleton loader ───────────────────────────────────────────
function GridSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-10 bg-[--color-surface] rounded-xl w-64" />
      <div className="rounded-xl border border-[--color-accent-light] overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`h-14 flex gap-1 px-1 py-1 ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}`}>
            <div className="w-20 h-full bg-[--color-surface] rounded" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex-1 h-full bg-[--color-surface] rounded" style={{ opacity: 1 - j * 0.1 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function TimetablePage() {
  const navigate = useNavigate()
  const { classes, school } = useSchoolStore()
  const { teachers } = useTeacherStore()

  const {
    timetable, slots, conflicts, overrides, shareToken, isLoadingData,
    viewMode, setViewMode, selectedClassId, selectedTeacherId,
    setSelectedClass, setSelectedTeacher,
    overrideSlot, submitForApproval, approveTimetable, returnForRevision,
    generateShareLink, revokeShareLink,
    hardConflictCount, softConflictCount,
  } = useTimetable()

  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null)
  const [editingCls,  setEditingCls]  = useState<SchoolClass | null>(null)
  const [showConflicts, setShowConflicts] = useState(false)
  const [showApproval,  setShowApproval]  = useState(false)
  const [exportOpen,    setExportOpen]    = useState(false)

  // Derived
  const conflictSlotIds = useMemo(() =>
    new Set(conflicts.filter(c => !c.resolved).map(c => c.id)),
    [conflicts],
  )

  const selectedClass   = classes.find(c => c.id === selectedClassId) ?? classes[0] ?? null
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId) ?? teachers[0] ?? null

  const isEditable = timetable?.status === 'draft'

  // If no timetable generated yet
  if (!timetable && !isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-full bg-[--color-surface] flex items-center justify-center mb-4">
          <i className="bi bi-calendar3 text-4xl text-[--color-accent-light]" />
        </div>
        <h2 className="text-xl font-bold text-[--color-text]">No timetable generated yet</h2>
        <p className="text-sm text-[--color-muted] mt-1 mb-6 max-w-xs">
          Go through the setup wizard and generate your first timetable.
        </p>
        <button
          onClick={() => navigate('/review')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[--color-primary] text-white font-semibold text-sm hover:bg-[#1B5E20] transition-colors"
        >
          <i className="bi bi-lightning-fill" /> Go to Pre-Generate Review
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Conflict sidebar */}
      <AnimatePresence>
        {showConflicts && (
          <ConflictSidebar
            conflicts={conflicts}
            onClose={() => setShowConflicts(false)}
          />
        )}
      </AnimatePresence>

      {/* Approval panel drawer (bottom sheet on mobile) */}
      <AnimatePresence>
        {showApproval && timetable && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowApproval(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed bottom-[var(--footer-h)] left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-[--color-accent-light] rounded-full mx-auto mt-3 mb-1" />
              <div className="px-5 pb-6 pt-3">
                <ApprovalPanel
                  timetable={timetable}
                  shareToken={shareToken}
                  hardConflictCount={hardConflictCount}
                  onSubmitForApproval={submitForApproval}
                  onApprove={approveTimetable}
                  onReturn={returnForRevision}
                  onGenerateShareLink={generateShareLink}
                  onRevokeShareLink={revokeShareLink}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slot edit modal */}
      <SlotEditModal
        slot={editingSlot}
        cls={editingCls}
        onClose={() => { setEditingSlot(null); setEditingCls(null) }}
        onSave={overrideSlot}
      />

      {/* Page layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

        {/* Header bar */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[--color-text]">
              {timetable?.name ?? 'Timetable'}
            </h1>
            <p className="text-sm text-[--color-muted] mt-0.5">
              {school?.name} · Term {school?.current_term} {school?.academic_year}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Conflicts badge */}
            <button
              onClick={() => setShowConflicts(!showConflicts)}
              className={[
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors',
                hardConflictCount > 0
                  ? 'bg-red-50 border-red-200 text-[--color-error]'
                  : softConflictCount > 0
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-green-50 border-green-200 text-[--color-primary]',
              ].join(' ')}
            >
              <i className={hardConflictCount > 0 ? 'bi bi-exclamation-circle-fill' : softConflictCount > 0 ? 'bi bi-exclamation-triangle-fill' : 'bi bi-check-circle-fill'} />
              {hardConflictCount > 0
                ? `${hardConflictCount} conflict${hardConflictCount > 1 ? 's' : ''}`
                : softConflictCount > 0
                  ? `${softConflictCount} warning${softConflictCount > 1 ? 's' : ''}`
                  : 'No conflicts'
              }
            </button>

            {/* Regenerate */}
            {isEditable && (
              <button
                onClick={() => {
                  if (confirm('Regenerate timetable? Manual overrides will be cleared.')) {
                    navigate('/review')
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-[--color-accent-light] text-[--color-text] hover:bg-[--color-surface] transition-colors"
              >
                <i className="bi bi-arrow-clockwise" /> Regenerate
              </button>
            )}

            {/* Export */}
            <button
              onClick={() => setExportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-[--color-accent-light] text-[--color-text] hover:bg-[--color-surface] transition-colors"
            >
              <i className="bi bi-cloud-download text-[--color-primary]" /> Export
            </button>

            {/* Approval / status */}
            <button
              onClick={() => setShowApproval(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[--color-primary] text-white hover:bg-[#1B5E20] transition-colors"
            >
              <i className={timetable?.status === 'published' ? 'bi bi-check-circle-fill' : 'bi bi-shield-check'} />
              {timetable?.status === 'draft'     && 'Submit for Approval'}
              {timetable?.status === 'pending'   && 'Review & Approve'}
              {timetable?.status === 'published' && 'Published'}
              {timetable?.status === 'archived'  && 'Archived'}
            </button>
          </div>
        </div>

        {/* View mode tabs */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-[--color-accent-light] p-1 w-fit shadow-sm">
          <ViewTab mode="master"  label="Master"     icon="bi-grid-3x3"       active={viewMode === 'master'}  onClick={() => setViewMode('master')}  />
          <ViewTab mode="class"   label="By Class"   icon="bi-people"         active={viewMode === 'class'}   onClick={() => setViewMode('class')}   />
          <ViewTab mode="teacher" label="By Teacher" icon="bi-person-badge"   active={viewMode === 'teacher'} onClick={() => setViewMode('teacher')} />
        </div>

        {/* Class / teacher selector (for class + teacher views) */}
        {viewMode === 'class' && (
          <div className="flex flex-wrap gap-2">
            {[...classes].sort((a, b) => a.grade !== b.grade ? a.grade - b.grade : a.stream.localeCompare(b.stream)).map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={[
                  'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all',
                  selectedClassId === cls.id
                    ? 'bg-[--color-primary] text-white border-[--color-primary]'
                    : 'bg-white text-[--color-text] border-[--color-accent-light] hover:border-[--color-primary]',
                ].join(' ')}
              >
                Grade {cls.grade}{cls.stream}
              </button>
            ))}
          </div>
        )}
        {viewMode === 'teacher' && (
          <div className="flex flex-wrap gap-2">
            {teachers.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTeacher(t.id)}
                className={[
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all',
                  selectedTeacherId === t.id
                    ? 'bg-[--color-primary] text-white border-[--color-primary]'
                    : 'bg-white text-[--color-text] border-[--color-accent-light] hover:border-[--color-primary]',
                ].join(' ')}
              >
                <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[9px] font-bold">
                  {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
                {t.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {/* Grid area */}
        {isLoadingData ? (
          <GridSkeleton />
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'master' && (
              <motion.div
                key="master"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <MasterGrid
                  slots={slots}
                  classes={classes}
                  conflicts={[...conflictSlotIds]}
                  onCellClick={(slot, cls) => {
                    setEditingSlot(slot)
                    setEditingCls(cls)
                  }}
                  isEditable={isEditable}
                />
              </motion.div>
            )}

            {viewMode === 'class' && selectedClass && (
              <motion.div
                key={`class-${selectedClass.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ClassView
                  slots={slots}
                  cls={selectedClass}
                  conflictIds={conflictSlotIds}
                  onCellClick={slot => {
                    setEditingSlot(slot)
                    setEditingCls(selectedClass)
                  }}
                  isEditable={isEditable}
                />
              </motion.div>
            )}

            {viewMode === 'teacher' && selectedTeacher && (
              <motion.div
                key={`teacher-${selectedTeacher.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <TeacherView
                  slots={slots}
                  teacher={selectedTeacher}
                  classes={classes}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Published notice */}
        {timetable?.status === 'published' && !isEditable && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800"
          >
            <i className="bi bi-lock-fill" />
            <span>This timetable is published. Editing is locked. Submit an Amendment Request to make changes.</span>
          </motion.div>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  )
}
