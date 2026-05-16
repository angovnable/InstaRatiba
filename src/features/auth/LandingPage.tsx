// LandingPage — InstaRatiba Kenyan/EAC Theme
// Dark Nairobi Night bg, Kenya flag stripe, Savanna Gold accents, Kenya map SVG watermark

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// ── Character-by-character logo ──────────────────────────────
const INSTA = 'Insta'.split('')
const RATIBA = 'Ratiba'.split('')

// ── Feature strip data ───────────────────────────────────────
const FEATURES = [
  {
    icon: 'bi-lightning-charge-fill',
    title: 'Under 5 Minutes',
    desc: 'Generate a fully validated CBC-compliant timetable faster than any manual method.',
  },
  {
    icon: 'bi-patch-check-fill',
    title: 'CBC-Compliant',
    desc: 'Built to the exact MoE timetabling guidelines for Grade 1–9 comprehensive schools.',
  },
  {
    icon: 'bi-file-earmark-arrow-down-fill',
    title: 'Print-Ready Export',
    desc: 'Export PDFs ready for notice boards, teachers, and admin offices.',
  },
]

const TRUST_BADGES = ['CBC Compliant', 'Grade 1–9', 'Free to Start', 'Works Offline']

export default function LandingPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 980),
      setTimeout(() => setPhase(3), 1180),
      setTimeout(() => setPhase(4), 1420),
      setTimeout(() => setPhase(5), 1750),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: '#0F1B14' }}
    >
      {/* ── Kenyan flag top stripe ── */}
      <div className="kenya-flag-stripe" />

      {/* ── Animated mesh gradient background ── */}
      <MeshBackground />

      {/* ── Kenya map SVG watermark ── */}
      <KenyaMapWatermark />

      {/* ── Hero section ── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 pt-20 pb-8 text-center">

        {/* Logo wordmark — char by char */}
        <div className="mb-1" aria-label="InstaRatiba">
          <div className="flex items-center justify-center flex-wrap gap-0">
            {INSTA.map((char, i) => (
              <motion.span
                key={`insta-${i}`}
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 'clamp(2.2rem, 8vw, 4.2rem)',
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.1,
                  display: 'inline-block',
                }}
              >
                {char}
              </motion.span>
            ))}
            {RATIBA.map((char, i) => (
              <motion.span
                key={`ratiba-${i}`}
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{ delay: (INSTA.length + i) * 0.08, duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 'clamp(2.2rem, 8vw, 4.2rem)',
                  color: '#C8922A',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.1,
                  display: 'inline-block',
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* Animated underline — Savanna Gold → Rift Red */}
          <div className="relative h-[4px] mt-2 overflow-hidden rounded-full mx-auto" style={{ maxWidth: 360 }}>
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={phase >= 3 ? { scaleX: 1 } : {}}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(90deg, #C8922A, #A01F1F)' }}
            />
          </div>
        </div>

        {/* by AG Computer Solutions */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: '0.9rem',
            color: 'rgba(200,146,42,0.7)',
            marginTop: 8,
            marginBottom: 4,
            letterSpacing: '0.02em',
          }}
        >
          by AG Computer Solutions
        </motion.p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : {}}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
            color: 'rgba(255,255,255,0.75)',
            marginTop: 12,
            maxWidth: 440,
          }}
        >
          Automated CBC-compliant school timetables — generated in minutes, not days.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row gap-3 mt-8"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/register')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#C8922A', color: '#0F1B14',
              padding: '13px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontWeight: 700,
              fontSize: '0.95rem', letterSpacing: '0.01em',
              boxShadow: '0 4px 20px rgba(200,146,42,0.35)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#B57E21')}
            onMouseLeave={e => (e.currentTarget.style.background = '#C8922A')}
          >
            <i className="bi-rocket-takeoff-fill" />
            Get Started — It's Free
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'transparent', color: '#fff',
              padding: '12px 28px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontWeight: 600,
              fontSize: '0.95rem', letterSpacing: '0.01em',
              backdropFilter: 'blur(8px)',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
          >
            <i className="bi-box-arrow-in-right" />
            Sign In
          </motion.button>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : {}}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-5"
        >
          {TRUST_BADGES.map((badge) => (
            <span
              key={badge}
              style={{
                background: 'rgba(200,146,42,0.10)',
                border: '1px solid rgba(200,146,42,0.3)',
                borderRadius: 999,
                padding: '4px 14px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#C8922A',
                fontFamily: 'var(--font-ui)',
                letterSpacing: '0.03em',
              }}
            >
              {badge}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── Feature strip ── */}
      <AnimatePresence>
        {phase >= 5 && (
          <div className="relative z-10 px-6 pb-20 max-w-4xl mx-auto w-full">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.35, ease: 'easeOut' }}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(200,146,42,0.20)',
                    borderRadius: 16,
                    padding: '20px 18px',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {/* Gold icon box */}
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'rgba(200,146,42,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <i className={`${f.icon} text-xl`} style={{ color: '#C8922A' }} />
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: '#fff',
                      marginBottom: 6,
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.82rem',
                      color: 'rgba(255,255,255,0.6)',
                      lineHeight: 1.55,
                    }}
                  >
                    {f.desc}
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

// ── Animated mesh gradient background ──────────────────────
function MeshBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Mau Forest orb */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
          width: 520, height: 520, top: -120, right: -100,
          background: 'radial-gradient(circle, rgba(13,61,35,0.35) 0%, transparent 70%)',
        }}
      />
      {/* Savanna Gold orb */}
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 30, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{
          position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
          width: 380, height: 380, bottom: 60, left: -80,
          background: 'radial-gradient(circle, rgba(200,146,42,0.14) 0%, transparent 70%)',
        }}
      />
      {/* Indian Ocean orb */}
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        style={{
          position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
          width: 260, height: 260, top: '40%', left: '28%',
          background: 'radial-gradient(circle, rgba(30,92,138,0.12) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}

// ── Kenya map SVG silhouette watermark ──────────────────────
function KenyaMapWatermark() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        bottom: 40,
        right: -20,
        width: 280,
        height: 280,
        opacity: 0.04,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {/* Approximate Kenya outline as a simple SVG path */}
      <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M100 10 L140 20 L165 45 L175 70 L170 95 L155 115 L160 140 L155 165
             L140 185 L120 200 L100 210 L85 200 L70 185 L60 165 L55 140 L45 115
             L30 95 L25 70 L35 45 L55 25 L80 12 Z"
          fill="#C8922A"
        />
        {/* Coast indentation */}
        <path
          d="M155 115 L170 110 L185 115 L180 130 L165 135 L155 130 Z"
          fill="#C8922A"
        />
      </svg>
    </div>
  )
}
