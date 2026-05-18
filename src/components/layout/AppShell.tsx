// AppShell — Emil Kowalski design language
// Fast page transitions. Spring mobile tab indicator.
// Loading state that doesn't feel like a placeholder.

import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import GlobalFooter from './GlobalFooter'
import OfflineBanner from './OfflineBanner'
import { ErrorBoundary } from './ErrorBoundary'

const MOBILE_TABS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'bi-speedometer2' },
  { label: 'Timetable', path: '/timetable',  icon: 'bi-calendar3-week-fill' },
  { label: 'Export',    path: '/export',     icon: 'bi-file-earmark-pdf-fill' },
  { label: 'Settings',  path: '/settings',   icon: 'bi-gear-fill' },
]

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F7F5EF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Pulsing logomark */}
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: '1.4rem',
          letterSpacing: '-0.025em',
          color: '#0D3D23',
        }}
      >
        Insta<span style={{ color: '#C8922A' }}>Ratiba</span>
      </motion.div>
      {/* Thin animated progress line */}
      <div style={{ width: 120, height: 1.5, background: '#EDE7D9', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          animate={{ x: [-120, 120] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          style={{
            width: 60,
            height: '100%',
            background: 'linear-gradient(90deg, transparent, #C8922A, transparent)',
            borderRadius: 99,
          }}
        />
      </div>
    </div>
  )
}

function MobileTabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <nav className="mobile-tab-bar" aria-label="Mobile navigation">
      {MOBILE_TABS.map(tab => {
        const active = location.pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              paddingTop: 10,
              position: 'relative',
            }}
            aria-label={tab.label}
          >
            {active && (
              <motion.div
                layoutId="mobile-tab-indicator"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  width: 20,
                  height: 2,
                  borderRadius: 99,
                  background: '#C8922A',
                }}
              />
            )}
            <i
              className={tab.icon}
              style={{
                fontSize: '1.1rem',
                color: active ? '#C8922A' : 'rgba(255,255,255,0.3)',
                transition: 'color 150ms',
              }}
            />
            <span style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '0.56rem',
              fontWeight: active ? 600 : 400,
              color: active ? '#C8922A' : 'rgba(255,255,255,0.3)',
              letterSpacing: '0.02em',
              transition: 'color 150ms',
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export default function AppShell() {
  const { isLoading } = useAuthStore()
  const { sidebarOpen } = useUiStore()
  const location = useLocation()

  if (isLoading) return <LoadingScreen />

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-surface)' }}>
      <Sidebar />
      <OfflineBanner />
      <Navbar />

      <main
        className="main-with-sidebar"
        style={{
          marginLeft: 240,
          marginTop: 59,   // navbar h + flag stripe
          marginBottom: 48,
          minHeight: 'calc(100dvh - 59px - 48px)',
          padding: 24,
        }}
      >
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      <GlobalFooter />
      <MobileTabBar />
    </div>
  )
}
