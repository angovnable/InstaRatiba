// Sidebar — InstaRatiba Kenyan/EAC Theme
// Nairobi Night bg, Savanna Gold active states, collapsible to 64px icon-only mode

import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store'

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
      { label: 'Dashboard',         path: '/dashboard',  icon: 'bi-speedometer2',          segment: 9 },
    ],
  },
  {
    title: 'Setup',
    items: [
      { label: 'Classes',           path: '/classes',    icon: 'bi-people-fill',            segment: 4 },
      { label: 'Rooms',             path: '/rooms',      icon: 'bi-door-open-fill',         segment: 4 },
      { label: 'Teachers',          path: '/teachers',   icon: 'bi-person-badge-fill',      segment: 5 },
      { label: 'Lesson Allocation', path: '/allocation', icon: 'bi-grid-3x3-gap-fill',     segment: 5 },
    ],
  },
  {
    title: 'Timetable',
    items: [
      { label: 'Review & Generate', path: '/review',     icon: 'bi-clipboard2-check-fill',  segment: 7 },
      { label: 'Timetable',         path: '/timetable',  icon: 'bi-calendar3-week-fill',    segment: 7 },
      { label: 'Export',            path: '/export',     icon: 'bi-file-earmark-pdf-fill',  segment: 8 },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Settings',          path: '/settings',   icon: 'bi-gear-fill',              segment: 9 },
    ],
  },
]

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()
  const [localCollapsed, setLocalCollapsed] = useState(false)

  const isCollapsed = collapsed !== undefined ? collapsed : localCollapsed
  const toggleCollapse = onToggleCollapse ?? (() => setLocalCollapsed(v => !v))

  const handleLogout = async () => {
    logout()
    navigate('/')
  }

  const sidebarWidth = isCollapsed ? '64px' : '240px'

  return (
    <motion.aside
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 bottom-0 flex flex-col z-[200] overflow-hidden"
      style={{ background: '#0F1B14', width: sidebarWidth }}
      aria-label="Main navigation"
    >
      {/* ── Logo block ── */}
      <div
        className="flex items-center px-4 pt-5 pb-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(200,146,42,0.2)', minHeight: 72 }}
      >
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 min-w-0"
            >
              <p
                className="text-white font-display font-extrabold text-xl tracking-tight leading-none"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span className="text-white">Insta</span>
                <span style={{ color: '#C8922A' }}>Ratiba</span>
              </p>
              <p className="text-[10px] mt-1 tracking-wide" style={{ color: 'rgba(200,146,42,0.6)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
                by AG Computer Solutions
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#C8922A' }}
            >
              <i className="bi-calendar3-week-fill text-sm" style={{ color: '#0F1B14' }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="ml-auto w-7 h-7 flex items-center justify-center rounded-md flex-shrink-0 transition-colors duration-150"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={`bi-${isCollapsed ? 'chevron-right' : 'chevron-left'} text-sm`} />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Sidebar navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-1">
            {/* Section label — hidden when collapsed */}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="text-[10px] font-bold uppercase tracking-[1.4px] px-3 py-2"
                  style={{
                    color: '#C8922A',
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 500,
                    fontVariant: 'small-caps',
                  }}
                >
                  {section.title}
                </motion.p>
              )}
            </AnimatePresence>

            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2.5 px-3 py-2 rounded-md mb-0.5',
                    'font-medium transition-all duration-150',
                    'relative overflow-hidden group',
                    isActive
                      ? 'text-white font-semibold'
                      : 'hover:text-white',
                  ].join(' ')
                }
                style={({ isActive }) => ({
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                  background: isActive ? 'rgba(200,146,42,0.12)' : 'transparent',
                  borderLeft: isActive ? '3px solid #C8922A' : '3px solid transparent',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.875rem',
                })}
              >
                {({ isActive }) => (
                  <>
                    {/* Hover background */}
                    <span
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    />

                    <motion.i
                      whileHover={{ x: isCollapsed ? 0 : 2 }}
                      transition={{ duration: 0.12 }}
                      className={`${item.icon} text-base flex-shrink-0 relative z-10`}
                      style={{ color: isActive ? '#C8922A' : 'inherit' }}
                    />

                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.15 }}
                          className="flex-1 truncate relative z-10 whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-px rounded-full relative z-10"
                        style={{ background: '#A01F1F', color: '#fff' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── User footer ── */}
      <div
        className="px-3 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className={`flex items-center gap-3 mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
          {/* Avatar with Savanna Gold ring */}
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-xs"
            style={{
              width: 32,
              height: 32,
              background: '#0D3D23',
              color: '#fff',
              fontFamily: 'var(--font-display)',
              outline: '2px solid #C8922A',
              outlineOffset: '1px',
            }}
          >
            {user?.display_name?.[0]?.toUpperCase() ?? 'U'}
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex-1 min-w-0"
              >
                <p className="text-white text-xs font-semibold truncate" style={{ fontFamily: 'var(--font-ui)' }}>
                  {user?.display_name ?? 'User'}
                </p>
                <p className="text-[10px] truncate capitalize" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-body)' }}>
                  {user?.role?.replace(/_/g, ' ') ?? '—'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 text-xs font-medium transition-colors duration-150 px-1 rounded-md py-1 group ${isCollapsed ? 'justify-center' : ''}`}
          style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-ui)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#A01F1F' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
          title={isCollapsed ? 'Sign out' : undefined}
        >
          <i className="bi-box-arrow-left text-sm" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.12 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Sign out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}
