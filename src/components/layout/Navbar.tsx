// Navbar — InstaRatiba Kenyan/EAC Theme
// Kilimanjaro Ivory glassmorphism, Savanna Gold term badge, dark mode toggle

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
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

export default function Navbar() {
  const { toggleSidebar } = useUiStore()
  const { school } = useSchoolStore()
  const location = useLocation()
  const [darkMode, setDarkMode] = useState(false)

  const title = PAGE_TITLES[location.pathname] ?? 'InstaRatiba'

  // Persist dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem('ir-dark-mode')
    if (saved === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('ir-dark-mode', String(next))
  }

  return (
    <header
      className="fixed top-0 right-0 flex items-center px-5 gap-3 z-[100]"
      role="banner"
      style={{
        left: 'var(--sidebar-w, 240px)',
        height: '60px',
        background: 'rgba(247,245,239,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #EDE7D9',
        boxShadow: '0 1px 12px rgba(13,61,35,0.08)',
      }}
    >
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className="w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-150 flex-shrink-0"
        style={{ color: '#7A8C82' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#EDE7D9'; e.currentTarget.style.color = '#0D3D23' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7A8C82' }}
        aria-label="Toggle sidebar"
      >
        <i className="bi-list text-xl" />
      </button>

      {/* Title + Breadcrumb */}
      <div className="flex-1 min-w-0">
        <h1
          className="font-bold text-sm truncate"
          style={{ fontFamily: 'var(--font-display)', color: '#0D3D23', lineHeight: 1.2 }}
        >
          {title}
        </h1>
        {school && (
          <p
            className="text-[10px] truncate"
            style={{ fontFamily: 'var(--font-body)', color: '#7A8C82', lineHeight: 1.2 }}
          >
            {school.name}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">

        {/* Term badge */}
        {school && (
          <span
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{
              fontFamily: 'var(--font-ui)',
              border: '1px solid #C8922A',
              color: '#C8922A',
              background: 'rgba(200,146,42,0.06)',
            }}
          >
            <i className="bi-calendar3 text-xs" />
            {school.academic_year} · Term {school.current_term}
          </span>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="w-8 h-8 flex items-center justify-center rounded-md transition-colors duration-150"
          style={{ color: '#7A8C82' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#EDE7D9'; e.currentTarget.style.color = '#0D3D23' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7A8C82' }}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <i className={`bi-${darkMode ? 'sun-fill' : 'moon-stars-fill'} text-base`} />
        </button>

        {/* Notification bell */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-md relative transition-colors duration-150"
          style={{ color: '#7A8C82' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#EDE7D9'; e.currentTarget.style.color = '#0D3D23' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7A8C82' }}
          aria-label="Notifications"
        >
          <i className="bi-bell text-base" />
          {/* Conflict dot — conditionally show with bi-bell-fill + red dot */}
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer flex-shrink-0"
          style={{
            background: '#0D3D23',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            outline: '2px solid #C8922A',
            outlineOffset: '1px',
          }}
          aria-label="User profile"
        >
          U
        </div>
      </div>
    </header>
  )
}
