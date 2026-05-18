// SubjectChip — Emil Kowalski: semantic colours, no noisy borders.
// Small, readable, never distracting.

import React from 'react'

interface SubjectChipProps {
  name: string
  lessonsPerWeek?: number
  teacherName?: string
  requiresDouble?: boolean
  className?: string
}

function categoryStyle(name: string): React.CSSProperties {
  const n = name.toLowerCase()
  if (/english|swahili|kiswahili|language|literacy/.test(n))
    return { background: 'rgba(30,92,138,0.09)', color: '#1E5C8A' }
  if (/science|biology|chemistry|physics|math|computer/.test(n))
    return { background: 'rgba(13,61,35,0.09)', color: '#0D3D23' }
  if (/history|geography|social|civic|cre|ire|religious/.test(n))
    return { background: 'rgba(200,146,42,0.10)', color: '#9B6E1A' }
  if (/art|music|pe|sport|creative|craft|drama/.test(n))
    return { background: 'rgba(160,31,31,0.08)', color: '#A01F1F' }
  return { background: 'rgba(13,61,35,0.07)', color: '#0D3D23' }
}

export default function SubjectChip({ name, lessonsPerWeek, teacherName, requiresDouble, className = '' }: SubjectChipProps) {
  const cat = categoryStyle(name)
  return (
    <div className={`inline-flex flex-col gap-0.5 ${className}`}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: 99,
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 500,
        fontSize: '0.68rem',
        letterSpacing: '-0.005em',
        ...cat,
      }}>
        {name}
        {lessonsPerWeek !== undefined && (
          <span style={{
            background: cat.color,
            color: 'white',
            borderRadius: 99,
            padding: '0 5px',
            fontSize: '0.58rem',
            fontWeight: 700,
          }}>
            {lessonsPerWeek}
          </span>
        )}
        {requiresDouble && (
          <i className="bi-layers-fill" style={{ fontSize: '0.55rem', opacity: 0.5 }} title="Double lesson" />
        )}
      </span>
      {teacherName && (
        <span style={{
          fontFamily: "'Figtree', sans-serif",
          fontSize: '0.62rem',
          color: '#7A8C82',
          paddingLeft: 3,
        }}>
          {teacherName}
        </span>
      )}
    </div>
  )
}
