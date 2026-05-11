import type { Conflict } from '@/types'

interface ConflictAlertProps {
  conflict: Conflict
  onJumpTo?: () => void
  onResolve?: () => void
}

export default function ConflictAlert({ conflict, onJumpTo, onResolve }: ConflictAlertProps) {
  const isHard = conflict.severity === 'hard'

  return (
    <div
      className={[
        'flex gap-3 items-start rounded-md border p-3 mb-2 text-sm',
        isHard
          ? 'border-ir-error/40 bg-[#FFEBEE] text-[#C62828]'
          : 'border-warn/40 bg-[#FFF8E1] text-[#E65100]',
      ].join(' ')}
      role="alert"
    >
      <i className={`${isHard ? 'bi-x-circle-fill' : 'bi-exclamation-triangle-fill'} text-base mt-0.5 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="font-bold capitalize text-xs tracking-wide mb-0.5">
          {isHard ? 'Hard Conflict' : 'Warning'}
        </p>
        <p className="text-xs opacity-90 leading-relaxed">{conflict.description}</p>
        {(onJumpTo || onResolve) && (
          <div className="flex gap-3 mt-2">
            {onJumpTo && (
              <button
                onClick={onJumpTo}
                className="text-xs font-semibold underline underline-offset-2 opacity-80 hover:opacity-100"
              >
                Jump to →
              </button>
            )}
            {onResolve && !isHard && (
              <button
                onClick={onResolve}
                className="text-xs font-semibold underline underline-offset-2 opacity-80 hover:opacity-100"
              >
                Mark resolved
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
