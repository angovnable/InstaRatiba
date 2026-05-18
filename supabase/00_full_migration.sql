-- ============================================================
-- InstaRatiba — FIXED COMPLETE DATABASE MIGRATION
-- Reordered to resolve table dependency issues
-- ============================================================

-- ── Enable UUID extension ────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Storage bucket for school logos ─────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Authenticated upload own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'school-assets'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

CREATE POLICY "Public read school assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'school-assets');

-- ── Helper: auto-update updated_at ───────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$;

-- ============================================================
-- SCHOOLS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schools (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL CHECK (char_length(name) <= 80),
  county              TEXT NOT NULL,
  sub_county          TEXT,
  levels              TEXT[] NOT NULL DEFAULT '{}',
  motto               TEXT,
  nemis_code          TEXT CHECK (nemis_code ~ '^\d{7}$' OR nemis_code IS NULL),
  logo_url            TEXT,
  indigenous_language TEXT,
  academic_year       INT NOT NULL DEFAULT EXTRACT(YEAR FROM now())::INT,
  current_term        INT NOT NULL DEFAULT 1 CHECK (current_term IN (1,2,3)),
  climate_adjustment  BOOLEAN NOT NULL DEFAULT FALSE,
  meta                JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own school"
  ON public.schools
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- LEVEL TIMINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.level_timings (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id            UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  level                TEXT NOT NULL CHECK (level IN ('lower_primary','upper_primary','junior_secondary')),
  lesson_start         TEXT NOT NULL DEFAULT '08:20',
  lesson_duration_min  INT  NOT NULL DEFAULT 30,
  break1_after_lesson  INT  NOT NULL DEFAULT 2,
  break1_duration_min  INT  NOT NULL DEFAULT 10,
  break2_after_lesson  INT  NOT NULL DEFAULT 4,
  break2_duration_min  INT  NOT NULL DEFAULT 30,
  lunch_enabled        BOOLEAN NOT NULL DEFAULT FALSE,
  lunch_after_lesson   INT,
  lunch_duration_min   INT,
  non_formal_start     TEXT,
  non_formal_end       TEXT,
  UNIQUE (school_id, level)
);

ALTER TABLE public.level_timings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own timings"
  ON public.level_timings
  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

-- ============================================================
-- TEACHERS (full definition — before classes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teachers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id            UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  tsc_no               TEXT,
  email                TEXT,
  phone                TEXT,
  gender               TEXT CHECK (gender IN ('Male', 'Female')),
  max_lessons_day      INT NOT NULL DEFAULT 6,
  max_lessons_week     INT,
  max_consecutive      INT NOT NULL DEFAULT 3,
  min_free_periods_day INT DEFAULT 1,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON public.teachers(school_id);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teachers: school members only" ON public.teachers
  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

-- ============================================================
-- ROOMS (before classes — classes may reference rooms later)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id     UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  capacity      INT,
  subject_codes TEXT[] NOT NULL DEFAULT '{}',
  levels        TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE (school_id, name)
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rooms"
  ON public.rooms
  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

-- ============================================================
-- CLASSES (after teachers, since it references teachers.id)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  grade            INT  NOT NULL CHECK (grade BETWEEN 1 AND 9),
  stream           TEXT NOT NULL,
  class_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  size             INT,
  UNIQUE (school_id, grade, stream)
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own classes"
  ON public.classes
  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

-- ============================================================
-- TEACHER SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  grades       INT[] NOT NULL DEFAULT '{}',
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

-- ============================================================
-- SUBJECT ALLOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subject_allocations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id)  ON DELETE CASCADE,
  class_id         UUID NOT NULL REFERENCES public.classes(id)  ON DELETE CASCADE,
  subject_code     TEXT NOT NULL,
  lessons_per_week INT  NOT NULL,
  requires_double  BOOLEAN NOT NULL DEFAULT FALSE,
  teacher_id       UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  UNIQUE (class_id, subject_code)
);

CREATE INDEX IF NOT EXISTS idx_allocations_school_id ON public.subject_allocations(school_id);
CREATE INDEX IF NOT EXISTS idx_allocations_class_id  ON public.subject_allocations(class_id);
CREATE INDEX IF NOT EXISTS idx_allocations_teacher   ON public.subject_allocations(teacher_id);

ALTER TABLE public.subject_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allocations: school members only" ON public.subject_allocations
  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

-- ============================================================
-- HELPER VIEWS
-- ============================================================
CREATE OR REPLACE VIEW public.v_allocation_summary AS
SELECT
  sa.class_id,
  sa.school_id,
  COUNT(*)                                          AS subject_count,
  SUM(sa.lessons_per_week)                          AS total_lessons,
  COUNT(*) FILTER (WHERE sa.teacher_id IS NULL)     AS unassigned_count,
  COUNT(*) FILTER (WHERE sa.requires_double = TRUE) AS double_count
FROM public.subject_allocations sa
GROUP BY sa.class_id, sa.school_id;

CREATE OR REPLACE VIEW public.v_teacher_load AS
SELECT
  sa.teacher_id,
  t.school_id,
  t.name                      AS teacher_name,
  t.max_lessons_week,
  SUM(sa.lessons_per_week)    AS allocated_lessons_week,
  COUNT(DISTINCT sa.class_id) AS class_count
FROM public.subject_allocations sa
JOIN public.teachers t ON t.id = sa.teacher_id
WHERE sa.teacher_id IS NOT NULL
GROUP BY sa.teacher_id, t.school_id, t.name, t.max_lessons_week;

-- ============================================================
-- TIMETABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.timetables (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  term_id      TEXT NOT NULL,
  name         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','pending','published','archived')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at  TIMESTAMPTZ,
  approved_by  UUID REFERENCES auth.users(id)
);

ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timetable_school_owner"
  ON public.timetables
  USING (school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid()));

-- ============================================================
-- TIMETABLE SLOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.timetable_slots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id   UUID NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
  class_id       UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id     UUID REFERENCES public.teachers(id),
  subject_code   TEXT,
  room_id        UUID REFERENCES public.rooms(id),
  day            TEXT NOT NULL CHECK (day IN ('monday','tuesday','wednesday','thursday','friday')),
  slot_index     INT  NOT NULL,
  is_break       BOOLEAN NOT NULL DEFAULT FALSE,
  is_assembly    BOOLEAN NOT NULL DEFAULT FALSE,
  is_non_formal  BOOLEAN NOT NULL DEFAULT FALSE,
  is_ppi         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_slots_timetable ON public.timetable_slots(timetable_id);
CREATE INDEX IF NOT EXISTS idx_slots_class     ON public.timetable_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_slots_teacher   ON public.timetable_slots(teacher_id);

ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slots_via_timetable"
  ON public.timetable_slots
  USING (
    timetable_id IN (
      SELECT t.id FROM public.timetables t
      JOIN public.schools s ON s.id = t.school_id
      WHERE s.user_id = auth.uid()
    )
  );

-- ============================================================
-- TIMETABLE OVERRIDES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.timetable_overrides (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_slot_id   UUID NOT NULL REFERENCES public.timetable_slots(id) ON DELETE CASCADE,
  reason              TEXT NOT NULL,
  override_teacher_id UUID REFERENCES public.teachers(id),
  date                DATE NOT NULL
);

ALTER TABLE public.timetable_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "overrides_via_slot"
  ON public.timetable_overrides
  USING (
    timetable_slot_id IN (
      SELECT ts.id FROM public.timetable_slots ts
      JOIN public.timetables t ON t.id = ts.timetable_id
      JOIN public.schools    s ON s.id = t.school_id
      WHERE s.user_id = auth.uid()
    )
  );

-- ============================================================
-- TIMETABLE SHARE TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.timetable_share_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
  token        TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at   TIMESTAMPTZ
);

ALTER TABLE public.timetable_share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "share_token_owner"
  ON public.timetable_share_tokens
  USING (
    timetable_id IN (
      SELECT t.id FROM public.timetables t
      JOIN public.schools s ON s.id = t.school_id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "share_token_public_read"
  ON public.timetable_share_tokens
  FOR SELECT
  USING (revoked_at IS NULL);

-- ============================================================
-- CONFLICTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conflicts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  severity     TEXT NOT NULL CHECK (severity IN ('hard','soft')),
  description  TEXT NOT NULL,
  resolved     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_conflicts_timetable ON public.conflicts(timetable_id);

ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conflicts_via_timetable"
  ON public.conflicts
  USING (
    timetable_id IN (
      SELECT t.id FROM public.timetables t
      JOIN public.schools s ON s.id = t.school_id
      WHERE s.user_id = auth.uid()
    )
  );

-- ============================================================
-- APPROVAL COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.approval_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES auth.users(id),
  slot_id      UUID REFERENCES public.timetable_slots(id),
  comment      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.approval_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_comments_school"
  ON public.approval_comments
  USING (
    timetable_id IN (
      SELECT t.id FROM public.timetables t
      JOIN public.schools s ON s.id = t.school_id
      WHERE s.user_id = auth.uid()
    )
  );

-- ============================================================
-- DUTY ROSTER
-- ============================================================
CREATE TABLE IF NOT EXISTS public.duty_roster (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
  teacher_id   UUID NOT NULL REFERENCES public.teachers(id)   ON DELETE CASCADE,
  duty_type    TEXT NOT NULL CHECK (duty_type IN ('assembly','lunch','gate','morning_assembly','lunch_supervision','gate_duty')),
  day          TEXT NOT NULL CHECK (day IN ('Monday','Tuesday','Wednesday','Thursday','Friday','monday','tuesday','wednesday','thursday','friday')),
  UNIQUE (timetable_id, duty_type, day)
);

CREATE INDEX IF NOT EXISTS idx_duty_roster_timetable ON public.duty_roster(timetable_id);

ALTER TABLE public.duty_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duty_roster_select" ON public.duty_roster
  FOR SELECT USING (
    timetable_id IN (
      SELECT id FROM public.timetables
      WHERE school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "duty_roster_insert" ON public.duty_roster
  FOR INSERT WITH CHECK (
    timetable_id IN (
      SELECT id FROM public.timetables
      WHERE school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "duty_roster_delete" ON public.duty_roster
  FOR DELETE USING (
    timetable_id IN (
      SELECT id FROM public.timetables
      WHERE school_id IN (SELECT id FROM public.schools WHERE user_id = auth.uid())
    )
  );

-- ============================================================
-- ERROR LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.error_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES public.schools(id),
  component   TEXT NOT NULL,
  stack_trace TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "error_logs_insert"
  ON public.error_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- DONE
-- ============================================================