// AuthCallbackPage — handles Supabase OAuth redirect (§6.4)
// Route: /auth/callback

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { mapSupabaseUser } from '@/lib/supabase/auth'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { setUser, setHasCompletedSetup } = useAuthStore()

  useEffect(() => {
    const handle = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session?.user) throw error ?? new Error('No session')

        const appUser = mapSupabaseUser(session.user)
        setUser(appUser)

        // Check if school is set up
        const { data: school } = await supabase
          .from('schools')
          .select('id')
          .eq('user_id', session.user.id)
          .single()

        setHasCompletedSetup(!!school)
        toast.success('Signed in successfully!')
        navigate(school ? '/dashboard' : '/setup', { replace: true })
      } catch {
        toast.error('Authentication failed. Please try again.')
        navigate('/login', { replace: true })
      }
    }
    handle()
  }, [navigate, setUser, setHasCompletedSetup])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: 'linear-gradient(135deg, #f0f9f0 0%, #e8f5e9 100%)',
    }}>
      <span style={{
        fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
        fontSize: '1.6rem', color: '#0D3D23',
      }}>
        InstaRatiba
      </span>
      <div style={{
        width: 36, height: 36,
        border: '3px solid #EDE7D9',
        borderTopColor: '#0D3D23',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <p style={{ fontFamily: 'Figtree, sans-serif', fontSize: '0.875rem', color: '#7A8C82' }}>
        Completing sign-in…
      </p>
    </div>
  )
}
