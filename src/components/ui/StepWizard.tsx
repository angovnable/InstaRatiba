// StepWizard — Emil Kowalski design language
// Minimal numbered steps. The only decoration is the spring-animated
// active indicator and the completing gold fill.

import { motion } from 'framer-motion'
import type { WizardStep } from '@/types'

interface StepWizardProps {
  steps: WizardStep[]
  currentStep: number
}

export default function StepWizard({ steps, currentStep }: StepWizardProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: 36,
        position: 'relative',
      }}
    >
      {/* Background connector track */}
      <div style={{
        position: 'absolute',
        top: 14,
        left: '6%',
        right: '6%',
        height: 1,
        background: '#EDE7D9',
        zIndex: 0,
      }} />

      {/* Gold progress fill */}
      <motion.div
        animate={{ width: currentStep === 0 ? '0%' : `${(currentStep / (steps.length - 1)) * 88}%` }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        style={{
          position: 'absolute',
          top: 14,
          left: '6%',
          height: 1,
          background: '#C8922A',
          zIndex: 1,
        }}
      />

      {steps.map((step, i) => {
        const done   = i < currentStep
        const active = i === currentStep

        return (
          <div
            key={step.key}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Step dot */}
            <motion.div
              animate={{
                scale:           active ? 1.1 : 1,
                background:      done ? '#C8922A' : active ? '#0D3D23' : 'white',
                borderColor:     done ? '#C8922A' : active ? '#0D3D23' : '#EDE7D9',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: '2px solid',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: active ? '0 0 0 4px rgba(13,61,35,0.08)' : 'none',
                transition: 'box-shadow 200ms',
              }}
            >
              {done ? (
                <motion.i
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                  className="bi-check"
                  style={{ fontSize: '0.8rem', color: 'white', lineHeight: 1 }}
                />
              ) : (
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: active ? 'white' : '#7A8C82',
                    lineHeight: 1,
                  }}
                >
                  {i + 1}
                </span>
              )}
            </motion.div>

            {/* Label */}
            <motion.span
              animate={{ color: active ? '#0D3D23' : done ? '#C8922A' : '#7A8C82' }}
              style={{
                marginTop: 7,
                fontFamily: "'Outfit', sans-serif",
                fontWeight: active ? 600 : 400,
                fontSize: '0.62rem',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.005em',
              }}
            >
              {step.label}
            </motion.span>
          </div>
        )
      })}
    </div>
  )
}
