// src/lib/supabase/auth.ts
// Supabase auth helpers — §4.2.2 / §6.4

import { supabase } from './client'
import type { AppUser, UserRole } from '@/types'

// ── Sign up with email + password ───────────────────────────
export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  })
  if (error) throw error
  return data
}

// ── Sign in with email + password ───────────────────────────
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ── Google OAuth ─────────────────────────────────────────────
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
  return data
}

// ── Sign out ─────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ── Send password reset email ────────────────────────────────
export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  if (error) throw error
}

// ── Map Supabase user → AppUser ──────────────────────────────
export function mapSupabaseUser(supaUser: { id: string; email?: string; user_metadata?: Record<string, string> }, role: UserRole = 'deputy_head'): AppUser {
  return {
    id: supaUser.id,
    email: supaUser.email ?? '',
    display_name: supaUser.user_metadata?.display_name ?? supaUser.user_metadata?.full_name ?? supaUser.email ?? '',
    avatar_url: supaUser.user_metadata?.avatar_url,
    role,
    school_id: undefined,
  }
}

// ── Get current session ──────────────────────────────────────
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// ── Listen for auth state changes ───────────────────────────
export function onAuthStateChange(callback: (user: AppUser | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback(mapSupabaseUser(session.user))
    } else {
      callback(null)
    }
  })
}
