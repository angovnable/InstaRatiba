// ============================================================
// InstaRatiba — Segment 7
// ApprovalPanel — timetable approval & publishing workflow
// §4.2.11 Screen 9 — Approval & Publishing
// §5.12 Shareable Read-Only Link
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase/client'
import type { Timetable, TimetableStatus, ApprovalComment } from '@/types'

// ── Status badge ──────────────────────────────────────────────

function StatusBadge({ status }: { status: TimetableStatus }) {
  const map = {
    draft:     { label: 'Draft',          icon: 'bi-pencil',            bg: 'bg-gray-100',    text: 'text-gray-600'  },
    pending:   { label: 'Pending Review', icon: 'bi-hourglass-split',   bg: 'bg-amber-100',   text: 'text-amber-700' },
    published: { label: 'Published',      icon: 'bi-check-circle-fill', bg: 'bg-green-100',   text: 'text-green-700' },
    archived:  { label: 'Archived',       icon: 'bi-archive',           bg: 'bg-gray-100',    text: 'text-gray-500'  },
  }
  const s = map[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${s.bg} ${s.text}`}>
      <i className={`${s.icon} text-base`} />
      {s.label}
    </span>
  )
}

// ── Approval comment row ──────────────────────────────────────

function CommentRow({ comment }: { comment: ApprovalComment }) {
  const date = new Date(comment.created_at).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
  return (
    <div className="flex gap-3 py-3 border-b border-[--color-accent-light] last:border-0">
      <div className="w-8 h-8 rounded-full bg-[--color-primary] flex items-center justify-center text-white text-xs font-bold shrink-0">
        HT
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-semibold text-[--color-text]">Head Teacher</p>
          <p className="text-[10px] text-[--color-muted] shrink-0">{date}</p>
        </div>
        <p className="text-sm text-[--color-text] mt-0.5">{comment.comment}</p>
        {comment.slot_id && (
          <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-[--color-info] bg-blue-50 px-2 py-0.5 rounded-full">
            <i className="bi bi-grid-3x2" /> Attached to a slot
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────

interface ApprovalPanelProps {
  timetable:         Timetable
  shareToken:        string | null
  hardConflictCount: number
  onSubmitForApproval: () => Promise<void>
  onApprove:           () => Promise<void>
  onReturn:            () => Promise<void>
  onGenerateShareLink: () => Promise<void>
  onRevokeShareLink:   () => Promise<void>
}

export default function ApprovalPanel({
  timetable, shareToken, hardConflictCount,
  onSubmitForApproval, onApprove, onReturn,
  onGenerateShareLink, onRevokeShareLink,
}: ApprovalPanelProps) {
  const { user } = useAuthStore()
  const [comments, setComments]     = useState<ApprovalComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isBusy, setIsBusy]         = useState(false)
  const [showComments, setShowComments] = useState(false)

  const isHeadTeacher = user?.role === 'head_teacher'
  const isDeputy      = user?.role === 'deputy_head' || user?.role === 'hod'
  const shareUrl      = shareToken
    ? `${window.location.origin}/timetable/share/${shareToken}`
    : null

  // Load comments when panel expands
  const loadComments = async () => {
    const { data } = await supabase
      .from('approval_comments')
      .select('*')
      .eq('timetable_id', timetable.id)
      .order('created_at', { ascending: false })
    setComments((data ?? []) as ApprovalComment[])
    setShowComments(true)
  }

  // Post a comment (head teacher only)
  const postComment = async () => {
    if (!newComment.trim() || !user) return
    setIsBusy(true)
    const comment: ApprovalComment = {
      id:           crypto.randomUUID(),
      timetable_id: timetable.id,
      author_id:    user.id,
      comment:      newComment.trim(),
      created_at:   new Date().toISOString(),
    }
    const { error } = await supabase.from('approval_comments').insert(comment)
    if (!error) {
      setComments(prev => [comment, ...prev])
      setNewComment('')
      toast.success('Comment added')
    } else {
      toast.error('Failed to post comment')
    }
    setIsBusy(false)
  }

  const busy = async (fn: () => Promise<void>) => {
    setIsBusy(true)
    try { await fn() } finally { setIsBusy(false) }
  }

  // ── Status-aware action section ──────────────────────────

  return (
    <div className="space-y-4">
      {/* Status + timetable name */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[--color-text]">{timetable.name}</h3>
          <p className="text-xs text-[--color-muted] mt-0.5">
            Created {new Date(timetable.created_at).toLocaleDateString('en-KE')}
            {timetable.approved_at && ` · Approved ${new Date(timetable.approved_at).toLocaleDateString('en-KE')}`}
          </p>
        </div>
        <StatusBadge status={timetable.status} />
      </div>

      {/* Workflow steps visual */}
      <div className="flex items-center gap-0">
        {(['draft', 'pending', 'published'] as TimetableStatus[]).map((step, i) => {
          const done    = ['draft','pending','published','archived'].indexOf(timetable.status) > i
          const current = timetable.status === step
          const labels  = ['Draft', 'Pending Review', 'Published']
          return (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${done || current
                    ? 'bg-[--color-primary] border-[--color-primary] text-white'
                    : 'bg-white border-[--color-accent-light] text-[--color-muted]'
                  }`}>
                  {done && !current ? <i className="bi bi-check-lg" /> : i + 1}
                </div>
                <span className={`text-[9px] mt-1 font-medium text-center leading-tight
                  ${current ? 'text-[--color-primary]' : 'text-[--color-muted]'}`}>
                  {labels[i]}
                </span>
              </div>
              {i < 2 && (
                <div className={`h-0.5 flex-1 mx-1 -mt-4 rounded ${done ? 'bg-[--color-primary]' : 'bg-[--color-accent-light]'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Action buttons by role + status */}

      {/* Deputy: can submit if draft */}
      {isDeputy && timetable.status === 'draft' && (
        <button
          onClick={() => busy(onSubmitForApproval)}
          disabled={isBusy || hardConflictCount > 0}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[--color-primary] text-white font-semibold text-sm hover:bg-[#1B5E20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBusy
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
            : <><i className="bi bi-send-check" /> Submit for Head Teacher Approval</>
          }
        </button>
      )}
      {isDeputy && timetable.status === 'draft' && hardConflictCount > 0 && (
        <p className="text-xs text-center text-[--color-error]">
          <i className="bi bi-lock-fill mr-1" />
          Resolve {hardConflictCount} hard conflict{hardConflictCount > 1 ? 's' : ''} before submitting
        </p>
      )}

      {/* Pending: Head Teacher review actions */}
      {isHeadTeacher && timetable.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={() => busy(onReturn)}
            disabled={isBusy}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[--color-warn] text-[#E65100] font-semibold text-sm hover:bg-amber-50 transition-colors disabled:opacity-50"
          >
            <i className="bi bi-arrow-return-left" /> Return for Revision
          </button>
          <button
            onClick={() => busy(onApprove)}
            disabled={isBusy}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[--color-primary] text-white font-semibold text-sm hover:bg-[#1B5E20] transition-colors disabled:opacity-50"
          >
            {isBusy
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> …</>
              : <><i className="bi bi-check2-circle" /> Approve & Publish</>
            }
          </button>
        </div>
      )}

      {/* Published: share link section */}
      {timetable.status === 'published' && (
        <div className="space-y-3 p-4 rounded-xl bg-green-50 border border-green-200">
          <div className="flex items-center gap-2">
            <i className="bi bi-check-circle-fill text-[--color-primary] text-lg" />
            <p className="text-sm font-semibold text-[--color-text]">Timetable is live and published</p>
          </div>

          {shareUrl ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-white rounded-lg border border-green-200 px-3 py-2">
                <i className="bi bi-link-45deg text-[--color-primary]" />
                <p className="text-xs text-[--color-muted] flex-1 truncate font-mono">{shareUrl}</p>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(shareUrl)
                    toast.success('Link copied!')
                  }}
                  className="text-[--color-primary] text-xs font-semibold hover:underline shrink-0"
                >
                  Copy
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onGenerateShareLink}
                  className="flex items-center gap-1.5 text-xs text-[--color-primary] hover:underline font-medium"
                >
                  <i className="bi bi-arrow-clockwise" /> Regenerate
                </button>
                <span className="text-[--color-muted]">·</span>
                <button
                  onClick={onRevokeShareLink}
                  className="flex items-center gap-1.5 text-xs text-[--color-error] hover:underline font-medium"
                >
                  <i className="bi bi-x-circle" /> Revoke
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onGenerateShareLink}
              className="flex items-center gap-2 text-sm text-[--color-primary] font-semibold hover:underline"
            >
              <i className="bi bi-share" /> Generate share link
            </button>
          )}
        </div>
      )}

      {/* Comments section (head teacher + pending/published) */}
      {(timetable.status === 'pending' || timetable.status === 'published') && (
        <div className="border border-[--color-accent-light] rounded-xl overflow-hidden">
          <button
            onClick={() => showComments ? setShowComments(false) : loadComments()}
            className="w-full flex items-center justify-between px-4 py-3 bg-[--color-surface] hover:bg-[--color-accent-light]/30 transition-colors"
          >
            <span className="text-sm font-semibold text-[--color-text] flex items-center gap-2">
              <i className="bi bi-chat-left-text text-[--color-primary]" />
              Review Comments
            </span>
            <i className={`bi ${showComments ? 'bi-chevron-up' : 'bi-chevron-down'} text-[--color-muted]`} />
          </button>

          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3 bg-white space-y-0">
                  {/* Add comment (head teacher only, pending status) */}
                  {isHeadTeacher && timetable.status === 'pending' && (
                    <div className="flex gap-2 pb-3 mb-1 border-b border-[--color-accent-light]">
                      <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a review comment…"
                        rows={2}
                        className="flex-1 border border-[--color-accent-light] rounded-lg px-3 py-2 text-sm text-[--color-text] bg-white focus:ring-2 focus:ring-[--color-primary] focus:outline-none resize-none"
                      />
                      <button
                        onClick={postComment}
                        disabled={!newComment.trim() || isBusy}
                        className="self-end px-3 py-2 rounded-lg bg-[--color-primary] text-white text-sm font-semibold hover:bg-[#1B5E20] transition-colors disabled:opacity-50"
                      >
                        <i className="bi bi-send" />
                      </button>
                    </div>
                  )}

                  {comments.length === 0 ? (
                    <p className="text-sm text-[--color-muted] italic py-2">No comments yet.</p>
                  ) : (
                    comments.map(c => <CommentRow key={c.id} comment={c} />)
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
