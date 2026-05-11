interface SkeletonProps {
  width?: string
  height?: string
  className?: string
  rounded?: boolean
}

export function Skeleton({ width = '100%', height = '1rem', className = '', rounded = false }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${rounded ? 'rounded-full' : 'rounded-md'} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard({ className = '', lines, height }: { className?: string; lines?: number; height?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-[#e4ece6] p-5 space-y-3 ${className}`}>
      <Skeleton height="1.1rem" width="60%" />
      <Skeleton height="0.85rem" width="85%" />
      <Skeleton height="0.85rem" width="70%" />
      <div className="flex gap-2 pt-1">
        <Skeleton height="1.5rem" width="60px" rounded />
        <Skeleton height="1.5rem" width="80px" rounded />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height="2rem" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Alias: some pages import { SkeletonLoader } — maps to SkeletonCard
export const SkeletonLoader = SkeletonCard
