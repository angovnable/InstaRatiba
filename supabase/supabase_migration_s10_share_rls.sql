-- ============================================================
-- InstaRatiba — Migration S10 patch
-- Public (unauthenticated) read access for shared timetable view
-- Fixes Issue #16: share link RLS policy missing for timetables/slots
-- ============================================================

-- Allow unauthenticated users to read timetables that have a valid, non-revoked share token
CREATE POLICY "timetable_public_read_via_share_token"
  ON timetables
  FOR SELECT
  USING (
    id IN (
      SELECT timetable_id
      FROM timetable_share_tokens
      WHERE revoked_at IS NULL
    )
  );

-- Allow unauthenticated users to read slots for timetables with a valid share token
CREATE POLICY "slots_public_read_via_share_token"
  ON timetable_slots
  FOR SELECT
  USING (
    timetable_id IN (
      SELECT timetable_id
      FROM timetable_share_tokens
      WHERE revoked_at IS NULL
    )
  );

-- Note: timetable_share_tokens already has the "share_token_public_read" policy
-- (SELECT WHERE revoked_at IS NULL) added in the full migration.
-- These two new policies complete the chain so SharedTimetableView.tsx can
-- query both tables without authentication errors.
