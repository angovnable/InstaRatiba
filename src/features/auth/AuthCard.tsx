// AuthCard — Emil Kowalski design language
// Clean white card that floats on a dark, textured field.
// No blobs. No noise. Just precise edges and correct spacing.

import { motion } from 'framer-motion'

interface AuthCardProps { children: React.ReactNode }

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        background: '#0C1810',
        backgroundImage: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Single restrained glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          top: -150,
          right: -100,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,61,35,0.20) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'white',
          borderRadius: 16,
          boxShadow: '0 0 0 1px rgba(13,61,35,0.06), 0 8px 32px rgba(13,61,35,0.16)',
          padding: '32px 28px',
          width: '100%',
          maxWidth: 420,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: '1.7rem',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            <span style={{ color: '#0D3D23' }}>Insta</span>
            <span style={{ color: '#C8922A' }}>Ratiba</span>
          </div>
          {/* Thin gold rule under Ratiba */}
          <div style={{
            height: 1.5,
            width: 80,
            margin: '8px auto 0',
            borderRadius: 99,
            background: 'linear-gradient(90deg, transparent, #C8922A, transparent)',
          }} />
        </div>

        {children}
      </motion.div>
    </div>
  )
}
