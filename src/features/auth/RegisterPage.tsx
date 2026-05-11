// RegisterPage — §4.2.2
// Create account form with display name, email, password + strength indicator

import { useState, forwardRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import AuthCard from './AuthCard'
import { signUpWithEmail, signInWithGoogle } from '@/lib/supabase/auth'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  displayName: z.string().min(2, 'Enter your full name').max(60),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
})

type FormData = z.infer<typeof schema>

// ── Password strength scorer ─────────────────────────────────
function scorePassword(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { label: '', color: '#E0E0E0' },
    { label: 'Weak', color: '#E53935' },
    { label: 'Fair', color: '#FFB300' },
    { label: 'Good', color: '#4CAF50' },
    { label: 'Strong', color: '#2E7D32' },
    { label: 'Very Strong', color: '#1B5E20' },
  ]
  return { score, ...map[Math.min(score, 5)] }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [passwordVal, setPasswordVal] = useState('')
  const [registered, setRegistered] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const passwordWatch = watch('password', '')
  const strength = scorePassword(passwordWatch || passwordVal)

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      await signUpWithEmail(data.email, data.password, data.displayName)
      setRegistered(true)
      toast.success('Account created! Check your email to confirm.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      toast.error(msg.includes('already') ? 'An account with this email already exists.' : msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true)
      await signInWithGoogle()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed'
      toast.error(msg)
      setGoogleLoading(false)
    }
  }

  return (
    <AuthCard>
      <TabSwitcher active="register" />

      <AnimatePresence mode="wait">
        {registered ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-center py-4"
          >
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <i className="bi-envelope-check-fill" style={{ fontSize: 28, color: '#2E7D32' }} />
            </div>
            <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: '#1B5E20', fontSize: '1.1rem', marginBottom: 8 }}>
              Check your email
            </h3>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', color: '#546E7A', lineHeight: 1.6 }}>
              We sent a confirmation link to your email. Click it to activate your account, then sign in.
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{ ...submitBtnStyle, marginTop: 20, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <i className="bi-box-arrow-in-right" /> Go to Sign In
            </button>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading || isSubmitting}
              style={googleBtnStyle}
              className="w-full flex items-center justify-center gap-3 mb-4"
            >
              {googleLoading
                ? <span className="w-4 h-4 border-2 border-[#ccc] border-t-[#4CAF50] rounded-full animate-spin" />
                : <GoogleIcon />}
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#37474F' }}>
                Continue with Google
              </span>
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[#E8F5E9]" />
              <span style={{ fontSize: '0.75rem', color: '#9E9E9E', fontFamily: 'DM Sans, sans-serif' }}>or create with email</span>
              <div className="flex-1 h-px bg-[#E8F5E9]" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FloatingInput
                id="displayName"
                label="Full name"
                type="text"
                autoComplete="name"
                error={errors.displayName?.message}
                {...register('displayName')}
              />
              <FloatingInput
                id="email"
                label="Email address"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />

              {/* Password + strength */}
              <div>
                <div className="relative">
                  <FloatingInput
                    id="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    error={errors.password?.message}
                    {...register('password', {
                      onChange: (e) => setPasswordVal(e.target.value),
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-[18px] text-muted hover:text-primary transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={showPassword ? 'bi-eye-slash' : 'bi-eye'} style={{ fontSize: 16 }} />
                  </button>
                </div>

                {/* Strength bar */}
                {(passwordWatch || passwordVal) && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2"
                  >
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1, height: 3, borderRadius: 999,
                            background: i <= strength.score ? strength.color : '#E0E0E0',
                            transition: 'background 0.3s',
                          }}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p style={{ fontSize: '0.7rem', color: strength.color, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
                        {strength.label} password
                      </p>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Confirm password */}
              <div className="relative">
                <FloatingInput
                  id="confirm"
                  label="Confirm password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  error={errors.confirm?.message}
                  {...register('confirm')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-[18px] text-muted hover:text-primary transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide' : 'Show'}
                >
                  <i className={showConfirm ? 'bi-eye-slash' : 'bi-eye'} style={{ fontSize: 16 }} />
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || googleLoading}
                style={{ ...submitBtnStyle, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {isSubmitting
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <i className="bi-person-plus-fill" />}
                {isSubmitting ? 'Creating account…' : 'Create Account'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#757575', fontFamily: 'DM Sans, sans-serif', marginTop: 12 }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#2E7D32', fontWeight: 600 }}>Sign in</Link>
              </p>
            </form>
          </motion.div>
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
            width: '100%', padding: '18px 14px 8px',
            borderRadius: 10,
            border: `1.5px solid ${error ? '#E53935' : focused ? '#2E7D32' : '#E0E0E0'}`,
            outline: 'none',
            fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', color: '#37474F',
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
            transition: 'all 0.2s', pointerEvents: 'none', lineHeight: 1,
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
            <i className="bi-exclamation-circle" style={{ marginRight: 4 }} />{error}
          </motion.p>
        )}
      </div>
    )
  }
)
FloatingInput.displayName = 'FloatingInput'

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

const googleBtnStyle: React.CSSProperties = {
  background: '#fff', border: '1.5px solid #E0E0E0', borderRadius: 10,
  padding: '11px 16px', cursor: 'pointer',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
}
const submitBtnStyle: React.CSSProperties = {
  background: '#2E7D32', color: '#fff', border: 'none', borderRadius: 10,
  padding: '13px 0',
  fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.92rem',
  letterSpacing: '0.03em', cursor: 'pointer',
  boxShadow: '0 3px 12px rgba(46,125,50,0.25)',
  transition: 'opacity 0.2s, transform 0.15s',
}
