import { Outlet } from 'react-router-dom'
import { useUiStore } from '@/store'
import { useAuthStore } from '@/store/authStore'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import GlobalFooter from './GlobalFooter'
import OfflineBanner from './OfflineBanner'
import { ErrorBoundary } from './ErrorBoundary'

// Full-screen skeleton shown while the persisted auth session is hydrating (Issue #27 fix)
function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-ir-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[--color-primary] border-t-transparent animate-spin" />
        <p className="text-sm text-[--color-muted]">Loading InstaRatiba…</p>
      </div>
    </div>
  )
}

export default function AppShell() {
  const { sidebarOpen } = useUiStore()
  const { isLoading } = useAuthStore()

  // Wait for Zustand persist hydration before rendering routes (prevents login flash)
  if (isLoading) return <AuthLoadingSkeleton />

  return (
    <div className="min-h-screen bg-ir-bg">
      {/* Sidebar */}
      <Sidebar />

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[150] lg:hidden"
          onClick={() => useUiStore.getState().setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Offline banner */}
      <OfflineBanner />

      {/* Top Navbar */}
      <Navbar />

      {/* Main content area */}
      <main
        className="transition-[margin] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          marginLeft: sidebarOpen ? '240px' : '0px',
          marginTop:  '60px',
          marginBottom: '52px',
          minHeight: 'calc(100vh - 60px - 52px)',
          padding: '28px',
        }}
      >
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Fixed footer */}
      <GlobalFooter />
    </div>
  )
}
