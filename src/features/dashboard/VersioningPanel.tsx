// ============================================================
// InstaRatiba — Segment 9
// VersioningPanel.tsx
// Multi-timetable versioning UI — §5.5
// Create / duplicate / delete / switch timetable versions.
// ============================================================

import { useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import type { Timetable } from '@/types'
import { createTimetable } from '@/lib/supabase/dashboard'

interface Props {
  timetables:  Timetable[]
  currentId:   string | undefined
  schoolId:    string
  onActivate:  (tt: Timetable) => void
  onDuplicate: (tt: Timetable) => void
  onDelete:    (id: string) => void
  onReload:    () => void
}

type NewTtForm = { name: string; year: number; term: 1 | 2 | 3 }

export default function VersioningPanel({
  timetables, currentId, schoolId, onActivate, onDuplicate, onDelete, onReload,
}: Props) {
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState<NewTtForm>({
    name: '',
    year: new Date().getFullYear(),
    term: 1,
  })
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Please enter a timetable name'); return }
    setCreating(true)
    try {
      await createTimetable({
        school_id: schoolId,
        term_id:   null as unknown as string,
        name:      form.name.trim(),
        status:    'draft',
      })
      toast.success(`"${form.name}" created`)
      setShowNew(false)
      setForm({ name: '', year: new Date().getFullYear(), term: 1 })
      onReload()
    } catch (e) {
      toast.error('Failed to create timetable: ' + (e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  const statusInfo: Record<Timetable['status'], { icon: string; label: string; cls: string }> = {
    draft:     { icon: 'bi-pencil',               label: 'Draft',    cls: 'bg-[#EDE7D9] text-[#7A8C82]' },
    pending:   { icon: 'bi-hourglass-split',       label: 'Pending',  cls: 'bg-[rgba(200,146,42,0.10)] text-[#9B6E1A]' },
    published: { icon: 'bi-check-circle-fill',     label: 'Live',     cls: 'bg-[#EDE7D9] text-[#0D3D23]' },
    archived:  { icon: 'bi-archive',               label: 'Archived', cls: 'bg-slate-100 text-slate-500' },
  }

  return (
    <div className="space-y-4">

      {/* Header + new button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[--color-muted]">
          {timetables.length} version{timetables.length !== 1 ? 's' : ''} saved
        </p>
        <button onClick={() => setShowNew(true)} className="btn-primary text-sm">
          <i className="bi bi-plus-lg mr-1.5" />New Version
        </button>
      </div>

      {/* Timetable list */}
      {timetables.length === 0 ? (
        <div className="bg-[--color-surface] rounded-2xl p-8 text-center">
          <i className="bi bi-calendar-x text-3xl text-[--color-accent-light] block mb-2" />
          <p className="text-sm text-[--color-muted]">No timetable versions yet. Generate one from the Review screen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {timetables.map(tt => {
            const si = statusInfo[tt.status]
            const isActive = tt.id === currentId
            return (
              <div
                key={tt.id}
                className={`bg-white border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 transition-all ${
                  isActive
                    ? 'border-[--color-primary] shadow-md shadow-green-100'
                    : 'border-[--color-accent-light] hover:border-[--color-mid]'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="w-1.5 h-12 rounded-full bg-[--color-primary] hidden sm:block flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="font-semibold text-[--color-text] truncate">{tt.name}</span>
                    {isActive && (
                      <span className="text-[10px] bg-[#EDE7D9] text-[#0D3D23] font-semibold px-2 py-0.5 rounded-full">ACTIVE</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[--color-muted]">
                    <span>
                      <i className={`${si.icon} mr-1`} />
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${si.cls}`}>{si.label}</span>
                    </span>
                    <span><i className="bi bi-clock mr-1" />
                      {new Date(tt.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {tt.approved_at && (
                      <span><i className="bi bi-check2-all mr-1 text-[#0D3D23]" />
                        Approved {new Date(tt.approved_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {!isActive && (
                    <button
                      onClick={() => onActivate(tt)}
                      className="text-xs border border-[--color-primary] text-[--color-primary] rounded-lg px-3 py-1.5 hover:bg-[rgba(13,61,35,0.06)] transition-colors"
                    >
                      <i className="bi bi-lightning mr-1" />Use This
                    </button>
                  )}
                  <button
                    onClick={() => onDuplicate(tt)}
                    title="Duplicate as new version"
                    className="text-xs border border-[--color-accent-light] text-[--color-muted] rounded-lg px-3 py-1.5 hover:border-[--color-primary] hover:text-[--color-primary] transition-colors"
                  >
                    <i className="bi bi-copy mr-1" />Duplicate
                  </button>
                  {tt.status !== 'published' && (
                    <button
                      onClick={() => onDelete(tt.id)}
                      title="Delete version"
                      className="text-xs border border-[rgba(160,31,31,0.2)] text-[#A01F1F] rounded-lg px-3 py-1.5 hover:bg-[rgba(160,31,31,0.06)] transition-colors"
                    >
                      <i className="bi bi-trash" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New timetable modal */}
      {showNew && (
        <Modal
          isOpen
          onClose={() => setShowNew(false)}
          title="New Timetable Version"
          size="sm"
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-[--color-muted] mb-1">Name</label>
              <input
                className="w-full border border-[--color-accent-light] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                placeholder="e.g. Term 1 2026"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[--color-muted] mb-1">Year</label>
                <input
                  type="number"
                  className="w-full border border-[--color-accent-light] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                  value={form.year}
                  min={2020} max={2040}
                  onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[--color-muted] mb-1">Term</label>
                <select
                  className="w-full border border-[--color-accent-light] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] bg-white"
                  value={form.term}
                  onChange={e => setForm(f => ({ ...f, term: Number(e.target.value) as 1|2|3 }))}
                >
                  <option value={1}>Term 1</option>
                  <option value={2}>Term 2</option>
                  <option value={3}>Term 3</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowNew(false)}
                className="flex-1 py-2 text-sm border border-[--color-accent-light] rounded-xl text-[--color-muted] hover:border-[--color-primary] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 py-2 text-sm bg-[--color-primary] text-white rounded-xl hover:bg-[--color-mid] transition-colors disabled:opacity-60"
              >
                {creating ? <i className="bi bi-arrow-repeat animate-spin mr-1" /> : null}
                Create
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
