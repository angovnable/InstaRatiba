// Navbar — Emil Kowalski design language
// Precise 56px height, hairline border, perfect kerning,
// no decorative noise — every element earns its place

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUiStore, useSchoolStore } from '@/store'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/classes':    'Class Manager',
  '/rooms':      'Room Manager',
  '/teachers':   'Teacher Manager',
  '/allocation': 'Lesson Allocation',
  '/review':     'Pre-Generate Review',
  '/timetable':  'Timetable',
  '/export':     'Export',
  '/settings':   'Settings',
}

function IconBtn({
  icon, onClick, label, active,
}: {
  icon: string; onClick?: () => void; label: string; active?: boolean
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-label={label}
      style={{
        width: 34,
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 7,
        border: '1px solid transparent',
        background: active ? 'rgba(13,61,35,0.07)' : 'transparent',
        color: active ? '#0D3D23' : '#7A8C82',
        cursor: 'pointer',
        fontSize: '1rem',
        transition: 'background 120ms, color 120ms, border-color 120ms',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = 'rgba(13,61,35,0.06)'
        el.style.color = '#1C2B22'
        el.style.borderColor = 'rgba(13,61,35,0.08)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = active ? 'rgba(13,61,35,0.07)' : 'transparent'
        el.style.color = active ? '#0D3D23' : '#7A8C82'
        el.style.borderColor = 'transparent'
      }}
    >
      <i className={icon} />
    </motion.button>
  )
}

export default function Navbar() {
  const { toggleSidebar } = useUiStore()
  const { school } = useSchoolStore()
  const location = useLocation()
  const [dark, setDark] = useState(false)

  const title = PAGE_TITLES[location.pathname] ?? 'InstaRatiba'

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '')
  }

  return (
    <header
      style={{
        position: 'fixed',
        top: 3, // below 3px flag stripe
        left: 240,
        right: 0,
        height: 56,
        background: 'rgba(247,245,239,0.92)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        borderBottom: '1px solid rgba(13,61,35,0.07)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        zIndex: 100,
      }}
      role="banner"
    >
      {/* Hamburger */}
      <IconBtn icon="bi-list" onClick={toggleSidebar} label="Toggle sidebar" />

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: 'rgba(13,61,35,0.08)', flexShrink: 0 }} />

      {/* Title area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <AnimatePresence mode="wait">
          <motion.h1
            key={title}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#1C2B22',
              letterSpacing: '-0.018em',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </motion.h1>
        </AnimatePresence>
        {school && (
          <p
            style={{
              fontFamily: "'Figtree', sans-serif",
              fontSize: '0.64rem',
              color: '#7A8C82',
              letterSpacing: '0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
              marginTop: 1,
            }}
          >
            {school.name}
          </p>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Term badge — restrained pill */}
        {school && (
          <span
            className="hidden sm:inline-flex"
            style={{
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 99,
              border: '1px solid rgba(200,146,42,0.3)',
              background: 'rgba(200,146,42,0.07)',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 500,
              fontSize: '0.68rem',
              color: '#9B6E1A',
              letterSpacing: '0.01em',
            }}
          >
            <i className="bi-calendar3" style={{ fontSize: '0.62rem' }} />
            {school.academic_year} · Term {school.current_term}
          </span>
        )}

        <IconBtn
          icon={dark ? 'bi-sun-fill' : 'bi-moon-fill'}
          onClick={toggleDark}
          label={dark ? 'Light mode' : 'Dark mode'}
        />

        <IconBtn icon="bi-bell" label="Notifications" />

        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'rgba(200,146,42,0.12)',
            border: '1.5px solid rgba(200,146,42,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: '0.72rem',
            color: '#9B6E1A',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          U
        </motion.div>
      </div>
    </header>
  )
}
