// SubjectChip — InstaRatiba Kenyan/EAC Theme
// Semantic colours by subject category: Languages=ocean, Sciences=primary, Humanities=gold, Creative=red

interface SubjectChipProps {
  name: string
  lessonsPerWeek?: number
  teacherName?: string
  requiresDouble?: boolean
  className?: string
  category?: 'language' | 'science' | 'humanity' | 'creative' | 'default'
}

function detectCategory(name: string): SubjectChipProps['category'] {
  const n = name.toLowerCase()
  if (/english|kiswahili|literacy|language|reading|writing/.test(n)) return 'language'
  if (/math|science|biology|chemistry|physics|integrated/.test(n))   return 'science'
  if (/social|history|religious|cre|ire|geography|civics/.test(n))   return 'humanity'
  if (/art|music|home|craft|agri|physical|pe|sport/.test(n))         return 'creative'
  return 'default'
}

const categoryStyles: Record<NonNullable<SubjectChipProps['category']>, { bg: string; color: string; badge: string }> = {
  language: { bg: 'rgba(30,92,138,0.10)',   color: '#1E5C8A', badge: '#1E5C8A' },
  science:  { bg: 'rgba(13,61,35,0.09)',    color: '#0D3D23', badge: '#0D3D23' },
  humanity: { bg: 'rgba(200,146,42,0.10)',  color: '#8A6010', badge: '#C8922A' },
  creative: { bg: 'rgba(160,31,31,0.08)',   color: '#A01F1F', badge: '#A01F1F' },
  default:  { bg: 'rgba(122,140,130,0.10)', color: '#4A5E52', badge: '#7A8C82' },
}

export default function SubjectChip({
  name,
  lessonsPerWeek,
  teacherName,
  requiresDouble,
  className = '',
  category,
}: SubjectChipProps) {
  const cat = category ?? detectCategory(name)
  const style = categoryStyles[cat]

  return (
    <div className={`inline-flex flex-col gap-0.5 ${className}`}>
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{
          background: style.bg,
          color: style.color,
          border: `1px solid ${style.color}22`,
          fontFamily: 'var(--font-ui)',
          fontWeight: 600,
        }}
      >
        {name}
        {lessonsPerWeek !== undefined && (
          <span
            className="rounded-full px-1.5 py-px text-[10px] font-bold text-white"
            style={{ background: style.badge }}
          >
            {lessonsPerWeek}
          </span>
        )}
        {requiresDouble && (
          <i className="bi-layers-fill text-[10px]" style={{ color: style.color, opacity: 0.6 }} title="Requires double lesson" />
        )}
      </span>
      {teacherName && (
        <span
          className="text-[10px] font-medium pl-1"
          style={{ color: '#7A8C82', fontFamily: 'var(--font-body)' }}
        >
          {teacherName}
        </span>
      )}
    </div>
  )
}
