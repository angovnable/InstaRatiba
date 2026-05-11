// ============================================================
// InstaRatiba — Segment 8
// jsonExport.ts
// §4.2.10 "Export — JSON backup"
// Full fidelity snapshot of the timetable state for
// re-import or off-platform storage.
// ============================================================

import type {
  TimetableSlot, SchoolClass, Teacher, School, Timetable, SubjectAllocation,
} from '@/types'
import { exportFilename } from './exportHelpers'

export interface TimetableBackup {
  _version:    string       // '1.0.0'
  exported_at: string       // ISO timestamp
  school:      School
  timetable:   Timetable
  classes:     SchoolClass[]
  teachers:    Teacher[]
  allocations: SubjectAllocation[]
  slots:       TimetableSlot[]
}

/** Download a full JSON snapshot of the timetable */
export function exportJson(
  school:      School,
  timetable:   Timetable,
  classes:     SchoolClass[],
  teachers:    Teacher[],
  allocations: SubjectAllocation[],
  slots:       TimetableSlot[],
): void {
  const backup: TimetableBackup = {
    _version:    '1.0.0',
    exported_at: new Date().toISOString(),
    school,
    timetable,
    classes,
    teachers,
    allocations,
    slots,
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = exportFilename(school, timetable, 'Backup', 'json')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Validate and parse an uploaded JSON backup file */
export async function importJsonBackup(file: File): Promise<TimetableBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const raw = JSON.parse(e.target?.result as string) as TimetableBackup
        if (!raw._version || !raw.school || !raw.timetable || !raw.slots) {
          reject(new Error('Invalid backup file — missing required fields.'))
          return
        }
        resolve(raw)
      } catch {
        reject(new Error('Could not parse JSON backup file.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsText(file)
  })
}
