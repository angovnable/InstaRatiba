// ============================================================
// InstaRatiba — Segment 8
// useExport.ts
// Hook that wires export functions to app stores + progress state.
// Used by ExportPage and the TimetablePage export buttons.
// ============================================================

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useSchoolStore }      from '@/store/schoolStore'
import { useTimetableStore }   from '@/store/timetableStore'
import { useTeacherStore }     from '@/store/teacherStore'
import { useAllocationStore }  from '@/store/allocationStore'
import {
  exportMasterPdf, exportAllClassesPdf, exportClassPdf,
  exportTeacherPdf, exportAllTeachersPdf, exportNoticeBoardPdf,
  type PdfExportOptions,
} from './pdfExport'
import {
  exportCsvAllClasses,
  exportCsvTeachers, exportCsvRaw,
} from './csvExport'
import { exportJson } from './jsonExport'
import { supabase } from '@/lib/supabase/client'
import { fetchSlots } from '@/lib/supabase/timetable'

// ── Logo fetch ─────────────────────────────────────────────────
async function fetchLogoAsDataUrl(logoUrl: string | undefined): Promise<string | null> {
  if (!logoUrl) return null
  try {
    const res = await fetch(logoUrl)
    const blob = await res.blob()
    return await new Promise<string>(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────

export function useExport() {
  const { school }     = useSchoolStore()
  const ttStore        = useTimetableStore()
  const { teachers }   = useTeacherStore()
  const { allocations } = useAllocationStore()

  const [progress, setProgress] = useState<number>(0)
  const [isExporting, setIsExporting] = useState(false)

  const buildPdfOpts = useCallback(async (): Promise<PdfExportOptions | null> => {
    if (!school || !ttStore.current) return null
    const logoDataUrl = await fetchLogoAsDataUrl(school.logo_url)

    // Load classes from Supabase
    const { data: classRows } = await supabase
      .from('classes')
      .select('*')
      .eq('school_id', school.id)
    const classes = (classRows ?? []) as Parameters<typeof exportMasterPdf>[0]['classes']

    // Hydrate slots from Supabase if the store is empty (e.g. user navigated
    // directly to Export without visiting TimetablePage first)
    let slots = ttStore.slots
    if (slots.length === 0 && ttStore.current?.id) {
      try {
        slots = await fetchSlots(ttStore.current.id)
        ttStore.setSlots(slots)
      } catch {
        // non-fatal — export will show empty grid
      }
    }

    return {
      school,
      timetable:  ttStore.current,
      slots,
      classes,
      teachers,
      logoDataUrl,
      onProgress: setProgress,
    }
  }, [school, ttStore, teachers])

  const wrap = useCallback(async (
    label: string,
    fn: (opts: PdfExportOptions) => Promise<void>,
  ) => {
    setIsExporting(true)
    setProgress(0)
    try {
      const opts = await buildPdfOpts()
      if (!opts) { toast.error('School or timetable data not loaded.'); return }
      toast.loading(`Generating ${label}…`, { id: 'export' })
      await fn(opts)
      toast.success(`${label} downloaded!`, { id: 'export' })
    } catch (err) {
      toast.error(`Export failed: ${(err as Error).message}`, { id: 'export' })
    } finally {
      setIsExporting(false)
      setProgress(0)
    }
  }, [buildPdfOpts])

  // ── PDF ──────────────────────────────────────────────────────

  const downloadMasterPdf = useCallback(() =>
    wrap('Master Timetable PDF', exportMasterPdf), [wrap])

  const downloadAllClassesPdf = useCallback(() =>
    wrap('All-Classes PDF', exportAllClassesPdf), [wrap])

  const downloadClassPdf = useCallback((classId: string) =>
    wrap('Class PDF', opts => exportClassPdf(opts, classId)), [wrap])

  const downloadTeacherPdf = useCallback((teacherId: string) =>
    wrap('Teacher PDF', opts => exportTeacherPdf(opts, teacherId)), [wrap])

  const downloadAllTeachersPdf = useCallback(() =>
    wrap('All-Teachers PDF', exportAllTeachersPdf), [wrap])

  const downloadNoticeBoardPdf = useCallback(() =>
    wrap('Notice Board PDF', exportNoticeBoardPdf), [wrap])

  // ── CSV ──────────────────────────────────────────────────────

  const downloadCsvAllClasses = useCallback(async () => {
    setIsExporting(true)
    try {
      const opts = await buildPdfOpts()
      if (!opts) return
      toast.loading('Generating CSV…', { id: 'export' })
      exportCsvAllClasses(opts.school, opts.timetable, opts.slots, opts.classes, opts.teachers)
      toast.success('Classes CSV downloaded!', { id: 'export' })
    } catch (err) {
      toast.error(`CSV export failed: ${(err as Error).message}`, { id: 'export' })
    } finally {
      setIsExporting(false)
    }
  }, [buildPdfOpts])

  const downloadCsvTeachers = useCallback(async () => {
    setIsExporting(true)
    try {
      const opts = await buildPdfOpts()
      if (!opts) return
      toast.loading('Generating Teachers CSV…', { id: 'export' })
      exportCsvTeachers(opts.school, opts.timetable, opts.slots, opts.classes, opts.teachers)
      toast.success('Teachers CSV downloaded!', { id: 'export' })
    } catch (err) {
      toast.error(`CSV export failed: ${(err as Error).message}`, { id: 'export' })
    } finally {
      setIsExporting(false)
    }
  }, [buildPdfOpts])

  const downloadCsvRaw = useCallback(async () => {
    setIsExporting(true)
    try {
      const opts = await buildPdfOpts()
      if (!opts) return
      toast.loading('Generating Raw CSV…', { id: 'export' })
      exportCsvRaw(opts.school, opts.timetable, opts.slots, opts.classes, opts.teachers)
      toast.success('Raw CSV downloaded!', { id: 'export' })
    } catch (err) {
      toast.error(`CSV export failed: ${(err as Error).message}`, { id: 'export' })
    } finally {
      setIsExporting(false)
    }
  }, [buildPdfOpts])

  // ── JSON ─────────────────────────────────────────────────────

  const downloadJson = useCallback(async () => {
    setIsExporting(true)
    try {
      const opts = await buildPdfOpts()
      if (!opts) return
      toast.loading('Generating JSON backup…', { id: 'export' })
      exportJson(
        opts.school, opts.timetable, opts.classes,
        opts.teachers, allocations, opts.slots,
      )
      toast.success('JSON backup downloaded!', { id: 'export' })
    } catch (err) {
      toast.error(`JSON export failed: ${(err as Error).message}`, { id: 'export' })
    } finally {
      setIsExporting(false)
    }
  }, [buildPdfOpts, allocations])

  return {
    isExporting,
    progress,
    // PDF
    downloadMasterPdf,
    downloadAllClassesPdf,
    downloadClassPdf,
    downloadTeacherPdf,
    downloadAllTeachersPdf,
    downloadNoticeBoardPdf,
    // CSV
    downloadCsvAllClasses,
    downloadCsvTeachers,
    downloadCsvRaw,
    // JSON
    downloadJson,
  }
}
