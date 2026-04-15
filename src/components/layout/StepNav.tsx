import { Home, BookOpen, Users, Cpu, Check } from 'lucide-react'
import { useStore } from '@/store'
import { T } from '@/lib/constants'
import type { AppStep } from '@/types'

const STEP_ICONS = [Home, BookOpen, Users, Cpu]

export function StepNav() {
  const { currentStep, setStep, lang, classes, teachers } = useStore()
  const t = T[lang]
  const STEPS = [t.school, t.classes, t.teachers, t.generate]

  return (
    <>
      {/* Desktop horizontal nav */}
      <nav className="no-print" style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEPS.map((label, i) => {
            const Icon = STEP_ICONS[i]
            const active = currentStep === i
            const done = currentStep > i

            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? '1' : undefined }}>
                <button
                  onClick={() => setStep(i as AppStep)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0 12px', height: 52,
                    background: 'none', border: 'none',
                    borderBottom: `2px solid ${active ? 'var(--gold)' : done ? 'var(--success)' : 'transparent'}`,
                    fontSize: 12, fontWeight: 700,
                    color: active ? 'var(--gold)' : done ? 'var(--success)' : 'var(--text-muted)',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-ui)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {/* Step indicator circle */}
                  <div className={`step-indicator ${active ? 'active' : done ? 'done' : 'inactive'}`}>
                    {done ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <span className="step-label">{label}</span>
                </button>

                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: done ? 'var(--success)' : 'var(--border-subtle)', transition: 'background 0.3s', margin: '0 4px', minWidth: 8 }} />
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="no-print mobile-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        display: 'flex',
      }}>
        {STEPS.map((label, i) => {
          const Icon = STEP_ICONS[i]
          const active = currentStep === i
          const done = currentStep > i
          return (
            <button key={i} onClick={() => setStep(i as AppStep)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '9px 4px 7px',
              background: active ? 'var(--gold-glow)' : 'none',
              border: 'none',
              borderTop: `2px solid ${active ? 'var(--gold)' : 'transparent'}`,
              color: active ? 'var(--gold-dark)' : done ? 'var(--success)' : 'var(--text-muted)',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: 'var(--font-ui)',
              transition: 'all 0.15s',
            }}>
              {done && !active ? <Check size={18} /> : <Icon size={18} />}
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      <style>{`
        @media (min-width: 768px) { .mobile-bottom-nav { display: none !important; } }
        @media (max-width: 767px) { .step-label { display: none; } }
      `}</style>
    </>
  )
}
