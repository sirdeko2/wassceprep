-- ============================================================
-- WASSCEPrep — Migration 010: Production Hardening
-- Closes security gaps and adds DB constraints needed for
-- safe production deployment.
-- Run AFTER all previous migrations.
-- ============================================================


-- ── 1. AI Tutor Usage: lock to server-side inserts only ─────
-- chat.js uses the service role key (bypasses RLS), so it can
-- always INSERT. Removing the client-side INSERT policy prevents
-- a student from injecting fake usage records to manipulate
-- rate-limit history.
DROP POLICY IF EXISTS "Users can insert own tutor usage" ON ai_tutor_usage;

-- SELECT policy stays — users can check their own usage count.


-- ── 2. Questions: add admin UPDATE and DELETE policies ───────
-- Migration 001 only added INSERT for admin.
-- Without UPDATE/DELETE, admins cannot edit or remove questions
-- via the AdminPage UI.

CREATE POLICY "Admins can update questions"
  ON questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'content_manager')
    )
    OR auth.jwt() ->> 'email' = 'sirdeko2@gmail.com'
  );

CREATE POLICY "Admins can delete questions"
  ON questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'content_manager')
    )
    OR auth.jwt() ->> 'email' = 'sirdeko2@gmail.com'
  );


-- ── 3. Mock Exam Attempts: enforce once-per-day at DB level ──
-- The app already checks in code, but adding a DB-level unique
-- constraint means it's impossible to insert a second attempt
-- even if the app logic has a race condition.
--
-- We use an attempt_date column (DATE) so the constraint is
-- per calendar day (Liberian timezone — adjust as needed).

ALTER TABLE mock_exam_attempts
  ADD COLUMN IF NOT EXISTS attempt_date DATE
    GENERATED ALWAYS AS (started_at::DATE) STORED;

-- Unique constraint: one attempt per user + subject + day
-- We use IF NOT EXISTS via a DO block to avoid errors on re-run.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_mock_attempt_per_day'
  ) THEN
    ALTER TABLE mock_exam_attempts
      ADD CONSTRAINT uq_mock_attempt_per_day
      UNIQUE (user_id, subject, attempt_date);
  END IF;
END $$;

-- Fast lookup index for "did user already attempt today?"
CREATE INDEX IF NOT EXISTS idx_mock_attempts_date
  ON mock_exam_attempts(user_id, subject, attempt_date DESC);


-- ── 4. Quiz Sessions: additional indexes ─────────────────────
-- Progress page queries by user + subject + date.
-- These compound indexes cut query time for students with many sessions.

CREATE INDEX IF NOT EXISTS idx_sessions_subject_date
  ON quiz_sessions(user_id, subject, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_mode_date
  ON quiz_sessions(user_id, mode, created_at DESC);


-- ── 5. Subscription expiry helper function ───────────────────
-- Marks paid subscriptions as 'expired' once paid_until has passed.
-- Call this from a Supabase cron job (pg_cron) or Edge Function
-- scheduled to run daily at midnight.
--
-- Example pg_cron schedule (add in Supabase Dashboard > SQL Editor):
--   SELECT cron.schedule('expire-subs', '0 0 * * *', 'SELECT expire_subscriptions()');

CREATE OR REPLACE FUNCTION expire_subscriptions()
RETURNS INT AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE subscriptions
  SET    status     = 'expired',
         updated_at = NOW()
  WHERE  plan    = 'paid'
    AND  status  = 'active'
    AND  paid_until < NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role only
REVOKE ALL ON FUNCTION expire_subscriptions() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION expire_subscriptions() TO service_role;


-- ── 6. Confirm RLS is enabled on all critical tables ─────────
-- These are idempotent — safe to run even if already enabled.
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_usage    ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_papers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments          ENABLE ROW LEVEL SECURITY;


-- ── 7. profiles: add role column if missing ──────────────────
-- The admin policies in migrations 004 and this file reference
-- profiles.role. Ensure the column exists with a safe default.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('student', 'admin', 'content_manager'));

-- Index to speed up admin role lookups in RLS policies
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles(role)
  WHERE role != 'student';  -- partial index: only non-students


-- ── Verification query (run manually to confirm) ─────────────
-- SELECT schemaname, tablename, rowsecurity
-- FROM   pg_tables
-- WHERE  schemaname = 'public'
-- ORDER BY tablename;
