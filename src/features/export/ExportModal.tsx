// ============================================================
// InstaRatiba — Segment 8
// ExportModal.tsx
// Compact export picker launched from TimetablePage toolbar.
// Gives one-click access to the most common exports without
// navigating away from the timetable viewer.
// §4.2.10 — Timetable Viewer export buttons
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useExport } from './useExport'
import { useTeacherStore } from '@/store/teacherStore'

interface ExportModalProps {
  open:    boolean
  onClose: () => void
}

type Tab = 'pdf' | 'csv' | 'backup'

const TAB_LABELS: Record<Tab, { label: string; icon: string }> = {
  pdf:    { label: 'PDF',    icon: 'bi-file-earmark-pdf' },
  csv:    { label: 'CSV',    icon: 'bi-filetype-xlsx' },
  backup: { label: 'Backup', icon: 'bi-archive' },
}

function TabBtn({ active, tab, onClick }: { active: boolean; tab: Tab; onClick: () => void }) {
  const { label, icon } = TAB_LABELS[tab]
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors',
        active
          ? 'bg-[--color-primary] text-white'
          : 'text-[--color-muted] hover:text-[--color-text] hover:bg-[--color-surface]',
      ].join(' ')}
    >
      <i className={`${icon} text-xs`} />
      {label}
    </button>
  )
}

function ActionRow({ icon, label, sub, onClick, disabled, loading }: {
  icon: string; label: string; sub: string; onClick: () => void; disabled?: boolean; loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[--color-accent-light] bg-white hover:border-[--color-mid] hover:bg-[--color-surface] transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed group"
    >
      <div className="w-8 h-8 rounded-lg bg-[--color-surface] group-hover:bg-[--color-accent-light] flex items-center justify-center shrink-0 transition-colors">
        {loading
          ? <i className="bi bi-arrow-repeat animate-spin text-[--color-primary] text-sm" />
          : <i className={`${icon} text-[--color-primary] text-sm`} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[--color-text]">{label}</div>
        <div className="text-xs text-[--color-muted] truncate">{sub}</div>
      </div>
      <i className="bi bi-download text-[--color-muted] text-xs" />
    </button>
  )
}

export default function ExportModal({ open, onClose }: ExportModalProps) {
  const [tab, setTab] = useState<Tab>('pdf')
  const [teacherId, setTeacherId] = useState('')
  const exp = useExport()
  const { teachers } = useTeacherStore()

  const handleClose = () => {
    if (!exp.isExporting) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[--color-accent-light]">
              <div>
                <h3 className="font-bold text-[--color-text]">
                  <i className="bi bi-cloud-download mr-2 text-[--color-primary]" />
                  Export Timetable
                </h3>
                <p className="text-xs text-[--color-muted] mt-0.5">B&W print-ready files</p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-[--color-surface] transition-colors"
              >
                <i className="bi bi-x-lg text-[--color-muted]" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-5 pt-3">
              {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
                <TabBtn key={t} tab={t} active={tab === t} onClick={() => setTab(t)} />
              ))}
            </div>

            {/* Progress bar */}
            {exp.isExporting && exp.progress > 0 && (
              <div className="px-5 pt-2">
                <div className="w-full bg-[--color-surface] rounded-full h-1 overflow-hidden">
                  <motion.div
                    className="h-full bg-[--color-primary] rounded-full"
                    animate={{ width: `${exp.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Body */}
            <div className="px-5 pb-5 pt-3 space-y-2 max-h-[60vh] overflow-y-auto">

              {tab === 'pdf' && (
                <>
                  <ActionRow
                    icon="bi-grid-3x3-gap"
                    label="Master Timetable"
                    sub="All classes in one grid — A4 landscape"
                    onClick={exp.downloadMasterPdf}
                    disabled={exp.isExporting}
                    loading={exp.isExporting}
                  />
                  <ActionRow
                    icon="bi-collection"
                    label="All Classes (Separate)"
                    sub="One page per class — classroom notice boards"
                    onClick={exp.downloadAllClassesPdf}
                    disabled={exp.isExporting}
                    loading={exp.isExporting}
                  />
                  <ActionRow
                    icon="bi-people"
                    label="All Teachers (Personal)"
                    sub="MoE required — one page per teacher"
                    onClick={exp.downloadAllTeachersPdf}
                    disabled={exp.isExporting}
                    loading={exp.isExporting}
                  />
                  <ActionRow
                    icon="bi-sign-stop"
                    label="Notice Board Format"
                    sub="Large-text A4 for corridors and staffroom"
                    onClick={exp.downloadNoticeBoardPdf}
                    disabled={exp.isExporting}
                    loading={exp.isExporting}
                  />

                  {/* Single teacher */}
                  <div className="pt-1 pb-1">
                    <p className="text-xs text-[--color-muted] font-semibold mb-2 pl-1">
                      <i className="bi bi-person-badge mr-1" />Individual teacher
                    </p>
                    <div className="flex gap-2">
                      <select
                        value={teacherId}
                        onChange={e => setTeacherId(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-[--color-accent-light] text-sm text-[--color-text] bg-white focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                      >
                        <option value="">Select teacher…</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <button
                        disabled={!teacherId || exp.isExporting}
                        onClick={() => teacherId && exp.downloadTeacherPdf(teacherId)}
                        className="px-3 py-2 rounded-lg bg-[--color-primary] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[--color-mid] transition-colors"
                      >
                        <i className="bi bi-download" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {tab === 'csv' && (
                <>
                  <ActionRow
                    icon="bi-table"
                    label="All Classes Workbook"
                    sub="Excel — one sheet per class"
                    onClick={exp.downloadCsvAllClasses}
                    disabled={exp.isExporting}
                    loading={exp.isExporting}
                  />
                  <ActionRow
                    icon="bi-person-lines-fill"
                    label="All Teachers Workbook"
                    sub="Excel — one sheet per teacher"
                    onClick={exp.downloadCsvTeachers}
                    disabled={exp.isExporting}
                    loading={exp.isExporting}
                  />
                  <ActionRow
                    icon="bi-database"
                    label="Raw Slot Data"
                    sub="Flat CSV — all fields, for analysis"
                    onClick={exp.downloadCsvRaw}
                    disabled={exp.isExporting}
                    loading={exp.isExporting}
                  />
                </>
              )}

              {tab === 'backup' && (
                <>
                  <ActionRow
                    icon="bi-cloud-download"
                    label="JSON Backup"
                    sub="Complete snapshot — school, teachers, allocations, all slots"
                    onClick={exp.downloadJson}
                    disabled={exp.isExporting}
                    loading={exp.isExporting}
                  />
                  <p className="text-xs text-[--color-muted] px-1 pt-1">
                    <i className="bi bi-shield-lock mr-1 text-[--color-primary]" />
                    Contains school and staff data — handle securely.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
