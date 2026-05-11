-- ============================================================
-- InstaRatiba — Segment 9 Supabase Migration
-- New tables: duty_roster  |  schools.meta column
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- ── 1. duty_roster ───────────────────────────────────────────
-- Already referenced in §6.3 DB Schema:
--   duty_roster: id, timetable_id, teacher_id, duty_type, day

CREATE TABLE IF NOT EXISTS duty_roster (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id  UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  teacher_id    UUID NOT NULL REFERENCES teachers(id)   ON DELETE CASCADE,
  duty_type     TEXT NOT NULL CHECK (duty_type IN ('assembly', 'lunch', 'gate')),
  day           TEXT NOT NULL CHECK (day IN ('Monday','Tuesday','Wednesday','Thursday','Friday')),
  UNIQUE (timetable_id, duty_type, day)
);

-- RLS: users can only read/write duty rosters for their own school's timetables
ALTER TABLE duty_roster ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duty_roster_select" ON duty_roster
  FOR SELECT USING (
    timetable_id IN (
      SELECT id FROM timetables
      WHERE school_id IN (SELECT id FROM schools WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "duty_roster_insert" ON duty_roster
  FOR INSERT WITH CHECK (
    timetable_id IN (
      SELECT id FROM timetables
      WHERE school_id IN (SELECT id FROM schools WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "duty_roster_delete" ON duty_roster
  FOR DELETE USING (
    timetable_id IN (
      SELECT id FROM timetables
      WHERE school_id IN (SELECT id FROM schools WHERE user_id = auth.uid())
    )
  );

-- ── 2. schools.meta column (social links + WhatsApp numbers) ──
-- Stores: { facebook, instagram, twitter, linkedin,
--           whatsapp_school, whatsapp_support }

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schools' AND column_name = 'meta'
  ) THEN
    ALTER TABLE schools ADD COLUMN meta JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- ── 3. Index for duty_roster queries ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_duty_roster_timetable
  ON duty_roster (timetable_id);

-- ── 4. Supabase Storage bucket for school assets ─────────────
-- Run this once in the Supabase Dashboard > Storage, or via API:
-- Bucket name: "school-assets", public: true
-- Policy: authenticated users can upload to logos/{school_id}.*

-- ── Done ─────────────────────────────────────────────────────
-- After running this migration:
-- 1. Create the "school-assets" Storage bucket (public) in Supabase Dashboard
-- 2. Add Storage policy: allow authenticated uploads to school-assets/logos/**
-- 3. Deploy updated App.tsx + feature files from instaratiba_s9/
