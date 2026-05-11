import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore, useUiStore } from '@/store'

interface NavItem {
  label: string
  path: string
  icon: string
  badge?: number
  segment: number
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard',        path: '/dashboard',  icon: 'bi-speedometer2',         segment: 9 },
    ],
  },
  {
    title: 'Setup',
    items: [
      { label: 'Classes',          path: '/classes',    icon: 'bi-people-fill',           segment: 4 },
      { label: 'Rooms',            path: '/rooms',      icon: 'bi-door-open-fill',        segment: 4 },
      { label: 'Teachers',         path: '/teachers',   icon: 'bi-person-badge-fill',     segment: 5 },
      { label: 'Lesson Allocation',path: '/allocation', icon: 'bi-grid-3x3-gap-fill',    segment: 5 },
    ],
  },
  {
    title: 'Timetable',
    items: [
      { label: 'Review & Generate',path: '/review',     icon: 'bi-clipboard2-check-fill', segment: 7 },
      { label: 'Timetable',        path: '/timetable',  icon: 'bi-calendar3-week-fill',   segment: 7 },
      { label: 'Export',           path: '/export',     icon: 'bi-file-earmark-pdf-fill', segment: 8 },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Settings',         path: '/settings',   icon: 'bi-gear-fill',             segment: 9 },
    ],
  },
]

export default function Sidebar() {
  const { sidebarOpen } = useUiStore()
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    logout()
    navigate('/')
  }

  return (
    <aside
      className={[
        'fixed top-0 left-0 bottom-0 flex flex-col z-[200]',
        'transition-transform duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        'w-[240px]',
      ].join(' ')}
      style={{ background: 'var(--color-primary)' }}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <p className="font-display font-extrabold text-white text-xl tracking-tight leading-none">
          InstaRatiba
        </p>
        <p className="text-white/50 text-[10px] mt-1 tracking-wide">by AG Computer Solutions</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Sidebar navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-1">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[1.2px] px-3 py-2">
              {section.title}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2.5 px-3 py-2 rounded-md mb-0.5',
                    'text-sm font-medium transition-colors duration-150',
                    'border border-transparent',
                    isActive
                      ? 'bg-white/20 text-white font-semibold border-white/10'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  ].join(' ')
                }
              >
                <i className={`${item.icon} text-base flex-shrink-0`} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-warn text-white text-[10px] font-bold px-1.5 py-px rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center
                          font-display font-bold text-white text-xs flex-shrink-0">
            {user?.display_name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {user?.display_name ?? 'User'}
            </p>
            <p className="text-white/40 text-[10px] truncate capitalize">
              {user?.role?.replace(/_/g, ' ') ?? '—'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-white/60 hover:text-white
                     text-xs font-medium transition-colors duration-150 px-1"
        >
          <i className="bi-box-arrow-left text-sm" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
