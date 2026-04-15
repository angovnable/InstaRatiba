import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useStore } from '@/store'

export function useAuth() {
  const { setUser, loadTimetables, syncIfOnline } = useStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user.uid, user.email, user.displayName, user.photoURL)
        loadTimetables()
      } else {
        setUser(null, null, null, null)
      }
    })

    // Sync when coming back online
    const handleOnline = () => syncIfOnline()
    window.addEventListener('online', handleOnline)

    return () => {
      unsub()
      window.removeEventListener('online', handleOnline)
    }
  }, [])
}
