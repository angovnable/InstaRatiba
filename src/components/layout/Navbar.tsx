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

  const title = PAGE_TITLES[location.pathname] ?? 'InstaRatiba'

  return (
    <header
      className="fixed top-0 left-[240px] right-0 h-[60px] bg-white border-b border-[#e8eeeb]
                 flex items-center px-6 gap-4 z-[100]"
      role="banner"
    >
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className="w-8 h-8 flex items-center justify-center rounded-md text-muted
                   hover:bg-surface hover:text-primary transition-colors duration-150"
        aria-label="Toggle sidebar"
      >
        <i className="bi-list text-xl" />
      </button>

      {/* Title + Breadcrumb */}
      <div className="flex-1 min-w-0">
        <h1 className="font-display font-bold text-primary text-sm truncate">{title}</h1>
        {school && (
          <p className="text-[10px] text-muted truncate">{school.name}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Term badge */}
        {school && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                           bg-surface text-primary text-[11px] font-semibold border border-accent-light">
            <i className="bi-calendar3 text-xs" />
            {school.academic_year} · Term {school.current_term}
          </span>
        )}

        {/* Notification bell placeholder */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted
                     hover:bg-surface hover:text-primary transition-colors relative"
          aria-label="Notifications"
        >
          <i className="bi-bell text-base" />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center
                     font-display font-bold text-white text-xs cursor-pointer"
          aria-label="User profile"
        >
          U
        </div>
      </div>
    </header>
  )
}
