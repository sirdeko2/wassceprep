-- ============================================================
-- Legacy Tech WASSCEPrep — Supabase Database Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ─────────────────────────────────────────
-- 1. PROFILES
--    Extends Supabase auth.users with extra info
-- ─────────────────────────────────────────
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  county          TEXT,
  school          TEXT,
  streak_days     INT DEFAULT 1,
  last_active     DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, county)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'county'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─────────────────────────────────────────
-- 2. QUESTIONS
--    The core question bank
-- ─────────────────────────────────────────
CREATE TABLE questions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject               TEXT NOT NULL,
  topic                 TEXT,                          -- e.g. "Algebra", "Photosynthesis"
  year                  INT,                           -- WAEC exam year e.g. 2022
  question_text         TEXT NOT NULL,
  options               JSONB NOT NULL,                -- ["Option A", "Option B", "Option C", "Option D"]
  correct_answer_index  INT NOT NULL CHECK (correct_answer_index BETWEEN 0 AND 3),
  explanation           TEXT,                          -- Why the answer is correct
  difficulty            TEXT DEFAULT 'medium'
                          CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast subject queries
CREATE INDEX idx_questions_subject ON questions(subject);
CREATE INDEX idx_questions_active  ON questions(subject, is_active);


-- ─────────────────────────────────────────
-- 3. QUIZ SESSIONS
--    Every completed quiz is saved here
-- ─────────────────────────────────────────
CREATE TABLE quiz_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject           TEXT NOT NULL,
  mode              TEXT DEFAULT 'practice' CHECK (mode IN ('practice', 'mock')),
  correct_answers   INT NOT NULL,
  total_questions   INT NOT NULL,
  score_pct         INT NOT NULL CHECK (score_pct BETWEEN 0 AND 100),
  time_taken_secs   INT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user progress queries
CREATE INDEX idx_sessions_user    ON quiz_sessions(user_id);
CREATE INDEX idx_sessions_subject ON quiz_sessions(user_id, subject);


-- ─────────────────────────────────────────
-- 4. CHAT HISTORY (optional)
--    Save AI tutor conversations per user
-- ─────────────────────────────────────────
CREATE TABLE chat_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject     TEXT,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_user ON chat_history(user_id, created_at DESC);


-- ─────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
--    Ensures users can only see their own data
-- ─────────────────────────────────────────

-- Profiles: users can only read/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);


-- Questions: everyone can read active questions (no login required to browse)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active questions"
  ON questions FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Only admins can insert questions"
  ON questions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');


-- Quiz sessions: users can only read/write their own sessions
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON quiz_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON quiz_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);


-- Chat history: users can only see their own chat
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat"
  ON chat_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat"
  ON chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────
-- 6. SAMPLE QUESTIONS (Mathematics)
--    Paste more questions following this pattern
-- ─────────────────────────────────────────
INSERT INTO questions (subject, topic, year, question_text, options, correct_answer_index, explanation, difficulty) VALUES

('Mathematics', 'Algebra', 2022,
 'If 2x + 5 = 17, what is the value of x?',
 '["4", "5", "6", "7"]', 2,
 'Subtract 5 from both sides: 2x = 12. Divide by 2: x = 6.', 'easy'),

('Mathematics', 'Geometry', 2021,
 'What is the area of a circle with radius 7 cm? (Take π = 22/7)',
 '["154 cm²", "144 cm²", "132 cm²", "176 cm²"]', 0,
 'Area = πr² = (22/7) × 7 × 7 = 22 × 7 = 154 cm².', 'medium'),

('Mathematics', 'Algebra', 2020,
 'Simplify: 3(2x − 4) + 2(x + 5)',
 '["8x − 2", "8x + 2", "6x − 2", "8x − 12"]', 0,
 '3(2x−4) = 6x−12 and 2(x+5) = 2x+10. Adding gives 8x − 2.', 'medium'),

('Mathematics', 'Number', 2022,
 'What is 15% of 200?',
 '["25", "30", "35", "20"]', 1,
 '15% of 200 = (15/100) × 200 = 30.', 'easy'),

('Mathematics', 'Algebra', 2021,
 'What is the gradient of the line y = 3x + 7?',
 '["7", "3", "3x", "10"]', 1,
 'In y = mx + c, m is the gradient. Here m = 3.', 'easy'),

('Biology', 'Cell Biology', 2022,
 'Which organelle is known as the powerhouse of the cell?',
 '["Nucleus", "Ribosome", "Mitochondria", "Chloroplast"]', 2,
 'The mitochondria produces ATP through cellular respiration, providing energy for cell activities.', 'easy'),

('Biology', 'Photosynthesis', 2021,
 'What is the process by which plants make food using sunlight?',
 '["Respiration", "Photosynthesis", "Transpiration", "Osmosis"]', 1,
 'Photosynthesis: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂.', 'easy'),

('English Language', 'Grammar', 2022,
 'Choose the correct sentence:',
 '["She do not know the answer", "She does not know the answer", "She not know the answer", "She did not know the answer"]', 1,
 'With third person singular (she/he/it), we use does not plus the base verb.', 'easy'),
 
('English Language', 'Vocabulary', 2021,
 'What is a synonym for "abundant"?',
 '["Scarce", "Plentiful", "Empty", "Rare"]', 1,
 '"Abundant" means existing in large quantities. "Plentiful" is a direct synonym.', 'easy'),

('Chemistry', 'Periodic Table', 2022,
 'What is the chemical symbol for Gold?',
 '["Go", "Gd", "Au", "Ag"]', 2,
 'Gold''s symbol Au comes from the Latin word "Aurum".', 'easy'),

('Chemistry', 'Acids and Bases', 2021,
 'What is the pH of pure water?',
 '["0", "5", "7", "14"]', 2,
 'Pure water has a pH of 7, which is neutral — neither acidic (pH < 7) nor alkaline (pH > 7).', 'easy'),

('Physics', 'Forces', 2022,
 'What is the SI unit of force?',
 '["Watt", "Joule", "Newton", "Pascal"]', 2,
 'The Newton (N) is the SI unit of force. 1 N = 1 kg·m/s². Named after Sir Isaac Newton.', 'easy'),

('Physics', 'Motion', 2021,
 'Which law states that every action has an equal and opposite reaction?',
 '["First law of motion", "Second law of motion", "Third law of motion", "Law of gravitation"]', 2,
 'Newton''s Third Law: For every action, there is an equal and opposite reaction.', 'easy'),

('Economics', 'Macroeconomics', 2022,
 'What does GDP stand for?',
 '["Gross Domestic Product", "General Domestic Production", "Gross Development Plan", "General Development Product"]', 0,
 'GDP (Gross Domestic Product) is the total monetary value of all goods and services produced within a country in a given period.', 'easy'),

('Economics', 'Microeconomics', 2021,
 'What is opportunity cost?',
 '["The cost of an opportunity", "The value of the next best alternative foregone", "The price of a good", "The cost of production"]', 1,
 'Opportunity cost is the value of the next best alternative you give up when making a choice.', 'medium'),

('Geography', 'Physical Geography', 2022,
 'What is the longest river in Africa?',
 '["Congo River", "Zambezi River", "Niger River", "Nile River"]', 3,
 'The Nile River, at approximately 6,650 km, is the longest river in Africa.', 'easy'),

('Geography', 'Liberia', 2021,
 'The capital city of Liberia is:',
 '["Buchanan", "Monrovia", "Gbarnga", "Harper"]', 1,
 'Monrovia is the capital and largest city of Liberia, named after U.S. President James Monroe.', 'easy'),

('Literature', 'Literary Devices', 2022,
 'What is a protagonist in a story?',
 '["The main villain", "The narrator", "The main character", "A minor character"]', 2,
 'The protagonist is the main character of a story, around whom the central conflict revolves.', 'easy'),

('Literature', 'African Literature', 2021,
 'Which author wrote "Things Fall Apart"?',
 '["Wole Soyinka", "Chinua Achebe", "Ngugi wa Thiong''o", "Chimamanda Adichie"]', 1,
 'Things Fall Apart (1958) was written by Chinua Achebe of Nigeria. It is the most widely read novel in African literature.', 'easy');
