import { useState } from 'react'
import { signInWithRedirect, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { X, Mail, Lock, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props { onClose: () => void }

export function AuthModal({ onClose }: Props) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      // Use redirect instead of popup - works perfectly in PWAs
      await signInWithRedirect(auth, googleProvider)
      // Note: User will be redirected, so code after this won't execute
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user') toast.error(e.message)
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setLoading(true)
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email)
        toast.success('Reset email sent — check your inbox')
        onClose(); return
      }
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
        toast.success('Welcome back!', { icon: '👋' })
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
        toast.success('Account created! You can use the app fully offline too.', { duration: 5000 })
      }
      onClose()
    } catch (e: any) {
      const msgs: Record<string, string> = {
        'auth/invalid-credential': 'Email or password is incorrect',
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/weak-password': 'Password must be at least 6 characters',
        'auth/user-not-found': 'No account found with this email',
      }
      toast.error(msgs[e.code] || e.message)
    } finally {
      setLoading(false)
    }
  }

  const lbl = (text: string) => (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>{text}</label>
  )

  return (
    <div
      className="no-print"
      style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card animate-scale-in" style={{ width: '100%', maxWidth: 400, position: 'relative', background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
        {/* Gold top border */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--gold), var(--orange))', borderRadius: '16px 16px 0 0' }} />

        <button onClick={onClose} className="btn btn-ghost" style={{ position: 'absolute', top: 12, right: 12, padding: 6, color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>

        <div style={{ marginBottom: 22, marginTop: 8 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--skyblue))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <path d="M6 8h20M6 14h14M6 20h16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <rect x="20" y="18" width="8" height="10" rx="2" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>InstaRatiba</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CBC Timetable System</div>
            </div>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
            {mode === 'login'
              ? 'Save & sync timetables across all your devices'
              : mode === 'signup'
              ? 'Full offline PWA + cloud sync across devices'
              : 'Enter your email — we\'ll send a reset link'}
          </p>
        </div>

        {/* Google button */}
        {mode !== 'reset' && (
          <>
            <button className="btn btn-google" style={{ width: '100%', justifyContent: 'center', minHeight: 44, fontSize: 14, marginBottom: 4 }} onClick={handleGoogle} disabled={googleLoading}>
              {googleLoading
                ? <Loader2 size={16} className="animate-spin" />
                : <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
              }
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            {lbl('Email Address')}
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" style={{ paddingLeft: 32 }} placeholder="you@school.ac.ke" />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              {lbl('Password')}
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field" style={{ paddingLeft: 32 }} placeholder="Min. 6 characters" minLength={6} />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', minHeight: 44, fontSize: 14, marginTop: 4 }}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'login' ? 'Sign In with Email' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
          </button>
        </form>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'center', fontSize: 12 }}>
          {mode === 'login' && <>
            <button onClick={() => setMode('signup')} style={{ color: 'var(--skyblue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
              No account yet? Sign up free
            </button>
            <button onClick={() => setMode('reset')} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
              Forgot password?
            </button>
          </>}
          {mode !== 'login' && (
            <button onClick={() => setMode('login')} style={{ color: 'var(--skyblue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
              Already have an account? Sign in
            </button>
          )}
        </div>

        <p style={{ marginTop: 14, fontSize: 10, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.5 }}>
          Works fully offline as a PWA — data syncs automatically when you reconnect.
        </p>
      </div>
    </div>
  )
}