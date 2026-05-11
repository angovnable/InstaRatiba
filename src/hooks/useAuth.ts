// ============================================================
// InstaRatiba
// src/hooks/useAuth.ts
// Subscribes to Supabase auth state changes and syncs to the
// auth store.  Mount once at the app root (App.tsx already
// calls useAuth() at the top level).
// ============================================================

import { useEffect } from 'react'
import { supabase }       from '@/lib/supabase/client'
import { useAuthStore }   from '@/store/authStore'
import { mapSupabaseUser } from '@/lib/supabase/auth'

export function useAuth() {
  const { setUser, setHasCompletedSetup, setLoading } = useAuthStore()

  useEffect(() => {
    // Initialise loading state while we hydrate the session
    setLoading(true)

    // Restore persisted session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user))
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // Subscribe to future auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(mapSupabaseUser(session.user))
          // school_setup completion is determined elsewhere (SchoolSetupPage)
          // but we don't reset it on a token refresh — only on logout
        } else {
          setUser(null)
          setHasCompletedSetup(false)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setHasCompletedSetup, setLoading])
}
