// ============================================================
// InstaRatiba — Segment 8
// ExportPage.tsx
// §4.2.10 Export — PDF (B&W), CSV, JSON backup, print
// §5.8   Plain Black & White Export spec
// §5.3   Teacher Personal Timetable Extraction
// Accessible at /export (ProtectedRoute → AppShell)
// ============================================================

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useSchoolStore }    from '@/store/schoolStore'
import { useTimetableStore } from '@/store/timetableStore'
import { useTeacherStore }   from '@/store/teacherStore'
import { useExport }         from './useExport'

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-[--color-surface] flex items-center justify-center shrink-0">
        <i className={`${icon} text-[--color-primary] text-lg`} />
      </div>
      <div>
        <h2 className="text-base font-bold text-[--color-text]">{title}</h2>
        <p className="text-xs text-[--color-muted]">{subtitle}</p>
      </div>
    </div>
  )
}

function ExportCard({
  icon, title, description, badge, onClick, disabled, isLoading, variant = 'default',
}: {
  icon: string
  title: string
  description: string
  badge?: string
  onClick: () => void
  disabled?: boolean
  isLoading?: boolean
  variant?: 'default' | 'primary' | 'outline'
}) {
  const base = 'group flex items-start gap-3 p-4 rounded-xl border transition-all duration-150 cursor-pointer text-left w-full'
  const styles = {
    default:  'border-[--color-accent-light] bg-white hover:border-[--color-mid] hover:shadow-sm',
    primary:  'border-[--color-primary] bg-[--color-surface] hover:bg-[--color-accent-light]',
    outline:  'border-dashed border-[--color-muted] bg-white hover:border-[--color-primary]',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${base} ${styles[variant]} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors
        ${variant === 'primary' ? 'bg-[--color-primary]/10' : 'bg-[--color-surface] group-hover:bg-[--color-accent-light]'}`}>
        {isLoading
          ? <i className="bi bi-arrow-repeat text-[--color-primary] animate-spin text-sm" />
          : <i className={`${icon} text-[--color-primary] text-sm`} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[--color-text]">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[--color-primary] text-white">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-[--color-muted] mt-0.5 leading-snug">{description}</p>
      </div>
      <i className="bi bi-chevron-right text-[--color-muted] text-xs self-center group-hover:text-[--color-primary] transition-colors" />
    </button>
  )
}

function ProgressBar({ value }: { value: number }) {
  if (value <= 0) return null
  return (
    <div className="w-full bg-[--color-surface] rounded-full h-1.5 overflow-hidden">
      <motion.div
        className="h-full bg-[--color-primary] rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  )
}

// ── Teacher selector for personal timetable download ──────────
function TeacherExportPanel({
  onDownloadPdf,
  isLoading,
}: {
  onDownloadPdf: (id: string) => void
  isLoading: boolean
}) {
  const { teachers } = useTeacherStore()
  const [selectedId, setSelectedId] = useState<string>('')

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-[--color-accent-light] bg-white text-sm text-[--color-text] focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
        >
          <option value="">Select a teacher…</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <button
          disabled={!selectedId || isLoading}
          onClick={() => selectedId && onDownloadPdf(selectedId)}
          className="px-4 py-2 rounded-lg bg-[--color-primary] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[--color-mid] transition-colors"
        >
          <i className="bi bi-download mr-1.5" />
          PDF
        </button>
      </div>
      <p className="text-xs text-[--color-muted]">
        <i className="bi bi-info-circle mr-1" />
        MoE requires each teacher to have an extracted personal timetable.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main ExportPage
// ─────────────────────────────────────────────────────────────

export default function ExportPage() {
  const { school }  = useSchoolStore()
  const ttStore     = useTimetableStore()
  const exp         = useExport()

  const isPublished = ttStore.current?.status === 'published'
  const noTimetable = !ttStore.current

  const statusNote = noTimetable
    ? 'No timetable generated yet. Complete the wizard first.'
    : !isPublished
    ? `Timetable is in "${ttStore.current?.status}" status. Exports are available, but share the published version.`
    : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[--color-text]">
          <i className="bi bi-file-earmark-arrow-down mr-2 text-[--color-primary]" />
          Export Timetable
        </h1>
        <p className="text-sm text-[--color-muted] mt-1">
          Download B&W print-ready PDFs, CSV data sheets, or a JSON backup.
        </p>
        {statusNote && (
          <div className="mt-3 px-4 py-3 rounded-xl bg-[--color-warn]/10 border border-[--color-warn]/30 text-sm text-[--color-text] flex items-start gap-2">
            <i className="bi bi-exclamation-triangle-fill text-[--color-warn] mt-0.5 shrink-0" />
            {statusNote}
          </div>
        )}
        {exp.isExporting && (
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-xs text-[--color-muted]">
              <span>Generating…</span>
              <span>{exp.progress}%</span>
            </div>
            <ProgressBar value={exp.progress} />
          </div>
        )}
      </div>

      {/* ── PDF Exports ────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-[--color-accent-light] p-5 shadow-sm space-y-3"
      >
        <SectionTitle
          icon="bi-file-earmark-pdf"
          title="PDF Exports"
          subtitle="Black & white, print-ready — A4 landscape format with header and legend"
        />

        <div className="grid gap-2">
          <ExportCard
            icon="bi-grid-3x3-gap"
            title="Master Timetable"
            description="All classes in one combined grid. Ideal for admin office notice boards."
            badge="A4 LandSCAPE"
            variant="primary"
            onClick={exp.downloadMasterPdf}
            disabled={noTimetable}
            isLoading={exp.isExporting}
          />
          <ExportCard
            icon="bi-collection"
            title="All Classes (Separate Pages)"
            description="One A4 page per class — for classroom notice boards."
            onClick={exp.downloadAllClassesPdf}
            disabled={noTimetable}
            isLoading={exp.isExporting}
          />
          <ExportCard
            icon="bi-people"
            title="All Teachers (Personal Timetables)"
            description="One A4 page per teacher — free/prep periods clearly marked. MoE required."
            onClick={exp.downloadAllTeachersPdf}
            disabled={noTimetable}
            isLoading={exp.isExporting}
          />
          <ExportCard
            icon="bi-sign-stop"
            title="Notice Board Format"
            description="Larger text variant for A4/A3 corridor & staffroom notice boards."
            onClick={exp.downloadNoticeBoardPdf}
            disabled={noTimetable}
            isLoading={exp.isExporting}
          />
        </div>
      </motion.section>

      {/* ── Individual Teacher PDF ─────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-[--color-accent-light] p-5 shadow-sm"
      >
        <SectionTitle
          icon="bi-person-badge"
          title="Single Teacher PDF"
          subtitle="Personal timetable for one teacher — free/prep periods shown"
        />
        <TeacherExportPanel
          onDownloadPdf={exp.downloadTeacherPdf}
          isLoading={exp.isExporting}
        />
      </motion.section>

      {/* ── CSV Exports ────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-[--color-accent-light] p-5 shadow-sm space-y-3"
      >
        <SectionTitle
          icon="bi-filetype-xlsx"
          title="CSV / Excel Exports"
          subtitle="One worksheet per class or teacher — opens in Excel, Google Sheets, LibreOffice"
        />
        <div className="grid gap-2">
          <ExportCard
            icon="bi-table"
            title="All Classes — Workbook"
            description="One Excel sheet per class with subject + teacher per slot."
            onClick={exp.downloadCsvAllClasses}
            disabled={noTimetable}
            isLoading={exp.isExporting}
          />
          <ExportCard
            icon="bi-person-lines-fill"
            title="All Teachers — Workbook"
            description="One Excel sheet per teacher with class assignments per slot."
            onClick={exp.downloadCsvTeachers}
            disabled={noTimetable}
            isLoading={exp.isExporting}
          />
          <ExportCard
            icon="bi-database"
            title="Raw Slot Data"
            description="Flat CSV of all slots with subject codes, teacher names, and class labels. Use for analysis."
            variant="outline"
            onClick={exp.downloadCsvRaw}
            disabled={noTimetable}
            isLoading={exp.isExporting}
          />
        </div>
      </motion.section>

      {/* ── JSON Backup ────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-[--color-accent-light] p-5 shadow-sm"
      >
        <SectionTitle
          icon="bi-archive"
          title="JSON Backup"
          subtitle="Full timetable snapshot including school, teachers, allocations and all slots"
        />
        <ExportCard
          icon="bi-cloud-download"
          title="Download JSON Backup"
          description="Complete machine-readable snapshot. Use to restore, migrate, or integrate with other systems."
          variant="outline"
          onClick={exp.downloadJson}
          disabled={noTimetable}
          isLoading={exp.isExporting}
        />
        <p className="text-xs text-[--color-muted] mt-3">
          <i className="bi bi-shield-lock mr-1 text-[--color-primary]" />
          The backup contains school data and teacher details. Store securely and share only with authorised staff.
        </p>
      </motion.section>

      {/* ── Print hint ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[--color-surface] border border-[--color-accent-light] text-sm text-[--color-muted]"
      >
        <i className="bi bi-printer text-[--color-primary] text-base mt-0.5 shrink-0" />
        <div>
          All PDF exports are optimised for black & white laser printing. No colour ink required.
          For best results, print on A4 paper at 100% scale (do not scale to fit). Ensure "Print Background" is enabled in your browser print dialog.
        </div>
      </motion.div>
    </div>
  )
}
