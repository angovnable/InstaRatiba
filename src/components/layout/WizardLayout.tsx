// WizardLayout — Emil Kowalski design language
// The wizard chrome is invisible — just a wordmark and step indicator.
// All attention goes to the form content.

import { WIZARD_STEPS } from '@/types'
import { useUiStore } from '@/store'
import StepWizard from '@/components/ui/StepWizard'
import GlobalFooter from './GlobalFooter'

export interface WizardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  maxWidth?: string
}

export default function WizardLayout({
  children, title, subtitle, maxWidth = '680px',
}: WizardLayoutProps) {
  const { activeWizardStep } = useUiStore()

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F7F5EF',
      backgroundImage:
        'radial-gradient(circle at 1px 1px, rgba(13,61,35,0.025) 1px, transparent 0)',
      backgroundSize: '28px 28px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Minimal wizard header */}
      <header style={{
        background: 'rgba(247,245,239,0.94)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(13,61,35,0.06)',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 12,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: '1rem',
          letterSpacing: '-0.022em',
          lineHeight: 1,
        }}>
          <span style={{ color: '#0D3D23' }}>Insta</span>
          <span style={{ color: '#C8922A' }}>Ratiba</span>
        </span>
        <span style={{
          width: 1, height: 14, background: '#EDE7D9', flexShrink: 0,
        }} />
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '0.72rem',
          color: '#7A8C82',
          fontWeight: 400,
        }}>
          School Setup
        </span>
      </header>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px 72px',
      }}>
        <div style={{ width: '100%', maxWidth }}>
          <StepWizard steps={WIZARD_STEPS} currentStep={activeWizardStep} />

          {title && (
            <div style={{ marginBottom: 24 }}>
              <h1 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
                color: '#0D3D23',
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
              }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{
                  fontFamily: "'Figtree', sans-serif",
                  fontSize: '0.875rem',
                  color: '#7A8C82',
                  marginTop: 6,
                  lineHeight: 1.5,
                }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {children}
        </div>
      </div>

      <GlobalFooter />
    </div>
  )
}
