import { useEffect } from 'react'
import { useUiStore } from '@/store'

/** Syncs window online/offline events to the UI store. Mount once in App.tsx or AppShell. */
export function useOnlineStatus() {
  const setOnline = useUiStore((s) => s.setOnline)

  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online',  on)
      window.removeEventListener('offline', off)
    }
  }, [setOnline])
}
