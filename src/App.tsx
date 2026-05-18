// ============================================================
// InstaRatiba — App.tsx (Segment 10: FINAL — all routes live)
// Wraps the entire app in <PwaProvider> for online/offline
// awareness. Adds <PwaInstallBanner> on the dashboard.
// All Segment 1–9 routes are retained unchanged.
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster }                                 from 'sonner'
import { useEffect }                               from 'react'
import { useAuthStore }                            from '@/store/authStore'
import AppShell                                    from '@/components/layout/AppShell'
import { PwaProvider }                             from '@/components/layout/PwaProvider'
import { useAuth }                                 from '@/hooks/useAuth'
import { useBootstrap }                            from '@/hooks/useBootstrap'

// ── Segment 2: Auth ───────────────────────────────────────────
import {
  LandingPage, LoginPage, RegisterPage, AuthCallbackPage,
  OnboardingTour, useOnboardingTour,
} from '@/features/auth'

// ── Segment 3: School Setup ───────────────────────────────────
import { SchoolSetupPage, TimingEditorPage } from '@/features/school'

// ── Segment 4: Classes & Rooms ────────────────────────────────
import { ClassManagerPage }  from '@/features/classes'
import { RoomManagerPage }   from '@/features/rooms'

// ── Segment 5: Teachers & Allocation ──────────────────────────
import { TeacherManagerPage } from '@/features/teachers'
import { AllocationPage }     from '@/features/allocation'

// ── Segment 6: CBC Rules Engine + Pre-Generate Review ─────────
import { PreGenerateReviewPage } from '@/features/review'

// ── Segment 7: Timetable Viewer & Approval ────────────────────
import {
  TimetablePage,
  SharedTimetableView,
} from '@/features/timetable'

// ── Segment 8: Export System ──────────────────────────────────
import { ExportPage } from '@/features/export'

// ── Segment 9: Dashboard & Settings ──────────────────────────
import { DashboardPage }  from '@/features/dashboard'
import { SettingsPage }   from '@/features/settings'

// ── Segment 10: PWA Install Banner ───────────────────────────
import { PwaInstallBanner } from '@/components/layout'

// ── Route Guards ─────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasCompletedSetup } = useAuthStore()
  if (!isAuthenticated)    return <Navigate to="/login"    replace />
  if (!hasCompletedSetup)  return <Navigate to="/setup"    replace />
  return <>{children}</>
}

function SetupRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasCompletedSetup } = useAuthStore()
  if (isAuthenticated && hasCompletedSetup)  return <Navigate to="/dashboard" replace />
  if (isAuthenticated && !hasCompletedSetup) return <Navigate to="/setup"    replace />
  return <>{children}</>
}

// ── Root ──────────────────────────────────────────────────────
function Root() {
  useAuth()
  useBootstrap()
  const { isAuthenticated, hasCompletedSetup } = useAuthStore()
  const tour = useOnboardingTour()

  useEffect(() => {
    if (isAuthenticated && !hasCompletedSetup) tour.start()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, hasCompletedSetup])

  return (
    <>
      {/* ── Onboarding tour overlay ─────────────────────── */}
      {isAuthenticated && (
        <OnboardingTour
          visible={tour.visible}
          step={tour.step}
          total={tour.total}
          onNext={tour.next}
          onPrev={tour.prev}
          onSkip={tour.skip}
          onFinish={tour.finish}
        />
      )}

      {/* ── Toast notifications — Emil: tight, precise, no noise ── */}
      <Toaster
        position="bottom-right"
        offset={60}
        richColors
        closeButton
        gap={8}
        toastOptions={{
          style: {
            fontFamily: "'Figtree', sans-serif",
            fontSize: '0.84rem',
            boxShadow: '0 1px 3px rgba(13,61,35,0.06), 0 4px 16px rgba(13,61,35,0.08)',
            border: '1px solid #EDE7D9',
            borderRadius: 10,
            padding: '10px 14px',
          },
        }}
      />

      {/* ── Routes ──────────────────────────────────────── */}
      <Routes>
        {/* Public */}
        <Route path="/"              element={<GuestRoute><LandingPage /></GuestRoute>} />
        <Route path="/login"         element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register"      element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Share links — no auth required */}
        <Route path="/timetable/share/:token" element={<SharedTimetableView />} />

        {/* Setup wizard (auth required, setup not complete) */}
        <Route path="/setup"         element={<SetupRoute><SchoolSetupPage /></SetupRoute>} />
        <Route path="/setup/timing"  element={<SetupRoute><TimingEditorPage /></SetupRoute>} />

        {/* Protected app shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* Dashboard — with install banner */}
          <Route
            path="/dashboard"
            element={
              <>
                <PwaInstallBanner />
                <DashboardPage />
              </>
            }
          />

          <Route path="/classes"    element={<ClassManagerPage />} />
          <Route path="/rooms"      element={<RoomManagerPage />} />
          <Route path="/teachers"   element={<TeacherManagerPage />} />
          <Route path="/allocation" element={<AllocationPage />} />
          <Route path="/review"     element={<PreGenerateReviewPage />} />
          <Route path="/timetable"  element={<TimetablePage />} />
          <Route path="/export"     element={<ExportPage />} />
          <Route path="/settings"   element={<SettingsPage />} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

// ── App — composed with PWA + Router providers ────────────────
export default function App() {
  return (
    <BrowserRouter>
      {/*
        PwaProvider must wrap BrowserRouter contents so
        usePwaSync can run its online/offline listeners.
        OfflineBanner is mounted inside PwaProvider.
      */}
      <PwaProvider>
        <Root />
      </PwaProvider>
    </BrowserRouter>
  )
}