// ============================================================
// InstaRatiba — Segment 8
// pdfExport.ts
// §5.8 Plain Black & White Export
// Generates A4 landscape PDFs using jsPDF + html2canvas.
// All exports are print-ready B&W — no colour, no subject
// colour-coding (on-screen colours are stripped).
// ============================================================

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { TimetableSlot, SchoolClass, Teacher, School, Timetable } from '@/types'
import {
  DAYS, DAY_FULL, slotLabel, resolveTeacherName,
  classLabel, groupSlotsByClass,
  buildTimeLabels, exportFilename, buildLegend, type ExportDay,
} from './exportHelpers'

// ─────────────────────────────────────────────────────────────
// Internal: create a hidden A4-landscape HTML table that mirrors
// §5.8 spec, capture it with html2canvas, push to jsPDF.
// ─────────────────────────────────────────────────────────────

/** Build the export-header markup (§5.8) */
function buildHeaderHtml(
  school: School,
  timetable: Timetable,
  subtitle: string,
  logoDataUrl: string | null,
): string {
  const printDate = new Date().toLocaleDateString('en-KE', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  return `
    <div style="
      border:2px solid #000;
      padding:8px 12px;
      display:flex;
      align-items:center;
      gap:14px;
      margin-bottom:8px;
      background:#fff;
    ">
      ${logoDataUrl
        ? `<img src="${logoDataUrl}" style="height:56px;width:56px;object-fit:contain;border:1px solid #ccc;" />`
        : `<div style="height:56px;width:56px;border:1px solid #bbb;display:flex;align-items:center;justify-content:center;font-size:9px;color:#888;">Logo</div>`
      }
      <div style="flex:1;">
        <div style="font-size:14px;font-weight:700;color:#000;font-family:Arial,sans-serif;">${school.name}</div>
        ${school.nemis_code ? `<div style="font-size:9px;color:#333;font-family:Arial,sans-serif;">NEMIS: ${school.nemis_code}</div>` : ''}
        <div style="font-size:10px;font-family:Arial,sans-serif;">${subtitle}</div>
      </div>
      <div style="text-align:right;font-size:9px;color:#555;font-family:Arial,sans-serif;">
        <div>Term ${school.current_term} — ${school.academic_year}</div>
        <div>${timetable.name}</div>
        <div>Printed: ${printDate}</div>
      </div>
    </div>
  `
}

/** Build a timetable grid HTML table for a single class */
function buildClassTableHtml(
  cls: SchoolClass,
  slots: TimetableSlot[],
  teacherMap: Map<string, Teacher>,
): string {
  const timeLabels = buildTimeLabels(cls.grade)
  const byDay = new Map<ExportDay, TimetableSlot[]>()
  for (const day of DAYS) byDay.set(day, [])
  for (const s of slots) {
    const list = byDay.get(s.day as ExportDay)
    if (list) list.push(s)
  }
  for (const list of byDay.values()) list.sort((a, b) => a.slot_index - b.slot_index)

  // Determine max slots across days
  const maxSlots = Math.max(...[...byDay.values()].map(v => v.length), 0)
  if (maxSlots === 0) return '<p style="font-size:10px;color:#888;">No slots generated.</p>'

  const headerCells = DAYS.map(d =>
    `<th style="${thStyle}">${DAY_FULL[d]}</th>`
  ).join('')

  const rows = Array.from({ length: maxSlots }, (_, i) => {
    const timeLabel = timeLabels.get(i) ?? `Slot ${i + 1}`
    const cells = DAYS.map(day => {
      const slot = byDay.get(day)?.[i]
      if (!slot) return `<td style="${tdStyle}">—</td>`

      const { subject } = slotLabel(slot)
      const teacher = resolveTeacherName(slot.teacher_id, teacherMap)
      const isFixed = slot.is_assembly || slot.is_break || slot.is_non_formal || slot.is_ppi
      const cellBg  = isFixed ? '#f0f0f0' : '#fff'

      return `
        <td style="${tdStyle}background:${cellBg};">
          <div style="font-size:9px;font-weight:${isFixed ? '400' : '700'};font-family:Arial,sans-serif;color:#000;">
            ${subject}
          </div>
          ${teacher ? `<div style="font-size:8px;color:#333;font-family:Arial,sans-serif;margin-top:2px;">${teacher}</div>` : ''}
        </td>
      `
    }).join('')

    return `
      <tr>
        <td style="${timeTdStyle}">${timeLabel}</td>
        ${cells}
      </tr>
    `
  }).join('')

  return `
    <table style="${tableStyle}">
      <thead>
        <tr>
          <th style="${thStyle}width:90px;">Time</th>
          ${headerCells}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

/** Build master timetable table (classes as columns, slot×day as rows) */
function buildMasterTableHtml(
  slots: TimetableSlot[],
  classes: SchoolClass[],
  teacherMap: Map<string, Teacher>,
): string {
  const grouped = groupSlotsByClass(slots, classes)
  const maxSlots = Math.max(
    ...[...grouped.values()].flatMap(dm => [...dm.values()].map(v => v.length)),
    0,
  )
  if (maxSlots === 0) return '<p style="font-size:10px;color:#888;">No slots.</p>'

  const classCols = classes.map(c =>
    `<th style="${thStyle}min-width:80px;">${classLabel(c)}</th>`
  ).join('')

  const rows = DAYS.flatMap(day => {
    return Array.from({ length: maxSlots }, (_, i) => {
      // Only render rows that have at least one slot on this day
      const anySlot = classes.some(c => grouped.get(c.id)?.get(day)?.[i])
      if (!anySlot && i === 0) return '' // skip if nothing for this slot index
      if (!anySlot) return ''

      const cells = classes.map(cls => {
        const slot = grouped.get(cls.id)?.get(day)?.[i]
        if (!slot) return `<td style="${tdStyle}">—</td>`
        const { subject } = slotLabel(slot)
        const teacher = resolveTeacherName(slot.teacher_id, teacherMap)
        const isFixed = slot.is_assembly || slot.is_break || slot.is_non_formal || slot.is_ppi
        return `
          <td style="${tdStyle}background:${isFixed ? '#f0f0f0' : '#fff'};">
            <div style="font-size:8px;font-weight:${isFixed ? '400' : '700'};font-family:Arial;color:#000;">${subject}</div>
            ${teacher ? `<div style="font-size:7px;color:#333;font-family:Arial;">${teacher}</div>` : ''}
          </td>
        `
      }).join('')

      const dayLabel = i === 0 ? `<span style="font-weight:700">${DAY_FULL[day]}</span>` : ''
      return `<tr><td style="${timeTdStyle}">${dayLabel}<br/>Slot ${i + 1}</td>${cells}</tr>`
    }).join('')
  }).join('')

  return `
    <table style="${tableStyle}">
      <thead>
        <tr>
          <th style="${thStyle}width:80px;">Day / Slot</th>
          ${classCols}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

/** Build teacher timetable table */
function buildTeacherTableHtml(
  teacher: Teacher,
  slots: TimetableSlot[],
  classMap: Map<string, SchoolClass>,
): string {
  const byDay = new Map<ExportDay, TimetableSlot[]>()
  for (const day of DAYS) byDay.set(day, [])
  for (const s of slots) {
    if (s.teacher_id !== teacher.id || s.is_break || s.is_assembly || s.is_non_formal) continue
    const list = byDay.get(s.day as ExportDay)
    if (list) list.push(s)
  }
  for (const list of byDay.values()) list.sort((a, b) => a.slot_index - b.slot_index)

  const maxSlots = Math.max(...[...byDay.values()].map(v => v.length), 0)
  if (maxSlots === 0) return '<p style="font-size:10px;color:#888;">No lessons assigned.</p>'

  const headerCells = DAYS.map(d => `<th style="${thStyle}">${DAY_FULL[d]}</th>`).join('')

  const rows = Array.from({ length: maxSlots }, (_, i) => {
    const cells = DAYS.map(day => {
      const slot = byDay.get(day)?.[i]
      if (!slot) return `<td style="${tdStyle}background:#fafaf0;">Free / Prep</td>`

      const { subject } = slotLabel(slot)
      const cls = slot.class_id ? classMap.get(slot.class_id) : undefined
      const clsLabel = cls ? classLabel(cls) : ''
      const isFixed = slot.is_assembly || slot.is_break || slot.is_non_formal

      return `
        <td style="${tdStyle}background:${isFixed ? '#f0f0f0' : '#fff'};">
          <div style="font-size:9px;font-weight:700;font-family:Arial;color:#000;">${subject}</div>
          ${clsLabel ? `<div style="font-size:8px;font-family:Arial;color:#333;">${clsLabel}</div>` : ''}
        </td>
      `
    }).join('')

    return `<tr><td style="${timeTdStyle}">Slot ${i + 1}</td>${cells}</tr>`
  }).join('')

  return `
    <table style="${tableStyle}">
      <thead><tr><th style="${thStyle}width:70px;">Slot</th>${headerCells}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

/** Build legend HTML (§5.8) */
function buildLegendHtml(slots: TimetableSlot[]): string {
  const entries = buildLegend(slots)
  if (!entries.length) return ''
  const items = entries.map(e =>
    `<span style="font-size:8px;font-family:Arial;margin-right:14px;"><b>${e.code}</b> — ${e.name}</span>`
  ).join('')
  return `
    <div style="border-top:1px solid #000;margin-top:8px;padding-top:4px;font-family:Arial;">
      <span style="font-size:8px;font-weight:700;">Legend: </span>
      ${items}
    </div>
  `
}

// ── CSS style strings ─────────────────────────────────────────

const tableStyle = 'border-collapse:collapse;width:100%;background:#fff;'
const thStyle    = 'border:1px solid #000;padding:4px 6px;background:#e8e8e8;font-size:9px;font-family:Arial;color:#000;font-weight:700;text-align:center;'
const tdStyle    = 'border:1px solid #888;padding:3px 5px;text-align:center;vertical-align:middle;min-width:70px;'
const timeTdStyle = 'border:1px solid #888;padding:3px 5px;background:#f8f8f8;font-size:8px;font-family:Arial;color:#555;white-space:nowrap;text-align:right;'

// ─────────────────────────────────────────────────────────────
// Core: render DOM element → canvas → PDF page
// ─────────────────────────────────────────────────────────────

async function htmlToPdfPage(
  pdf: jsPDF,
  htmlContent: string,
  isFirst: boolean,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const container = document.createElement('div')
  container.style.cssText = `
    position:fixed;left:-9999px;top:0;
    width:1054px;          /* A4 landscape ≈ 297mm at 96dpi */
    background:#fff;
    padding:20px;
    font-family:Arial,sans-serif;
    box-sizing:border-box;
  `
  container.innerHTML = htmlContent
  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    if (!isFirst) pdf.addPage('a4', 'landscape')

    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 8 // mm

    const usableW = pageW - margin * 2
    const usableH = pageH - margin * 2

    const imgRatio = canvas.width / canvas.height
    let imgW = usableW
    let imgH = imgW / imgRatio

    if (imgH > usableH) {
      imgH = usableH
      imgW = imgH * imgRatio
    }

    const xOff = margin + (usableW - imgW) / 2
    const yOff = margin + (usableH - imgH) / 2

    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    pdf.addImage(imgData, 'JPEG', xOff, yOff, imgW, imgH)
    onProgress?.(50)
  } finally {
    document.body.removeChild(container)
  }
}

// ─────────────────────────────────────────────────────────────
// Public export functions
// ─────────────────────────────────────────────────────────────

export interface PdfExportOptions {
  school:      School
  timetable:   Timetable
  slots:       TimetableSlot[]
  classes:     SchoolClass[]
  teachers:    Teacher[]
  logoDataUrl?: string | null
  onProgress?: (pct: number) => void
}

/** Per-class PDF: one page per class (§5.8 "Per-Class A4") */
export async function exportClassPdf(
  opts: PdfExportOptions,
  classId: string,
): Promise<void> {
  const cls = opts.classes.find(c => c.id === classId)
  if (!cls) return

  const teacherMap = new Map(opts.teachers.map(t => [t.id, t]))
  const classSlots = opts.slots.filter(s => s.class_id === classId)

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const header  = buildHeaderHtml(opts.school, opts.timetable, `Class Timetable — ${classLabel(cls)}`, opts.logoDataUrl ?? null)
  const table   = buildClassTableHtml(cls, classSlots, teacherMap)
  const legend  = buildLegendHtml(classSlots)
  const footer  = `<div style="text-align:center;font-size:8px;color:#888;font-family:Arial;margin-top:6px;">Powered by AG Computer Solutions — InstaRatiba</div>`

  await htmlToPdfPage(pdf, header + table + legend + footer, true, opts.onProgress)

  opts.onProgress?.(90)
  pdf.save(exportFilename(opts.school, opts.timetable, `Grade_${cls.grade}${cls.stream}`, 'pdf'))
  opts.onProgress?.(100)
}

/** Master timetable PDF (all classes, one page per day or combined) */
export async function exportMasterPdf(opts: PdfExportOptions): Promise<void> {
  const teacherMap = new Map(opts.teachers.map(t => [t.id, t]))
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const header = buildHeaderHtml(opts.school, opts.timetable, 'Master Timetable — All Classes', opts.logoDataUrl ?? null)
  const table  = buildMasterTableHtml(opts.slots, opts.classes, teacherMap)
  const legend = buildLegendHtml(opts.slots)
  const footer = `<div style="text-align:center;font-size:8px;color:#888;font-family:Arial;margin-top:6px;">Powered by AG Computer Solutions — InstaRatiba</div>`

  await htmlToPdfPage(pdf, header + table + legend + footer, true, opts.onProgress)

  opts.onProgress?.(90)
  pdf.save(exportFilename(opts.school, opts.timetable, 'Master', 'pdf'))
  opts.onProgress?.(100)
}

/** All-classes PDF: one page per class (§5.8 "Per-Class A4 mode") */
export async function exportAllClassesPdf(opts: PdfExportOptions): Promise<void> {
  const teacherMap = new Map(opts.teachers.map(t => [t.id, t]))
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const total = opts.classes.length

  for (let i = 0; i < opts.classes.length; i++) {
    const cls = opts.classes[i]
    const classSlots = opts.slots.filter(s => s.class_id === cls.id)
    const header = buildHeaderHtml(opts.school, opts.timetable, `Class Timetable — ${classLabel(cls)}`, opts.logoDataUrl ?? null)
    const table  = buildClassTableHtml(cls, classSlots, teacherMap)
    const legend = buildLegendHtml(classSlots)
    const footer = `<div style="text-align:center;font-size:8px;color:#888;font-family:Arial;margin-top:6px;">Powered by AG Computer Solutions — InstaRatiba</div>`

    await htmlToPdfPage(pdf, header + table + legend + footer, i === 0, opts.onProgress)
    opts.onProgress?.(Math.round(((i + 1) / total) * 90))
  }

  pdf.save(exportFilename(opts.school, opts.timetable, 'All_Classes', 'pdf'))
  opts.onProgress?.(100)
}

/** Teacher personal timetable PDF (§5.3) */
export async function exportTeacherPdf(
  opts: PdfExportOptions,
  teacherId: string,
): Promise<void> {
  const teacher = opts.teachers.find(t => t.id === teacherId)
  if (!teacher) return

  const classMap  = new Map(opts.classes.map(c => [c.id, c]))
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const header = buildHeaderHtml(opts.school, opts.timetable, `Teacher Timetable — ${teacher.name}`, opts.logoDataUrl ?? null)
  const table  = buildTeacherTableHtml(teacher, opts.slots, classMap)
  const legend = buildLegendHtml(opts.slots)
  const footer = `<div style="text-align:center;font-size:8px;color:#888;font-family:Arial;margin-top:6px;">Powered by AG Computer Solutions — InstaRatiba</div>`

  await htmlToPdfPage(pdf, header + table + legend + footer, true, opts.onProgress)

  opts.onProgress?.(90)
  pdf.save(exportFilename(opts.school, opts.timetable, `Teacher_${teacher.name.replace(/\s/g, '_')}`, 'pdf'))
  opts.onProgress?.(100)
}

/** All-teachers PDF: one page per teacher */
export async function exportAllTeachersPdf(opts: PdfExportOptions): Promise<void> {
  const classMap = new Map(opts.classes.map(c => [c.id, c]))
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const total = opts.teachers.length

  for (let i = 0; i < opts.teachers.length; i++) {
    const teacher = opts.teachers[i]
    const header = buildHeaderHtml(opts.school, opts.timetable, `Teacher Timetable — ${teacher.name}`, opts.logoDataUrl ?? null)
    const table  = buildTeacherTableHtml(teacher, opts.slots, classMap)
    const legend = buildLegendHtml(opts.slots)
    const footer = `<div style="text-align:center;font-size:8px;color:#888;font-family:Arial;margin-top:6px;">Powered by AG Computer Solutions — InstaRatiba</div>`

    await htmlToPdfPage(pdf, header + table + legend + footer, i === 0, opts.onProgress)
    opts.onProgress?.(Math.round(((i + 1) / total) * 90))
  }

  pdf.save(exportFilename(opts.school, opts.timetable, 'All_Teachers', 'pdf'))
  opts.onProgress?.(100)
}

/** Notice board PDF — large-text single-page per class (§5.8) */
export async function exportNoticeBoardPdf(opts: PdfExportOptions): Promise<void> {
  const teacherMap = new Map(opts.teachers.map(t => [t.id, t]))
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const total = opts.classes.length

  for (let i = 0; i < opts.classes.length; i++) {
    const cls = opts.classes[i]
    const classSlots = opts.slots.filter(s => s.class_id === cls.id)

    // Notice board: slightly larger cells — scale text up
    const header = buildHeaderHtml(opts.school, opts.timetable, `${classLabel(cls)} — Notice Board`, opts.logoDataUrl ?? null)

    // Reuse class table but inject large-cell override style
    const tableHtml = buildClassTableHtml(cls, classSlots, teacherMap).replace(
      /font-size:9px/g, 'font-size:11px',
    ).replace(/font-size:8px/g, 'font-size:10px')

    const footer = `<div style="text-align:center;font-size:9px;color:#888;font-family:Arial;margin-top:6px;font-weight:700;">Notice Board Copy — ${classLabel(cls)} | Term ${opts.school.current_term} ${opts.school.academic_year}</div>`

    await htmlToPdfPage(pdf, header + tableHtml + footer, i === 0, opts.onProgress)
    opts.onProgress?.(Math.round(((i + 1) / total) * 90))
  }

  pdf.save(exportFilename(opts.school, opts.timetable, 'Notice_Board', 'pdf'))
  opts.onProgress?.(100)
}
