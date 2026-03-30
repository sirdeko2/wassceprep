-- ============================================================
-- WASSCEPrep — Mock Exam MCQ Auto-save Table
-- Stores in-progress MCQ state every 60 seconds during mock
-- exams so students can recover from connection loss.
-- Spec requirement (section 3.6): answers-in-progress must be
-- auto-saved every 60 seconds; on reconnect, timer resumes
-- from where it left off.
-- ============================================================

CREATE TABLE IF NOT EXISTS mock_mcq_autosave (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  paper_number    INT NOT NULL DEFAULT 1,
  current_index   INT NOT NULL DEFAULT 0,    -- which question the student is on
  time_left       INT NOT NULL DEFAULT 0,    -- seconds remaining on the timer
  answers         JSONB NOT NULL DEFAULT '{}', -- {question_id: selected_option_index}
  score_so_far    INT NOT NULL DEFAULT 0,
  saved_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject, paper_number)
);

ALTER TABLE mock_mcq_autosave ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own MCQ autosave" ON mock_mcq_autosave
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mcq_autosave_user ON mock_mcq_autosave(user_id, subject, paper_number);
