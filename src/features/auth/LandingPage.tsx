// LandingPage — §4.2.1 / §3.5.1
// Cinematic load sequence: logo char-by-char → subtitle → underline → CTAs → features

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// ── Character-by-character logo ──────────────────────────────
const LOGO_TEXT = 'InstaRatiba'
const CHARS = LOGO_TEXT.split('')

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
    desc: 'Export black-and-white PDFs ready for notice boards, teachers, and admin offices.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState(0)
  // phase 0 = overlay fade, 1 = logo, 2 = subtitle, 3 = underline, 4 = CTAs, 5 = features

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
      style={{ background: 'var(--landing-bg, #f0f7f0)' }}
    >
      {/* ── Animated mesh gradient background ── */}
      <MeshBackground />

      {/* ── Hero section ── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 pt-16 pb-8 text-center">

        {/* Logo wordmark */}
        <div className="mb-1" aria-label="InstaRatiba">
          <div className="flex items-center justify-center flex-wrap gap-0">
            {CHARS.map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{
                  delay: i * 0.08,
                  duration: 0.28,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(2.2rem, 8vw, 4.2rem)',
                  color: '#2E7D32',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.1,
                  display: 'inline-block',
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* Animated green underline */}
          <div className="relative h-[4px] mt-2 overflow-hidden rounded-full mx-auto" style={{ maxWidth: 360 }}>
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={phase >= 3 ? { scaleX: 1 } : {}}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(90deg, #2E7D32, #4CAF50, #A5D6A7)' }}
            />
          </div>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontStyle: 'italic',
            fontSize: '0.95rem',
            color: '#4CAF50',
            marginTop: 6,
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
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
            color: '#37474F',
            marginTop: 14,
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
          <button
            onClick={() => navigate('/register')}
            className="cta-primary"
            style={ctaPrimary}
          >
            <i className="bi-rocket-takeoff-fill" />
            Get Started — It's Free
          </button>
          <button
            onClick={() => navigate('/login')}
            className="cta-ghost"
            style={ctaGhost}
          >
            <i className="bi-box-arrow-in-right" />
            Sign In
          </button>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={phase >= 4 ? { opacity: 1 } : {}}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-5"
        >
          {['CBC Compliant', 'Grade 1–9', 'Free to Start', 'Works Offline'].map((badge) => (
            <span
              key={badge}
              style={{
                background: '#E8F5E9',
                border: '1px solid #A5D6A7',
                borderRadius: 999,
                padding: '3px 12px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#2E7D32',
                fontFamily: 'DM Sans, sans-serif',
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
                  style={featureCard}
                >
                  <div style={featureIconWrap}>
                    <i className={`${f.icon} text-xl`} style={{ color: '#2E7D32' }} />
                  </div>
                  <h3 style={featureTitle}>{f.title}</h3>
                  <p style={featureDesc}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Bottom gradient fade for footer ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-0"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(232,245,233,0.6))' }}
      />
    </div>
  )
}

// ── Animated mesh gradient background ──────────────────────
function MeshBackground() {
  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div style={meshStyle} />
      {/* Floating blobs */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{ ...blob, width: 480, height: 480, top: -100, right: -80, background: 'radial-gradient(circle, rgba(76,175,80,0.18) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 30, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{ ...blob, width: 360, height: 360, bottom: 60, left: -60, background: 'radial-gradient(circle, rgba(165,214,167,0.22) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        style={{ ...blob, width: 240, height: 240, top: '40%', left: '30%', background: 'radial-gradient(circle, rgba(46,125,50,0.10) 0%, transparent 70%)' }}
      />
    </div>
  )
}

// ── Inline styles (avoids Tailwind purge issues for dynamic values) ──
const ctaPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: '#2E7D32', color: '#fff',
  padding: '13px 28px',
  borderRadius: 12, border: 'none', cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
  fontSize: '0.95rem', letterSpacing: '0.02em',
  boxShadow: '0 4px 16px rgba(46,125,50,0.28)',
  transition: 'transform 0.15s, box-shadow 0.15s',
}
const ctaGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'transparent', color: '#2E7D32',
  padding: '12px 28px',
  borderRadius: 12, border: '2px solid #2E7D32', cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
  fontSize: '0.95rem', letterSpacing: '0.02em',
  transition: 'background 0.15s, transform 0.15s',
}
const featureCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.78)',
  border: '1px solid rgba(165,214,167,0.6)',
  borderRadius: 16,
  padding: '20px 18px',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 2px 12px rgba(46,125,50,0.07)',
}
const featureIconWrap: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 12,
  background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center',
  marginBottom: 12,
}
const featureTitle: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
  fontSize: '0.95rem', color: '#1B5E20', marginBottom: 6,
}
const featureDesc: React.CSSProperties = {
  fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem',
  color: '#546E7A', lineHeight: 1.55,
}
const meshStyle: React.CSSProperties = {
  position: 'absolute', inset: 0,
  background: 'linear-gradient(135deg, #f0f9f0 0%, #e8f5e9 30%, #f5fff5 60%, #e0f2e0 100%)',
}
const blob: React.CSSProperties = {
  position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
}
