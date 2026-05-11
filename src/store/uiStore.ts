import { create } from 'zustand'
import type { ToastPayload } from '@/types'

interface UiState {
  sidebarOpen: boolean
  isOnline: boolean
  toasts: ToastPayload[]
  activeWizardStep: number

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
  setOnline: (v: boolean) => void
  addToast: (t: Omit<ToastPayload, 'id'>) => void
  removeToast: (id: string) => void
  setWizardStep: (step: number) => void
}

let toastId = 0

export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen: true,
  // Default to true — the useOnlineStatus hook's event listeners will correct this immediately.
  // Avoid reading navigator.onLine at module parse time: it's unreliable on captive portals
  // and can run in non-browser environments (SSR, tests). (Issue #26 fix)
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  toasts: [],
  activeWizardStep: 0,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setOnline: (v) => set({ isOnline: v }),

  addToast: (t) => {
    const id = `toast-${++toastId}`
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
    // Auto-remove after 3.5 s
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }))
    }, 3500)
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setWizardStep: (step) => set({ activeWizardStep: step }),
}))
