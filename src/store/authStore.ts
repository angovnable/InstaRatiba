import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppUser, UserRole } from '@/types'

interface AuthState {
  user: AppUser | null
  isAuthenticated: boolean
  hasCompletedSetup: boolean
  isLoading: boolean

  // Actions
  setUser: (user: AppUser | null) => void
  setHasCompletedSetup: (v: boolean) => void
  setLoading: (v: boolean) => void
  logout: () => void

  // Convenience
  currentRole: () => UserRole | null
  canEdit: () => boolean
  canApprove: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      hasCompletedSetup: false,
      isLoading: false,

      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),

      setHasCompletedSetup: (v) =>
        set({ hasCompletedSetup: v }),

      setLoading: (v) =>
        set({ isLoading: v }),

      logout: () =>
        set({ user: null, isAuthenticated: false, hasCompletedSetup: false }),

      currentRole: () => get().user?.role ?? null,

      // Deputy Head and above, plus HOD for their department (§5.9)
      canEdit: () => {
        const role = get().user?.role
        return role === 'head_teacher' || role === 'deputy_head' || role === 'hod'
      },

      // Only Head Teacher can approve (§5.9)
      canApprove: () => get().user?.role === 'head_teacher',
    }),
    {
      name: 'instaratiba-auth',
      partialize: (s) => ({
        user: s.user,
        isAuthenticated: s.isAuthenticated,
        hasCompletedSetup: s.hasCompletedSetup,
      }),
    }
  )
)
