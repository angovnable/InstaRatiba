// Sidebar — Emil Kowalski design language
// Obsessive micro-detail: magnetic nav items, precise spacing,
// hairline borders, spring hover animations

import { NavLink, useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { useAuthStore } from '@/store'

interface NavItem {
  label: string
  path: string
  icon: string
  segment: number
}

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard',         path: '/dashboard',  icon: 'bi-speedometer2',         segment: 9 },
    ],
  },
  {
    title: 'Setup',
    items: [
      { label: 'Classes',           path: '/classes',    icon: 'bi-people-fill',           segment: 4 },
      { label: 'Rooms',             path: '/rooms',      icon: 'bi-door-open-fill',        segment: 4 },
      { label: 'Teachers',          path: '/teachers',   icon: 'bi-person-badge-fill',     segment: 5 },
      { label: 'Lesson Allocation', path: '/allocation', icon: 'bi-grid-3x3-gap-fill',    segment: 5 },
    ],
  },
  {
    title: 'Timetable',
    items: [
      { label: 'Review & Generate', path: '/review',     icon: 'bi-clipboard2-check-fill', segment: 7 },
      { label: 'Timetable',         path: '/timetable',  icon: 'bi-calendar3-week-fill',   segment: 7 },
      { label: 'Export',            path: '/export',     icon: 'bi-file-earmark-pdf-fill', segment: 8 },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Settings', path: '/settings', icon: 'bi-gear-fill', segment: 9 },
    ],
  },
]

// Emil-style magnetic nav item — slight x drift toward cursor
function NavItem({ item }: { item: NavItem }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 400, damping: 28 })

  function handleMouseMove(e: React.MouseEvent) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const center = rect.left + rect.width / 2
    x.set((e.clientX - center) * 0.08)
  }
  function handleMouseLeave() { x.set(0) }

  return (
    <NavLink to={item.path} ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {({ isActive }) => (
        <motion.div
          style={{ x: springX }}
          className="group relative"
        >
          {isActive && (
            <motion.div
              layoutId="sidebar-active"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 8,
                background: 'rgba(200,146,42,0.10)',
                borderLeft: '2px solid #C8922A',
              }}
            />
          )}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '7px 10px',
              marginBottom: 1,
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.845rem',
              color: isActive ? 'white' : 'rgba(255,255,255,0.45)',
              letterSpacing: '-0.01em',
              transition: 'color 120ms ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.8)'
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.45)'
            }}
          >
            <i
              className={item.icon}
              style={{
                fontSize: '0.92rem',
                width: 16,
                flexShrink: 0,
                opacity: isActive ? 1 : 0.6,
                color: isActive ? '#C8922A' : 'inherit',
                transition: 'color 120ms, opacity 120ms',
              }}
            />
            <span className="flex-1 truncate">{item.label}</span>
          </div>
        </motion.div>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()
  const initial = user?.display_name?.[0]?.toUpperCase() ?? 'U'

  return (
    <aside
      className="sidebar-desktop"
      style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: 240,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 200,
        background: '#0F1B14',
        borderRight: '1px solid rgba(255,255,255,0.04)',
      }}
      aria-label="Main navigation"
    >
      {/* Logo — tight, precise */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Logomark — two stacked bars like a timetable grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              <div style={{ width: 8, height: 4, background: '#C8922A', borderRadius: 1 }} />
              <div style={{ width: 5, height: 4, background: 'rgba(200,146,42,0.4)', borderRadius: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              <div style={{ width: 5, height: 4, background: 'rgba(200,146,42,0.4)', borderRadius: 1 }} />
              <div style={{ width: 8, height: 4, background: '#0D3D23', borderRadius: 1, border: '1px solid rgba(200,146,42,0.4)' }} />
            </div>
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: '1.1rem',
                letterSpacing: '-0.025em',
                lineHeight: 1,
                color: 'white',
              }}
            >
              Insta<span style={{ color: '#C8922A' }}>Ratiba</span>
            </p>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '0.6rem',
                color: 'rgba(255,255,255,0.25)',
                marginTop: 1,
                letterSpacing: '0.04em',
              }}
            >
              by AG Computer Solutions
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} style={{ marginBottom: 6 }}>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 500,
                fontSize: '0.6rem',
                color: 'rgba(200,146,42,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '10px 10px 5px',
              }}
            >
              {section.title}
            </p>
            {section.items.map(item => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div
        style={{
          padding: '12px 14px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'rgba(200,146,42,0.15)',
              border: '1.5px solid rgba(200,146,42,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: '0.72rem',
              color: '#C8922A',
              flexShrink: 0,
            }}
          >
            {initial}
          </motion.div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 500,
                fontSize: '0.78rem',
                color: 'rgba(255,255,255,0.8)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
              }}
            >
              {user?.display_name ?? 'User'}
            </p>
            <p
              style={{
                fontFamily: "'Figtree', sans-serif",
                fontSize: '0.62rem',
                color: 'rgba(255,255,255,0.25)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.email ?? ''}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { logout(); navigate('/') }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '6px 8px',
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.28)',
            fontFamily: "'Outfit', sans-serif",
            fontSize: '0.78rem',
            cursor: 'pointer',
            transition: 'color 120ms',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#A01F1F' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.28)' }}
        >
          <i className="bi-box-arrow-left text-sm" />
          Sign out
        </motion.button>
      </div>
    </aside>
  )
}
