import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { SchoolClass, Teacher, Timetable, School } from '@/types'
import { DAYS, JSS_SLOTS } from './constants'

// ── Shared helpers ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

const BRAND = { r: 26, g: 82, b: 118 }         // navy blue
const GOLD  = { r: 212, g: 160, b: 17 }         // gold
const ORANGE = { r: 230, g: 81, b: 0 }          // orange accent
const LIGHT  = { r: 248, g: 250, b: 252 }

function addHeader(doc: jsPDF, school: School, subtitle: string) {
  // Gold bar
  doc.setFillColor(GOLD.r, GOLD.g, GOLD.b)
  doc.rect(0, 0, 300, 8, 'F')

  // Navy header
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
  doc.rect(0, 8, 300, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('InstaRatiba — CBC School Timetable System', 14, 17)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`${school.name}${school.county ? ` · ${school.county}` : ''} · ${school.term}`, 14, 24)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(GOLD.r, GOLD.g, GOLD.b)
  doc.text(subtitle, doc.internal.pageSize.getWidth() - 14, 19, { align: 'right' })

  doc.setTextColor(100, 100, 100)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-KE', { dateStyle: 'full' })}`,
    doc.internal.pageSize.getWidth() - 14, 25, { align: 'right' }
  )

  return 34 // startY
}

function addFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pw = doc.internal.pageSize.getWidth()
    const ph = doc.internal.pageSize.getHeight()
    doc.setFillColor(BRAND.r, BRAND.g, BRAND.b)
    doc.rect(0, ph - 8, pw, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text('InstaRatiba · instaratiba.web.app · Powered by AG Computer Systems', 14, ph - 3)
    doc.text(`Page ${i} of ${pageCount}`, pw - 14, ph - 3, { align: 'right' })
  }
}

function buildClassBody(
  grid: ReturnType<typeof Object.values>[0],
  teachers: Teacher[],
  classes: SchoolClass[],
  bwMode = false
): { body: any[][]; cellColors: Map<string, [number, number, number]> } {
  const lessonSlots = JSS_SLOTS.filter(s => s.type === 'lesson')
  const body: any[][] = []
  const cellColors = new Map<string, [number, number, number]>()
  let lessonIndex = 0

  for (const slot of JSS_SLOTS) {
    if (slot.type === 'pre') { body.push(['Assembly', ...DAYS.map(() => '')]); continue }
    if (slot.type === 'break') { body.push([`${slot.label}\n${slot.time}`, ...DAYS.map(() => '')]); continue }
    const si = lessonIndex++
    const row: string[] = [`${slot.time}\n${slot.label}`]
    for (let di = 0; di < 5; di++) {
      const cell = (grid as any)[di]?.[si]
      if (!cell?.subjectName) { row.push(''); continue }
      const teacher = teachers.find(t => t.id === cell.teacherId)
      const surname = teacher ? teacher.name.split(' ').slice(-1)[0] : ''
      row.push(cell.subjectName + (surname ? `\n${surname}` : ''))
      if (!bwMode && cell.color) {
        cellColors.set(`${body.length}-${di + 1}`, hexToRgb(cell.color))
      }
    }
    body.push(row)
  }
  return { body, cellColors }
}

// ── 1. Class/Stream PDF ─────────────────────────────────────────────────────

export function exportStreamPDF(
  school: School, cls: SchoolClass, teachers: Teacher[], timetable: Timetable, bwMode = false
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const grid = timetable[cls.id]
  if (!grid) return

  const startY = addHeader(doc, school, `${cls.grade} ${cls.stream} — Class Timetable`)
  const { body, cellColors } = buildClassBody(grid, teachers, [cls], bwMode)

  autoTable(doc, {
    head: [['Period / Time', ...DAYS]],
    body,
    startY,
    styles: { fontSize: 7, cellPadding: 2.5, overflow: 'linebreak', valign: 'middle', halign: 'center' },
    headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255, fontStyle: 'bold', halign: 'center' },
    columnStyles: { 0: { cellWidth: 22, fontStyle: 'bold', halign: 'left' } },
    alternateRowStyles: { fillColor: [LIGHT.r, LIGHT.g, LIGHT.b] },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index > 0) {
        const key = `${data.row.index}-${data.column.index}`
        const color = cellColors.get(key)
        if (color) {
          doc.setFillColor(color[0], color[1], color[2])
          ;(doc as any).setGState(new (doc as any).GState({ opacity: 0.18 }))
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F')
          ;(doc as any).setGState(new (doc as any).GState({ opacity: 1 }))
        }
      }
    }
  })

  addFooter(doc)
  doc.save(`InstaRatiba_${cls.grade}_${cls.stream}_${school.term.replace(/\s+/g, '_')}.pdf`)
}

// ── 2. Teacher PDF ──────────────────────────────────────────────────────────

export function exportTeacherPDF(
  school: School, teacher: Teacher, classes: SchoolClass[], timetable: Timetable, bwMode = false
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const lessonSlots = JSS_SLOTS.filter(s => s.type === 'lesson')
  const startY = addHeader(doc, school, `${teacher.name} — Teacher Timetable`)

  // Workload summary row
  let totalLoad = 0
  for (const cls of classes) {
    for (const sub of cls.subjects) {
      if (sub.teacherId === teacher.id) totalLoad += sub.periods
    }
  }
  doc.setFontSize(9)
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
  doc.setFont('helvetica', 'bold')
  doc.text(`TSC: ${teacher.tsc || '—'}   Weekly Load: ${totalLoad}/${teacher.maxWeek} lessons   Max/Day: ${teacher.maxDay}`, 14, startY + 4)

  const body: string[][] = []
  let lessonIndex = 0

  for (const slot of JSS_SLOTS) {
    if (slot.type === 'pre') { body.push(['Assembly', ...DAYS.map(() => '')]); continue }
    if (slot.type === 'break') { body.push([`${slot.label}\n${slot.time}`, ...DAYS.map(() => '')]); continue }
    const si = lessonIndex++
    const row: string[] = [`${slot.time}\n${slot.label}`]
    for (let di = 0; di < 5; di++) {
      let found: { subjectName: string; grade: string; stream: string; color: string } | null = null
      for (const cls of classes) {
        const cell = timetable[cls.id]?.[di]?.[si]
        if (cell?.teacherId === teacher.id) {
          found = { subjectName: cell.subjectName, grade: cls.grade, stream: cls.stream, color: cell.color || '#455A64' }
          break
        }
      }
      row.push(found ? `${found.subjectName}\n${found.grade.replace('Grade ', 'G')} ${found.stream}` : '')
    }
    body.push(row)
  }

  autoTable(doc, {
    head: [['Period / Time', ...DAYS]],
    body,
    startY: startY + 8,
    styles: { fontSize: 7, cellPadding: 2.5, overflow: 'linebreak', valign: 'middle', halign: 'center' },
    headStyles: { fillColor: [ORANGE.r, ORANGE.g, ORANGE.b], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 22, fontStyle: 'bold', halign: 'left' } },
    alternateRowStyles: { fillColor: [LIGHT.r, LIGHT.g, LIGHT.b] },
  })

  addFooter(doc)
  doc.save(`InstaRatiba_Teacher_${teacher.name.replace(/\s+/g, '_')}_${school.term.replace(/\s+/g, '_')}.pdf`)
}

// ── 3. All Classes PDF ─────────────────────────────────────────────────────

export function exportAllClassesPDF(
  school: School, classes: SchoolClass[], teachers: Teacher[], timetable: Timetable, bwMode = false
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let first = true

  for (const cls of classes) {
    const grid = timetable[cls.id]
    if (!grid) continue
    if (!first) doc.addPage()
    first = false

    const startY = addHeader(doc, school, `${cls.grade} ${cls.stream} — Class Timetable`)
    const { body, cellColors } = buildClassBody(grid, teachers, [cls], bwMode)

    autoTable(doc, {
      head: [['Period / Time', ...DAYS]],
      body,
      startY,
      styles: { fontSize: 7, cellPadding: 2.5, overflow: 'linebreak', valign: 'middle', halign: 'center' },
      headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 22, fontStyle: 'bold', halign: 'left' } },
      alternateRowStyles: { fillColor: [LIGHT.r, LIGHT.g, LIGHT.b] },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index > 0) {
          const key = `${data.row.index}-${data.column.index}`
          const color = cellColors.get(key)
          if (color && !bwMode) {
            doc.setFillColor(color[0], color[1], color[2])
            ;(doc as any).setGState(new (doc as any).GState({ opacity: 0.18 }))
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F')
            ;(doc as any).setGState(new (doc as any).GState({ opacity: 1 }))
          }
        }
      }
    })
  }

  addFooter(doc)
  doc.save(`InstaRatiba_AllClasses_${school.term.replace(/\s+/g, '_')}.pdf`)
}

// ── 4. All Teachers PDF ────────────────────────────────────────────────────

export function exportAllTeachersPDF(
  school: School, teachers: Teacher[], classes: SchoolClass[], timetable: Timetable
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let first = true

  for (const teacher of teachers) {
    if (!first) doc.addPage()
    first = false
    exportTeacherPDFPage(doc, school, teacher, classes, timetable)
  }

  addFooter(doc)
  doc.save(`InstaRatiba_AllTeachers_${school.term.replace(/\s+/g, '_')}.pdf`)
}

function exportTeacherPDFPage(
  doc: jsPDF, school: School, teacher: Teacher, classes: SchoolClass[], timetable: Timetable
) {
  const startY = addHeader(doc, school, `${teacher.name} — Teacher Timetable`)
  let totalLoad = 0
  for (const cls of classes) for (const sub of cls.subjects) if (sub.teacherId === teacher.id) totalLoad += sub.periods

  doc.setFontSize(9)
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
  doc.setFont('helvetica', 'bold')
  doc.text(`Weekly Load: ${totalLoad}/${teacher.maxWeek}   TSC: ${teacher.tsc || '—'}`, 14, startY + 4)

  const body: string[][] = []
  let li = 0
  for (const slot of JSS_SLOTS) {
    if (slot.type === 'pre') { body.push(['Assembly', ...DAYS.map(() => '')]); continue }
    if (slot.type === 'break') { body.push([`${slot.label}\n${slot.time}`, ...DAYS.map(() => '')]); continue }
    const si = li++
    const row = [`${slot.time}\n${slot.label}`]
    for (let di = 0; di < 5; di++) {
      let found = ''
      for (const cls of classes) {
        const cell = timetable[cls.id]?.[di]?.[si]
        if (cell?.teacherId === teacher.id) { found = `${cell.subjectName}\n${cls.grade.replace('Grade ','G')} ${cls.stream}`; break }
      }
      row.push(found)
    }
    body.push(row)
  }

  autoTable(doc, {
    head: [['Period / Time', ...DAYS]],
    body,
    startY: startY + 8,
    styles: { fontSize: 7, cellPadding: 2.5, overflow: 'linebreak', valign: 'middle', halign: 'center' },
    headStyles: { fillColor: [ORANGE.r, ORANGE.g, ORANGE.b], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 22, fontStyle: 'bold', halign: 'left' } },
    alternateRowStyles: { fillColor: [LIGHT.r, LIGHT.g, LIGHT.b] },
  })
}

// ── 5. Master Timetable PDF ────────────────────────────────────────────────

export function exportMasterPDF(
  school: School, classes: SchoolClass[], teachers: Teacher[], timetable: Timetable
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const lessonSlots = JSS_SLOTS.filter(s => s.type === 'lesson')
  const startY = addHeader(doc, school, 'Master Timetable — All Streams')

  // Build columns: Time | Class1 | Class2 | …
  const head = [['Time', ...classes.map(c => `${c.grade.replace('Grade ','G')} ${c.stream}`)]]
  const body: string[][] = []
  let li = 0

  for (const slot of JSS_SLOTS) {
    if (slot.type === 'pre') { body.push(['Assembly', ...classes.map(() => '')]); continue }
    if (slot.type === 'break') { body.push([`${slot.label}`, ...classes.map(() => '')]); continue }
    const si = li++
    const row = [`${slot.time}`]
    for (const cls of classes) {
      const cells: string[] = []
      for (let di = 0; di < 5; di++) {
        const cell = timetable[cls.id]?.[di]?.[si]
        cells.push(cell?.subjectName?.slice(0, 8) || '—')
      }
      row.push(cells.join('\n'))
    }
    body.push(row)
  }

  autoTable(doc, {
    head,
    body,
    startY,
    styles: { fontSize: 5.5, cellPadding: 1.5, overflow: 'linebreak', valign: 'middle', halign: 'center' },
    headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255, fontStyle: 'bold', fontSize: 6 },
    columnStyles: { 0: { cellWidth: 18, fontStyle: 'bold', halign: 'left', fontSize: 6 } },
    alternateRowStyles: { fillColor: [LIGHT.r, LIGHT.g, LIGHT.b] },
  })

  addFooter(doc)
  doc.save(`InstaRatiba_Master_${school.term.replace(/\s+/g, '_')}.pdf`)
}

// ── 6. MoE Compliance Report PDF ──────────────────────────────────────────

export function exportMoEReportPDF(
  school: School,
  classes: SchoolClass[],
  compliance: Record<string, Record<string, { name: string; placed: number; required: number }>>,
  teachers: Teacher[]
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const startY = addHeader(doc, school, 'MoE Compliance Report')

  doc.setFontSize(11)
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b)
  doc.setFont('helvetica', 'bold')
  doc.text('Kenya CBC — Ministry of Education Period Compliance Summary', 14, startY + 6)

  const body: any[][] = []
  for (const cls of classes) {
    const comp = compliance[cls.id] ?? {}
    for (const [, item] of Object.entries(comp)) {
      const ok = item.placed >= item.required
      body.push([
        `${cls.grade} ${cls.stream}`,
        item.name,
        item.required,
        item.placed,
        ok ? '✓ OK' : `⚠ Missing ${item.required - item.placed}`
      ])
    }
  }

  autoTable(doc, {
    head: [['Class', 'Subject', 'Required', 'Placed', 'Status']],
    body,
    startY: startY + 12,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 4: { fontStyle: 'bold' } },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const text = data.cell.text.join('')
        doc.setTextColor(text.startsWith('✓') ? 0 : 180, text.startsWith('✓') ? 128 : 0, 0)
      }
    }
  })

  // Teacher summary
  doc.addPage()
  const startY2 = addHeader(doc, school, 'Teacher Workload Summary')

  const tBody = teachers.map(t => {
    let load = 0
    for (const cls of classes) for (const sub of cls.subjects) if (sub.teacherId === t.id) load += sub.periods
    const pct = Math.round((load / t.maxWeek) * 100)
    return [t.name, t.tsc || '—', t.maxWeek, load, `${pct}%`, load > t.maxWeek ? '⚠ Overloaded' : '✓ OK']
  })

  autoTable(doc, {
    head: [['Teacher', 'TSC No.', 'Max/Week', 'Assigned', 'Load %', 'Status']],
    body: tBody,
    startY: startY2 + 8,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [ORANGE.r, ORANGE.g, ORANGE.b], textColor: 255, fontStyle: 'bold' },
  })

  addFooter(doc)
  doc.save(`InstaRatiba_MoE_Report_${school.term.replace(/\s+/g, '_')}.pdf`)
}
