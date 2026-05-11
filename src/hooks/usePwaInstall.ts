// ============================================================
// InstaRatiba — src/hooks/usePwaInstall.ts
// Captures the browser's beforeinstallprompt event so we can
// show a custom install button at the right moment.
// Also detects iOS (which uses its own install mechanism).
// ============================================================

import { useEffect, useState, useCallback } from 'react'

// Chrome / Edge fire this event — Firefox / Safari do not
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallStatus =
  | 'unavailable'    // browser doesn't support or already installed
  | 'ready'          // prompt is captured and ready to show
  | 'ios'            // iOS Safari — show manual instructions
  | 'installed'      // user just accepted

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [status, setStatus] = useState<InstallStatus>('unavailable')
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    // ── Detect iOS ──────────────────────────────────────────
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream
    const isInStandaloneMode =
      ('standalone' in window.navigator) &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    if (ios && !isInStandaloneMode) {
      setIsIos(true)
      setStatus('ios')
      return
    }

    // ── Detect already-installed PWA ────────────────────────
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setStatus('installed')
      return
    }

    // ── Capture Chrome / Edge prompt ────────────────────────
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setStatus('ready')
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Detect if user installs via browser menu (without our prompt)
    window.addEventListener('appinstalled', () => {
      setStatus('installed')
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // ── Trigger the native install dialog ────────────────────
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setStatus('installed')
      setDeferredPrompt(null)
      return true
    }
    return false
  }, [deferredPrompt])

  return { status, isIos, promptInstall }
}
