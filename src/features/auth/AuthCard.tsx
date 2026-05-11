// AuthCard — shared card shell for Login & Register pages

import { motion } from 'framer-motion'

interface AuthCardProps {
  children: React.ReactNode
}

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #f0f9f0 0%, #e8f5e9 60%, #f5fff5 100%)' }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', width: 400, height: 400,
            top: -100, right: -80, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(76,175,80,0.16) 0%, transparent 70%)',
          }}
        />
        <motion.div
          animate={{ x: [0, -15, 0], y: [0, 20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          style={{
            position: 'absolute', width: 320, height: 320,
            bottom: 40, left: -60, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(165,214,167,0.20) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(165,214,167,0.5)',
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(46,125,50,0.12)',
          padding: '36px 32px',
          width: '100%',
          maxWidth: 440,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <span style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 800,
            fontSize: '1.8rem',
            color: '#2E7D32',
            letterSpacing: '-0.01em',
          }}>
            InstaRatiba
          </span>
          <div style={{
            height: 3, borderRadius: 999, marginTop: 4, marginBottom: 0,
            background: 'linear-gradient(90deg, #2E7D32, #4CAF50, #A5D6A7)',
            maxWidth: 140, margin: '4px auto 0',
          }} />
        </div>

        {children}
      </motion.div>
    </div>
  )
}
