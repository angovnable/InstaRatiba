// ============================================================
// InstaRatiba — src/hooks/useBootstrap.ts
// Global data bootstrapper — runs once after login.
// Hydrates school, classes, teachers, teacher-subjects, and
// the active timetable + its slots into their Zustand stores.
// This means every page has data regardless of entry point.
// ============================================================

import { useEffect, useRef } from 'react'
import { useAuthStore }      from '@/store/authStore'
import { useSchoolStore }    from '@/store/schoolStore'
import { useTeacherStore }   from '@/store/teacherStore'
import { useTimetableStore } from '@/store/timetableStore'
import { fetchSchoolByUser } from '@/lib/supabase/school'
import { fetchClasses }      from '@/lib/supabase/classes'
import { fetchTeachers, fetchAllTeacherSubjects } from '@/lib/supabase/teachers'
import { fetchTimetables, fetchSlots } from '@/lib/supabase/timetable'

export function useBootstrap() {
  const { user, isAuthenticated } = useAuthStore()
  const schoolStore   = useSchoolStore()
  const teacherStore  = useTeacherStore()
  const ttStore       = useTimetableStore()

  // Prevent double-fetching on React StrictMode double-mount
  const ranRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      // Reset guard when user logs out so next login re-bootstraps
      ranRef.current = false
      return
    }
    if (ranRef.current) return
    ranRef.current = true

    const bootstrap = async () => {
      try {
        // ── 1. School ──────────────────────────────────────
        const school = await fetchSchoolByUser(user.id)
        if (!school) return   // setup not yet complete
        schoolStore.setSchool(school)
        const schoolId = school.id

        // ── 2. Classes + Teachers (parallel) ──────────────
        const [classes, teachers, teacherSubjects] = await Promise.all([
          fetchClasses(schoolId),
          fetchTeachers(schoolId),
          fetchAllTeacherSubjects(schoolId),
        ])
        schoolStore.setClasses(classes)
        teacherStore.setTeachers(teachers)
        teacherStore.setTeacherSubjects(teacherSubjects)

        // ── 3. Active timetable ────────────────────────────
        // Use what's already in the store if DashboardPage set it,
        // otherwise fetch the list and pick the best candidate.
        let activeTT = ttStore.current
        if (!activeTT) {
          const timetables = await fetchTimetables(schoolId)
          if (timetables.length > 0) {
            activeTT = timetables.find(t => t.status === 'published') ?? timetables[0]
            ttStore.setCurrentTimetable(activeTT)
          }
        }

        // ── 4. Slots ───────────────────────────────────────
        // Hydrate if the store has a timetable but empty slots.
        if (activeTT && ttStore.slots.length === 0) {
          const slots = await fetchSlots(activeTT.id)
          ttStore.setSlots(slots)
        }

      } catch (err) {
        // Non-fatal — individual pages show their own empty states
        console.warn('[useBootstrap] Failed to hydrate app data:', err)
      }
    }

    bootstrap()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id])
}
