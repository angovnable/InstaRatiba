import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useStore } from '@/store'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/layout/Header'
import { StepNav } from '@/components/layout/StepNav'
import { Footer, WhatsAppFAB } from '@/components/layout/Footer'
import { StepSchool } from '@/components/steps/StepSchool'
import { StepClasses } from '@/components/steps/StepClasses'
import { StepTeachers } from '@/components/steps/StepTeachers'
import { StepGenerate } from '@/components/steps/StepGenerate'
import Privacy from '@/pages/Privacy'
import Terms from '@/pages/Terms'
import { solveAllClasses } from '@/lib/solver'

const path = window.location.pathname

export default function App() {
  useAuth()

  const { currentStep, isDark, classes, teachers, setGenerateResult } = useStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault()
        if (currentStep === 3 && classes.length > 0) {
          const result = solveAllClasses(classes, teachers)
          setGenerateResult(result)
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        window.print()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentStep, classes, teachers])

  // ── Static pages ──────────────────────────────────────────────
  if (path === '/privacy') return <Privacy />
  if (path === '/terms')   return <Terms />
  // ─────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <Header />
      <StepNav />

      <main style={{
        flex: 1,
        maxWidth: 1200,
        margin: '0 auto',
        padding: '24px 16px 120px',
        width: '100%',
      }}>
        {currentStep === 0 && <StepSchool />}
        {currentStep === 1 && <StepClasses />}
        {currentStep === 2 && <StepTeachers />}
        {currentStep === 3 && <StepGenerate />}
      </main>

      <Footer />
      <WhatsAppFAB />

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--bg-overlay)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 500,
            boxShadow: 'var(--shadow-hover)',
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: 'white' } },
          error:   { iconTheme: { primary: 'var(--danger)',  secondary: 'white' } },
        }}
      />
    </div>
  )
}