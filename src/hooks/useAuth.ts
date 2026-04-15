import { useEffect } from 'react'
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useStore } from '@/store'

export function useAuth() {
  const { setUser, loadTimetables, syncIfOnline, setAuthReady } = useStore()

  useEffect(() => {
    // Must resolve redirect result BEFORE reacting to auth state changes.
    // onAuthStateChanged fires null immediately on page load (even if user
    // is coming back from Google redirect), causing a flash of signed-out UI.
    // getRedirectResult waits for Firebase to finalize the redirect, then
    // setAuthReady(true) unblocks the UI.
    getRedirectResult(auth)
      .catch((err) => console.error('Redirect sign-in error:', err))
      .finally(() => setAuthReady(true))

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user.uid, user.email, user.displayName, user.photoURL)
        loadTimetables()
      } else {
        setUser(null, null, null, null)
      }
    })

    const handleOnline = () => syncIfOnline()
    window.addEventListener('online', handleOnline)

    return () => {
      unsub()
      window.removeEventListener('online', handleOnline)
    }
  }, [])
}