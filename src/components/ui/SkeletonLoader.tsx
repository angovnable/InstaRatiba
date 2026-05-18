// Skeleton — Emil Kowalski: warm ivory shimmer, nothing garish.
// Exact proportions mirroring the content they replace.

interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  rounded?: boolean
}

export function Skeleton({ width = '100%', height = '1rem', className = '', rounded = false }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${rounded ? 'rounded-full' : ''} ${className}`}
      style={{ width, height, borderRadius: rounded ? 9999 : 6 }}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard({ className = '' }: { className?: string; lines?: number; height?: string }) {
  return (
    <div
      className={className}
      style={{
        background: 'white',
        borderRadius: 12,
        border: '1px solid #EDE7D9',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Skeleton width="45%" height="0.7rem" />
        <Skeleton width={28} height={28} rounded />
      </div>
      <Skeleton width="40%" height="2rem" />
      <Skeleton width="60%" height="0.7rem" />
    </div>
  )
}

export function SkeletonTable({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height="2.2rem" />
          ))}
        </div>
      ))}
    </div>
  )
}

export const SkeletonLoader = SkeletonCard
