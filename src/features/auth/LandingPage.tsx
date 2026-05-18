// LandingPage — Emil Kowalski design language
// Every detail deliberate. No noise. Precise spring animations.
// The unforgettable thing: the logo resolves letter by letter,
// then a razor-thin gold underline draws itself under "Ratiba".

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'

const FEATURES = [
  { n: '01', title: 'Under 5 minutes',   body: 'From blank screen to a fully validated CBC-compliant timetable.' },
  { n: '02', title: 'CBC-Compliant',      body: 'Built to exact MoE timetabling guidelines for Grades 1–9.' },
  { n: '03', title: 'Print-ready export', body: 'B&W PDFs sized for notice boards, staffrooms, and admin files.' },
]

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

// Floating grid-cell decorations — Emil's signature minimal art
function GridDecoration() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Subtle mesh glow — primary only */}
      <div style={{
        position: 'absolute',
        width: 600,
        height: 600,
        borderRadius: '50%',
        top: -200,
        right: -100,
        background: 'radial-gradient(circle, rgba(13,61,35,0.22) 0%, transparent 65%)',
        filter: 'blur(1px)',
      }} />
      <div style={{
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: '50%',
        bottom: 0,
        left: -80,
        background: 'radial-gradient(circle, rgba(200,146,42,0.10) 0%, transparent 70%)',
      }} />

      {/* Timetable grid motif — top right */}
      <div style={{
        position: 'absolute',
        top: 60,
        right: 60,
        opacity: 0.07,
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 16px)',
        gridTemplateRows: 'repeat(5, 16px)',
        gap: 6,
      }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{
            width: 16, height: 16,
            borderRadius: 2,
            background: i % 7 === 0 || i % 11 === 0 ? '#C8922A' : '#FFFFFF',
          }} />
        ))}
      </div>

      {/* Kenya map silhouette — bottom right corner, barely visible */}
      <svg
        viewBox="0 0 200 220"
        style={{
          position: 'absolute',
          bottom: 60,
          right: -20,
          width: 200,
          height: 220,
          opacity: 0.035,
          fill: '#C8922A',
        }}
      >
        <path d="M100 10L140 20L170 35L185 55L190 80L180 100L190 120L175 140L165 170L150 190L130 210L110 215L95 200L80 185L65 195L50 180L35 160L25 140L15 120L20 95L10 75L25 55L50 35L75 18Z" />
      </svg>
    </div>
  )
}

// Magnetic button — Emil's signature interaction
function MagneticButton({
  children,
  onClick,
  variant = 'gold',
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'gold' | 'ghost'
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 350, damping: 25 })
  const springY = useSpring(y, { stiffness: 350, damping: 25 })

  function onMove(e: React.MouseEvent) {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * 0.25)
    y.set((e.clientY - (r.top + r.height / 2)) * 0.25)
  }
  function onLeave() { x.set(0); y.set(0) }

  const isGold = variant === 'gold'

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      whileTap={{ scale: 0.96 }}
      style={{
        x: springX,
        y: springY,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 24px',
        borderRadius: 8,
        border: isGold ? 'none' : '1px solid rgba(255,255,255,0.2)',
        background: isGold ? '#C8922A' : 'transparent',
        color: isGold ? '#0F1B14' : 'rgba(255,255,255,0.85)',
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 600,
        fontSize: '0.9rem',
        letterSpacing: '-0.01em',
        cursor: 'pointer',
        backdropFilter: isGold ? 'none' : 'blur(8px)',
        boxShadow: isGold
          ? '0 1px 2px rgba(200,146,42,0.3), 0 4px 16px rgba(200,146,42,0.2)'
          : 'none',
        transition: 'background 150ms, box-shadow 150ms',
      }}
      onMouseEnter={e => {
        if (isGold) {
          (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.92)'
        } else {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)'
        }
      }}
      onMouseLeave={e => {
        onLeave()
        if (isGold) {
          (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'
        } else {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)'
        }
      }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),   // logo starts
      setTimeout(() => setPhase(2), 700),   // underline
      setTimeout(() => setPhase(3), 950),   // tagline
      setTimeout(() => setPhase(4), 1150),  // CTAs
      setTimeout(() => setPhase(5), 1400),  // features
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const INSTA  = 'Insta'.split('')
  const RATIBA = 'Ratiba'.split('')

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#0C1810',
        backgroundImage: 'none',
        color: 'white',
      }}
    >
      <GridDecoration />

      {/* Top bar — minimal branding + nav */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 32px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: '1rem',
          letterSpacing: '-0.02em',
        }}>
          Insta<span style={{ color: '#C8922A' }}>Ratiba</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '7px 16px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 150ms',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.25)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'white'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'
            }}
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '7px 16px',
              borderRadius: 6,
              border: 'none',
              background: '#C8922A',
              color: '#0F1B14',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              transition: 'filter 150ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(0.92)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)' }}
          >
            Get started
          </button>
        </div>
      </motion.div>

      {/* Hero */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px 40px',
          textAlign: 'center',
        }}
      >
        {/* Logo wordmark — char-by-char with spring */}
        <div style={{ marginBottom: 6 }}>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(3rem, 9vw, 6rem)',
              letterSpacing: '-0.04em',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 0,
            }}
          >
            {INSTA.map((char, i) => (
              <motion.span
                key={`i-${i}`}
                initial={{ opacity: 0, y: 20, rotateX: -40 }}
                animate={phase >= 1 ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{
                  delay: i * 0.06,
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                style={{ color: 'white', display: 'inline-block' }}
              >
                {char}
              </motion.span>
            ))}
            {RATIBA.map((char, i) => (
              <motion.span
                key={`r-${i}`}
                initial={{ opacity: 0, y: 20, rotateX: -40 }}
                animate={phase >= 1 ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{
                  delay: (INSTA.length + i) * 0.06,
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
                style={{ color: '#C8922A', display: 'inline-block' }}
              >
                {char}
              </motion.span>
            ))}
          </h1>

          {/* The razor-thin underline that draws itself */}
          <div style={{ position: 'relative', height: 2, marginTop: 10, maxWidth: 480, margin: '10px auto 0' }}>
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={phase >= 2 ? { scaleX: 1 } : {}}
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: 0.05 }}
              style={{
                height: 1.5,
                borderRadius: 99,
                background: 'linear-gradient(90deg, transparent, #C8922A 20%, #C8922A 80%, transparent)',
              }}
            />
          </div>
        </div>

        {/* Byline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
          style={{
            fontFamily: "'Figtree', sans-serif",
            fontStyle: 'italic',
            fontSize: '0.8rem',
            color: 'rgba(200,146,42,0.55)',
            marginTop: 14,
            letterSpacing: '0.02em',
          }}
        >
          by AG Computer Solutions
        </motion.p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          style={{
            fontFamily: "'Figtree', sans-serif",
            fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
            color: 'rgba(255,255,255,0.55)',
            maxWidth: 460,
            marginTop: 18,
            lineHeight: 1.6,
            letterSpacing: '-0.005em',
          }}
        >
          Automated CBC-compliant school timetables —<br />
          generated in minutes, not days.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 32,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <MagneticButton onClick={() => navigate('/register')} variant="gold">
            <i className="bi-rocket-takeoff-fill" style={{ fontSize: '0.85rem' }} />
            Get started free
          </MagneticButton>
          <MagneticButton onClick={() => navigate('/login')} variant="ghost">
            Sign in
            <i className="bi-arrow-right" style={{ fontSize: '0.85rem' }} />
          </MagneticButton>
        </motion.div>

        {/* Trust chips — exact Kowalski restrained style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : {}}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 8,
            marginTop: 20,
          }}
        >
          {['CBC Compliant', 'Grade 1–9', 'Works Offline', 'Free to Start'].map(t => (
            <span
              key={t}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                borderRadius: 99,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 500,
                fontSize: '0.67rem',
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.04em',
              }}
            >
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#C8922A', flexShrink: 0 }} />
              {t}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Feature strip — Emil's numbered list aesthetic */}
      <AnimatePresence>
        {phase >= 5 && (
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              padding: '0 24px 48px',
              maxWidth: 880,
              margin: '0 auto',
              width: '100%',
            }}
          >
            {/* Hairline divider */}
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              style={{
                height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)',
                marginBottom: 36,
              }}
            />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 1,
            }}>
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.n}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4, ease: EASE_OUT_EXPO }}
                  style={{
                    padding: '24px 28px',
                    borderRight: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '0.65rem',
                      color: 'rgba(200,146,42,0.6)',
                      letterSpacing: '0.04em',
                      display: 'block',
                      marginBottom: 12,
                    }}
                  >
                    {f.n}
                  </span>
                  <h3
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: 'white',
                      letterSpacing: '-0.018em',
                      marginBottom: 8,
                      lineHeight: 1.3,
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Figtree', sans-serif",
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.38)',
                      lineHeight: 1.6,
                    }}
                  >
                    {f.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}