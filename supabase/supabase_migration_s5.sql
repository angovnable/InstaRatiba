-- ============================================================
-- InstaRatiba — Supabase Migration: Segment 5
-- Tables: teachers, teacher_subjects, subject_allocations
-- Run this after the Segment 3/4 migration
-- ============================================================

-- ── teachers ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teachers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id            UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  tsc_no               TEXT,
  email                TEXT,
  phone                TEXT,
  max_lessons_day      INTEGER NOT NULL DEFAULT 6,
  max_lessons_week     INTEGER,
  max_consecutive      INTEGER NOT NULL DEFAULT 3,
  min_free_periods_day INTEGER DEFAULT 1,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON public.teachers(school_id);

-- Row Level Security
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers: school members only" ON public.teachers
  USING (
    school_id IN (
      SELECT id FROM public.schools WHERE user_id = auth.uid()
    )
  );

-- ── teacher_subjects ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  grades       INTEGER[] NOT NULL DEFAULT '{}',
  UNIQUE (teacher_id, subject_code)
);

CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON public.teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_code      ON public.teacher_subjects(subject_code);

ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_subjects: via teacher school" ON public.teacher_subjects
  USING (
    teacher_id IN (
      SELECT t.id FROM public.teachers t
      JOIN public.schools s ON s.id = t.school_id
      WHERE s.user_id = auth.uid()
    )
  );

-- ── subject_allocations ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subject_allocations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id)  ON DELETE CASCADE,
  class_id         UUID NOT NULL REFERENCES public.classes(id)  ON DELETE CASCADE,
  subject_code     TEXT NOT NULL,
  lessons_per_week INTEGER NOT NULL,
  requires_double  BOOLEAN NOT NULL DEFAULT FALSE,
  teacher_id       UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  UNIQUE (class_id, subject_code)
);

CREATE INDEX IF NOT EXISTS idx_allocations_school_id ON public.subject_allocations(school_id);
CREATE INDEX IF NOT EXISTS idx_allocations_class_id  ON public.subject_allocations(class_id);
CREATE INDEX IF NOT EXISTS idx_allocations_teacher   ON public.subject_allocations(teacher_id);

ALTER TABLE public.subject_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allocations: school members only" ON public.subject_allocations
  USING (
    school_id IN (
      SELECT id FROM public.schools WHERE user_id = auth.uid()
    )
  );

-- ── Helper views (optional, for reporting) ───────────────────

-- View: allocation summary per class (total lessons, unassigned count)
CREATE OR REPLACE VIEW public.v_allocation_summary AS
SELECT
  sa.class_id,
  sa.school_id,
  COUNT(*)                                           AS subject_count,
  SUM(sa.lessons_per_week)                           AS total_lessons,
  COUNT(*) FILTER (WHERE sa.teacher_id IS NULL)      AS unassigned_count,
  COUNT(*) FILTER (WHERE sa.requires_double = TRUE)  AS double_count
FROM public.subject_allocations sa
GROUP BY sa.class_id, sa.school_id;

-- View: teacher load per school (total assigned lessons across all classes)
CREATE OR REPLACE VIEW public.v_teacher_load AS
SELECT
  sa.teacher_id,
  t.school_id,
  t.name                        AS teacher_name,
  t.max_lessons_week,
  SUM(sa.lessons_per_week)      AS allocated_lessons_week,
  COUNT(DISTINCT sa.class_id)   AS class_count
FROM public.subject_allocations sa
JOIN public.teachers t ON t.id = sa.teacher_id
WHERE sa.teacher_id IS NOT NULL
GROUP BY sa.teacher_id, t.school_id, t.name, t.max_lessons_week;
