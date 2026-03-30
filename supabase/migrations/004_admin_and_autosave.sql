-- ============================================================
-- WASSCEPrep — Migration 004: Admin & Auto-save Tables
-- Adds:
--   1. mock_essay_autosave  — stores essay-in-progress every 60s
--   2. admin_reset_log      — audit trail for all admin resets
--   3. Additional columns on questions for essay management
--      (model_answer, keywords)
--   4. Additional columns on mock_exam_attempts for admin reset
--      (reset_reason, reset_at)
--   5. Additional columns on essay_answers for manual marking
--      (manually_marked_by, manually_marked_at)
-- ============================================================

-- ── 1. Mock Essay Auto-save Table ──────────────────────────
-- Stores essay answers in progress during mock exams every 60s.
-- On reconnect, the platform can restore from this table.
CREATE TABLE IF NOT EXISTS mock_essay_autosave (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject       TEXT NOT NULL,
  paper_number  INT NOT NULL,
  answers       JSONB NOT NULL DEFAULT '{}',
  saved_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Composite unique: one autosave record per user+subject+paper
  UNIQUE (user_id, subject, paper_number)
);

CREATE INDEX IF NOT EXISTS idx_autosave_user ON mock_essay_autosave(user_id, subject, paper_number);

ALTER TABLE mock_essay_autosave ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own autosave" ON mock_essay_autosave
  FOR ALL USING (auth.uid() = user_id);


-- ── 2. Admin Reset Log ─────────────────────────────────────
-- Audit trail for every admin reset action (mock attempts, AI limits).
CREATE TABLE IF NOT EXISTS admin_reset_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email   TEXT NOT NULL,
  action        TEXT NOT NULL,   -- e.g. 'mock_attempt_reset', 'ai_tutor_reset'
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_id     UUID,            -- optional: specific record ID (e.g. mock_exam_attempts.id)
  reason        TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_log_admin ON admin_reset_log(admin_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reset_log_target ON admin_reset_log(target_user_id, created_at DESC);

-- Admins only (RLS: no student access)
ALTER TABLE admin_reset_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only: reset log" ON admin_reset_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'content_manager')
    )
    OR auth.jwt() ->> 'email' = 'sirdeko2@gmail.com'
  );


-- ── 3. Additional columns on questions ─────────────────────
-- model_answer: for side-by-side display with student answer
-- keywords: JSON array of required keywords for rubric auto-scoring
ALTER TABLE questions ADD COLUMN IF NOT EXISTS model_answer TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS keywords TEXT;  -- JSON array stored as text


-- ── 4. Additional columns on mock_exam_attempts ────────────
-- reset_reason: admin-entered reason when resetting a daily attempt
-- reset_at: timestamp of the reset
ALTER TABLE mock_exam_attempts ADD COLUMN IF NOT EXISTS reset_reason TEXT;
ALTER TABLE mock_exam_attempts ADD COLUMN IF NOT EXISTS reset_at TIMESTAMPTZ;


-- ── 5. Additional columns on essay_answers ─────────────────
-- manually_marked_by: email of admin/teacher who marked
-- manually_marked_at: timestamp of manual marking
ALTER TABLE essay_answers ADD COLUMN IF NOT EXISTS manually_marked_by TEXT;
ALTER TABLE essay_answers ADD COLUMN IF NOT EXISTS manually_marked_at TIMESTAMPTZ;


-- ── 6. Index on quiz_sessions for daily free-user limit ────
-- Used to count how many practice questions a free user has answered today
CREATE INDEX IF NOT EXISTS idx_sessions_user_mode_date
  ON quiz_sessions(user_id, mode, created_at DESC);
