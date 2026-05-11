import { WIZARD_STEPS } from '@/types'
import { useUiStore } from '@/store'
import StepWizard from '@/components/ui/StepWizard'
import GlobalFooter from './GlobalFooter'

export interface WizardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  maxWidth?: string
  // Optional props passed by some pages — step is read from store but accepted here
  step?: number
  total?: number
  onBack?: () => void
  onNext?: () => void
  nextDisabled?: boolean
  nextLabel?: string
}

export default function WizardLayout({
  children,
  title,
  subtitle,
  maxWidth = '760px',
}: WizardLayoutProps) {
  const { activeWizardStep } = useUiStore()

  return (
    <div className="min-h-screen bg-ir-bg flex flex-col">
      <header className="bg-white border-b border-[#e8eeeb] h-[60px] flex items-center px-6 shrink-0">
        <span className="font-display font-extrabold text-primary text-lg tracking-tight">
          InstaRatiba
        </span>
        <span className="ml-2 text-muted/60 text-xs hidden sm:block">— School Setup Wizard</span>
      </header>

      <div className="flex-1 flex items-start justify-center py-10 px-4 pb-20">
        <div className="w-full" style={{ maxWidth }}>
          <StepWizard steps={WIZARD_STEPS} currentStep={activeWizardStep} />

          {title && (
            <div className="mb-6">
              <h1 className="font-display font-bold text-2xl text-primary-dark">{title}</h1>
              {subtitle && <p className="text-muted text-sm mt-1">{subtitle}</p>}
            </div>
          )}

          {children}
        </div>
      </div>

      <GlobalFooter />
    </div>
  )
}
