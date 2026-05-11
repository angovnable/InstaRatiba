import type { WizardStep } from '@/types'

interface StepWizardProps {
  steps: WizardStep[]
  currentStep: number   // 0-indexed
}

export default function StepWizard({ steps, currentStep }: StepWizardProps) {
  return (
    <div className="flex items-start mb-8 px-1">
      {steps.map((step, i) => {
        const isDone   = i < currentStep
        const isActive = i === currentStep

        return (
          <div key={step.key} className="flex-1 flex flex-col items-center relative">
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={[
                  'absolute top-4 left-1/2 w-full h-0.5 z-0 transition-colors duration-500',
                  isDone ? 'bg-mid' : 'bg-accent-light',
                ].join(' ')}
              />
            )}

            {/* Dot */}
            <div
              className={[
                'relative z-10 w-8 h-8 rounded-full flex items-center justify-center',
                'font-display font-bold text-xs transition-all duration-300',
                isDone   ? 'bg-mid text-white shadow-sm'    : '',
                isActive ? 'bg-primary text-white shadow-md scale-110' : '',
                !isDone && !isActive ? 'bg-accent-light text-primary' : '',
              ].join(' ')}
            >
              {isDone ? <i className="bi-check text-sm" /> : i + 1}
            </div>

            {/* Label */}
            <span
              className={[
                'mt-1.5 text-[10px] font-semibold text-center whitespace-nowrap transition-colors',
                isActive ? 'text-primary' : isDone ? 'text-mid' : 'text-muted',
              ].join(' ')}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
