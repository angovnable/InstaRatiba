// LoginPage — §4.2.2
// Tab switcher (Login / Register), Google OAuth, email+password, forgot password

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import AuthCard from './AuthCard'
import { signInWithEmail, signInWithGoogle, sendPasswordReset } from '@/lib/supabase/auth'
import { useAuthStore } from '@/store/authStore'
import { mapSupabaseUser } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormData = z.infer<typeof schema>

const resetSchema = z.object({
  resetEmail: z.string().email('Enter a valid email address'),
})
type ResetData = z.infer<typeof resetSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser, setHasCompletedSetup, setLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const {
    register: registerReset, handleSubmit: handleReset, formState: { errors: resetErrors, isSubmitting: resetSubmitting },
  } = useForm<ResetData>({ resolver: zodResolver(resetSchema) })

  // ── Email sign-in ──
  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      const { user } = await signInWithEmail(data.email, data.password)
      if (!user) throw new Error('No user returned')
      const appUser = mapSupabaseUser(user)
      setUser(appUser)

      // Check if school is set up
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('user_id', user.id)
        .single()

      setHasCompletedSetup(!!school)
      toast.success('Welcome back!')
      navigate(school ? '/dashboard' : '/setup')
    } catch (err: unknown) {
      setShakeKey((k) => k + 1)
      const message = err instanceof Error ? err.message : 'Sign in failed'
      toast.error(message.includes('Invalid') ? 'Incorrect email or password.' : message)
    } finally {
      setLoading(false)
    }
  }

  // ── Google OAuth ──
  const handleGoogle = async () => {
    try {
      setGoogleLoading(true)
      await signInWithGoogle()
      // Redirect handled by Supabase + callback route
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed'
      toast.error(message)
      setGoogleLoading(false)
    }
  }

  // ── Password reset ──
  const onReset = async (data: ResetData) => {
    try {
      await sendPasswordReset(data.resetEmail)
      toast.success('Password reset email sent! Check your inbox.')
      setShowReset(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email'
      toast.error(message)
    }
  }

  return (
    <AuthCard>
      {/* ── Tab switcher ── */}
      <TabSwitcher active="login" />

      {/* ── Google OAuth button ── */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading || isSubmitting}
        style={googleBtnStyle}
        className="w-full flex items-center justify-center gap-3 mb-4"
      >
        {googleLoading ? (
          <span className="w-4 h-4 border-2 border-[#ccc] border-t-[#4CAF50] rounded-full animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#37474F' }}>
          Continue with Google
        </span>
      </button>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-[#E8F5E9]" />
        <span style={{ fontSize: '0.75rem', color: '#9E9E9E', fontFamily: 'DM Sans, sans-serif' }}>or sign in with email</span>
        <div className="flex-1 h-px bg-[#E8F5E9]" />
      </div>

      {/* ── Email/password form ── */}
      <AnimatePresence mode="wait">
        {!showReset ? (
          <motion.form
            key={`login-form-${shakeKey}`}
            initial={{ opacity: 1 }}
            animate={shakeKey > 0 ? { x: [0, -8, 8, -6, 6, 0] } : {}}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FloatingInput
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <div className="relative">
              <FloatingInput
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={showPassword ? 'bi-eye-slash' : 'bi-eye'} style={{ fontSize: 16 }} />
              </button>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowReset(true)}
                style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: '#1565C0', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || googleLoading}
              style={submitBtnStyle}
              className="w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <i className="bi-box-arrow-in-right" />
              )}
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#757575', fontFamily: 'DM Sans, sans-serif', marginTop: 12 }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#2E7D32', fontWeight: 600 }}>Create one</Link>
            </p>
          </motion.form>
        ) : (
          /* ── Password reset form ── */
          <motion.form
            key="reset-form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleReset(onReset)}
            className="space-y-4"
            noValidate
          >
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: '#546E7A', marginBottom: 8 }}>
              Enter your email and we'll send a reset link.
            </p>
            <FloatingInput
              id="resetEmail"
              label="Email address"
              type="email"
              autoComplete="email"
              error={resetErrors.resetEmail?.message}
              {...registerReset('resetEmail')}
            />
            <button type="submit" disabled={resetSubmitting} style={submitBtnStyle} className="w-full flex items-center justify-center gap-2">
              {resetSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <i className="bi-envelope-arrow-up" />}
              Send Reset Link
            </button>
            <button
              type="button"
              onClick={() => setShowReset(false)}
              style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: '#757575', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'center' }}
            >
              ← Back to sign in
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthCard>
  )
}

// ── Tab Switcher ─────────────────────────────────────────────
function TabSwitcher({ active }: { active: 'login' | 'register' }) {
  return (
    <div className="flex mb-5 relative" style={{ borderBottom: '2px solid #E8F5E9' }}>
      {(['login', 'register'] as const).map((tab) => {
        const isActive = active === tab
        const label = tab === 'login' ? 'Sign In' : 'Create Account'
        const href = tab === 'login' ? '/login' : '/register'
        return (
          <Link
            key={tab}
            to={href}
            style={{
              flex: 1, textAlign: 'center', padding: '10px 0',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.9rem',
              color: isActive ? '#2E7D32' : '#9E9E9E',
              textDecoration: 'none',
              transition: 'color 0.2s',
              position: 'relative',
            }}
          >
            {label}
            {isActive && (
              <motion.div
                layoutId="tab-underline"
                style={{
                  position: 'absolute', bottom: -2, left: 0, right: 0,
                  height: 2, background: '#2E7D32', borderRadius: 999,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </Link>
        )
      })}
    </div>
  )
}

// ── Floating label input ─────────────────────────────────────
import { forwardRef } from 'react'

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
  error?: string
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, id, error, ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const [hasValue, setHasValue] = useState(false)

    return (
      <div className="relative">
        <input
          id={id}
          ref={ref}
          onFocus={() => setFocused(true)}
          onBlur={(e) => { setFocused(false); setHasValue(!!e.target.value) }}
          onChange={(e) => { setHasValue(!!e.target.value); props.onChange?.(e) }}
          style={{
            width: '100%',
            padding: '18px 14px 8px',
            borderRadius: 10,
            border: `1.5px solid ${error ? '#E53935' : focused ? '#2E7D32' : '#E0E0E0'}`,
            outline: 'none',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.9rem',
            color: '#37474F',
            background: focused ? '#fff' : '#FAFAFA',
            transition: 'border 0.2s, background 0.2s',
            boxSizing: 'border-box',
          }}
          {...props}
        />
        <label
          htmlFor={id}
          style={{
            position: 'absolute', left: 14,
            top: focused || hasValue ? 6 : '50%',
            transform: focused || hasValue ? 'translateY(0)' : 'translateY(-50%)',
            fontSize: focused || hasValue ? '0.7rem' : '0.88rem',
            color: error ? '#E53935' : focused ? '#2E7D32' : '#9E9E9E',
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: focused || hasValue ? 600 : 400,
            transition: 'all 0.2s',
            pointerEvents: 'none',
            lineHeight: 1,
          }}
        >
          {label}
        </label>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: '0.72rem', color: '#E53935', marginTop: 4, fontFamily: 'DM Sans, sans-serif', paddingLeft: 2 }}
          >
            <i className="bi-exclamation-circle me-1" />{error}
          </motion.p>
        )}
      </div>
    )
  }
)
FloatingInput.displayName = 'FloatingInput'

// ── Google Icon SVG ──────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

// ── Styles ───────────────────────────────────────────────────
const googleBtnStyle: React.CSSProperties = {
  background: '#fff',
  border: '1.5px solid #E0E0E0',
  borderRadius: 10,
  padding: '11px 16px',
  cursor: 'pointer',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
}
const submitBtnStyle: React.CSSProperties = {
  background: '#2E7D32',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '13px 0',
  fontFamily: 'DM Sans, sans-serif',
  fontWeight: 700,
  fontSize: '0.92rem',
  letterSpacing: '0.03em',
  cursor: 'pointer',
  boxShadow: '0 3px 12px rgba(46,125,50,0.25)',
  transition: 'opacity 0.2s, transform 0.15s',
}
