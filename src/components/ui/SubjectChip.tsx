interface SubjectChipProps {
  name: string
  lessonsPerWeek?: number
  teacherName?: string
  requiresDouble?: boolean
  className?: string
}

export default function SubjectChip({
  name,
  lessonsPerWeek,
  teacherName,
  requiresDouble,
  className = '',
}: SubjectChipProps) {
  return (
    <div className={`inline-flex flex-col gap-0.5 ${className}`}>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                       bg-surface text-primary border border-accent-light">
        {name}
        {lessonsPerWeek !== undefined && (
          <span className="bg-primary text-white rounded-full px-1.5 py-px text-[10px] font-bold">
            {lessonsPerWeek}
          </span>
        )}
        {requiresDouble && (
          <i className="bi-layers-fill text-[10px] text-primary/60" title="Requires double lesson" />
        )}
      </span>
      {teacherName && (
        <span className="text-[10px] text-muted font-medium pl-1">{teacherName}</span>
      )}
    </div>
  )
}
