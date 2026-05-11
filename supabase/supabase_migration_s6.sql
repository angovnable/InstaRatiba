-- ============================================================
-- InstaRatiba — Segment 6 Supabase Migration
-- Tables: timetables, timetable_slots, timetable_overrides,
--         timetable_share_tokens, conflicts, approval_comments,
--         duty_roster, error_logs
-- ============================================================

-- ── Timetables ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS timetables (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  term_id      TEXT NOT NULL,          -- references academic_terms.id (added in S9)
  name         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','pending','published','archived')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at  TIMESTAMPTZ,
  approved_by  UUID REFERENCES auth.users(id)
);

ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timetable_school_owner"
  ON timetables
  USING (
    school_id IN (
      SELECT id FROM schools WHERE user_id = auth.uid()
    )
  );

-- ── Timetable Slots ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS timetable_slots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id   UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  class_id       UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id     UUID REFERENCES teachers(id),
  subject_code   TEXT,
  room_id        UUID REFERENCES rooms(id),
  day            TEXT NOT NULL
                   CHECK (day IN ('monday','tuesday','wednesday','thursday','friday')),
  slot_index     INT  NOT NULL,
  is_break       BOOLEAN NOT NULL DEFAULT false,
  is_assembly    BOOLEAN NOT NULL DEFAULT false,
  is_non_formal  BOOLEAN NOT NULL DEFAULT false,
  is_ppi         BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_slots_timetable ON timetable_slots(timetable_id);
CREATE INDEX IF NOT EXISTS idx_slots_class     ON timetable_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_slots_teacher   ON timetable_slots(teacher_id);

ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slots_via_timetable"
  ON timetable_slots
  USING (
    timetable_id IN (
      SELECT t.id FROM timetables t
      JOIN schools s ON s.id = t.school_id
      WHERE s.user_id = auth.uid()
    )
  );

-- ── Timetable Overrides ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS timetable_overrides (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_slot_id    UUID NOT NULL REFERENCES timetable_slots(id) ON DELETE CASCADE,
  reason               TEXT NOT NULL,
  override_teacher_id  UUID REFERENCES teachers(id),
  date                 DATE NOT NULL
);

ALTER TABLE timetable_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "overrides_via_slot"
  ON timetable_overrides
  USING (
    timetable_slot_id IN (
      SELECT ts.id FROM timetable_slots ts
      JOIN timetables t  ON t.id  = ts.timetable_id
      JOIN schools    s  ON s.id  = t.school_id
      WHERE s.user_id = auth.uid()
    )
  );

-- ── Timetable Share Tokens ───────────────────────────────────

CREATE TABLE IF NOT EXISTS timetable_share_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id  UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  token         TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ
);

-- Public read: anyone with a valid, non-revoked token can read the timetable
ALTER TABLE timetable_share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "share_token_owner"
  ON timetable_share_tokens
  USING (
    timetable_id IN (
      SELECT t.id FROM timetables t
      JOIN schools s ON s.id = t.school_id
      WHERE s.user_id = auth.uid()
    )
  );

-- Allow public read for the shared timetable viewer (no auth required)
CREATE POLICY "share_token_public_read"
  ON timetable_share_tokens
  FOR SELECT
  USING (revoked_at IS NULL);

-- ── Conflicts ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conflicts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id  UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  severity      TEXT NOT NULL CHECK (severity IN ('hard','soft')),
  description   TEXT NOT NULL,
  resolved      BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_conflicts_timetable ON conflicts(timetable_id);

ALTER TABLE conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conflicts_via_timetable"
  ON conflicts
  USING (
    timetable_id IN (
      SELECT t.id FROM timetables t
      JOIN schools s ON s.id = t.school_id
      WHERE s.user_id = auth.uid()
    )
  );

-- ── Approval Comments ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS approval_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id  UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES auth.users(id),
  slot_id       UUID REFERENCES timetable_slots(id),
  comment       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE approval_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_comments_school"
  ON approval_comments
  USING (
    timetable_id IN (
      SELECT t.id FROM timetables t
      JOIN schools s ON s.id = t.school_id
      WHERE s.user_id = auth.uid()
    )
  );

-- ── Duty Roster ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS duty_roster (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id  UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  teacher_id    UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  duty_type     TEXT NOT NULL
                  CHECK (duty_type IN ('morning_assembly','lunch_supervision','gate_duty')),
  day           TEXT NOT NULL
                  CHECK (day IN ('monday','tuesday','wednesday','thursday','friday'))
);

ALTER TABLE duty_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duty_roster_school"
  ON duty_roster
  USING (
    timetable_id IN (
      SELECT t.id FROM timetables t
      JOIN schools s ON s.id = t.school_id
      WHERE s.user_id = auth.uid()
    )
  );

-- ── Error Logs ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS error_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id   UUID REFERENCES schools(id),
  component   TEXT NOT NULL,
  stack_trace TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Error logs: authenticated users can insert; no read RLS (admin only via dashboard)
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "error_logs_insert"
  ON error_logs
  FOR INSERT
  WITH CHECK (true);   -- any authenticated user may insert crash reports
