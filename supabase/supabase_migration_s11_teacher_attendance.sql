-- Migration: Add teacher_attendance table
-- Supports §4.2.6 Teacher Manager & Daily Register

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, date)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_school_date ON public.teacher_attendance(school_id, date);

-- Enable RLS
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Only school members can manage attendance
CREATE POLICY "attendance_school_member"
  ON public.teacher_attendance
  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));
