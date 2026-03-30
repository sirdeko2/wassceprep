-- ============================================================
-- WASSCEPrep — Platform Upgrade Migration
-- Run this AFTER 001_initial_schema.sql
-- ============================================================

-- ─────────────────────────────────────────
-- 1. PAST PAPERS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS past_papers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          TEXT NOT NULL,
  year             INT NOT NULL,
  paper_number     INT NOT NULL CHECK (paper_number BETWEEN 1 AND 3),
  title            TEXT,
  description      TEXT,
  file_url         TEXT,
  mark_scheme_url  TEXT,
  visibility       TEXT DEFAULT 'draft' CHECK (visibility IN ('draft', 'published', 'deleted')),
  region_tag       TEXT DEFAULT 'Liberia',
  file_size        BIGINT,
  uploader_id      UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_past_papers_subject ON past_papers(subject);
CREATE INDEX IF NOT EXISTS idx_past_papers_year    ON past_papers(year);

ALTER TABLE past_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view published papers"
  ON past_papers FOR SELECT USING (visibility = 'published');

-- ─────────────────────────────────────────
-- 2. AI TUTOR USAGE RATE LIMITING
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_tutor_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_text TEXT,
  subject       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutor_usage_user ON ai_tutor_usage(user_id, created_at DESC);

ALTER TABLE ai_tutor_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tutor usage"
  ON ai_tutor_usage FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tutor usage"
  ON ai_tutor_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 3. MOCK EXAM ATTEMPTS (once-per-day tracking)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mock_exam_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  status          TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  reset_by_admin  UUID REFERENCES profiles(id),
  reset_reason    TEXT,
  reset_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mock_attempts_user ON mock_exam_attempts(user_id, subject, started_at DESC);

ALTER TABLE mock_exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON mock_exam_attempts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON mock_exam_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 4. USER SUBSCRIPTIONS (freemium model)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  plan            TEXT DEFAULT 'free' CHECK (plan IN ('free', 'trial', 'paid')),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  trial_ends_at   TIMESTAMPTZ,
  paid_until      TIMESTAMPTZ,
  payment_ref     TEXT,
  mobile_number   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Auto-create free subscription on signup
CREATE OR REPLACE FUNCTION handle_new_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_subscription();

-- ─────────────────────────────────────────
-- 5. ADD PAPER COLUMN TO QUIZ SESSIONS
-- ─────────────────────────────────────────
ALTER TABLE quiz_sessions
  ADD COLUMN IF NOT EXISTS paper_number INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS answers_json JSONB;

-- ─────────────────────────────────────────
-- 6. ADDITIONAL QUESTIONS — ALL 8 SUBJECTS
--    25 questions per subject (Paper 1 MCQ)
-- ─────────────────────────────────────────

-- MATHEMATICS (additional questions beyond existing 5)
INSERT INTO questions (subject, topic, year, question_text, options, correct_answer_index, explanation, difficulty) VALUES

('Mathematics', 'Probability', 2022,
 'A bag contains 4 red, 3 blue and 5 green balls. What is the probability of picking a blue ball?',
 '["1/3", "1/4", "3/12", "3/4"]', 1,
 'Total balls = 4+3+5 = 12. P(blue) = 3/12 = 1/4.', 'medium'),

('Mathematics', 'Statistics', 2021,
 'The median of 3, 7, 9, 12, 15 is:',
 '["7", "9", "12", "10"]', 1,
 'With 5 values in ascending order, the median is the 3rd value = 9.', 'easy'),

('Mathematics', 'Number Bases', 2020,
 'Convert 25 (base 10) to base 2:',
 '["10101", "11001", "11010", "10011"]', 1,
 '25 ÷ 2 = 12 r1, 12 ÷ 2 = 6 r0, 6 ÷ 2 = 3 r0, 3 ÷ 2 = 1 r1, 1 ÷ 2 = 0 r1. Reading remainders upward: 11001.', 'hard'),

('Mathematics', 'Sets', 2022,
 'If n(A) = 15, n(B) = 10 and n(A∪B) = 20, find n(A∩B):',
 '["5", "25", "10", "15"]', 0,
 'n(A∪B) = n(A) + n(B) - n(A∩B) → 20 = 15 + 10 - n(A∩B) → n(A∩B) = 5.', 'medium'),

('Mathematics', 'Trigonometry', 2021,
 'In a right-angled triangle, tan θ = 3/4. Find sin θ:',
 '["4/5", "3/5", "3/4", "5/3"]', 1,
 'If opposite = 3, adjacent = 4, then hypotenuse = √(9+16) = 5. sin θ = opposite/hypotenuse = 3/5.', 'hard'),

('Mathematics', 'Linear Programming', 2022,
 'The maximum value of 2x + 3y subject to x ≥ 0, y ≥ 0 and x + y ≤ 4 is:',
 '["8", "12", "10", "6"]', 1,
 'Maximum is at corner point (0, 4): 2(0) + 3(4) = 12.', 'hard'),

('Mathematics', 'Mensuration', 2020,
 'The total surface area of a cube of side 5 cm is:',
 '["25 cm²", "125 cm²", "150 cm²", "75 cm²"]', 2,
 'TSA of cube = 6s² = 6 × 5² = 6 × 25 = 150 cm².', 'easy'),

('Mathematics', 'Coordinate Geometry', 2021,
 'The midpoint of the line joining (2, 4) and (6, 8) is:',
 '["(4, 6)", "(3, 5)", "(8, 12)", "(4, 4)"]', 0,
 'Midpoint = ((x₁+x₂)/2, (y₁+y₂)/2) = ((2+6)/2, (4+8)/2) = (4, 6).', 'easy'),

('Mathematics', 'Algebra', 2019,
 'If f(x) = 2x² - 3x + 1, find f(2):',
 '["3", "5", "7", "1"]', 0,
 'f(2) = 2(4) - 3(2) + 1 = 8 - 6 + 1 = 3.', 'medium'),

('Mathematics', 'Graphs', 2022,
 'Which of these is the equation of a line parallel to y = 2x + 5?',
 '["y = -2x + 3", "y = 2x - 7", "y = ½x + 5", "y = -½x + 2"]', 1,
 'Parallel lines have the same gradient. y = 2x - 7 has gradient 2, same as y = 2x + 5.', 'medium'),

-- ENGLISH LANGUAGE (additional)
('English Language', 'Grammar', 2022,
 'Which sentence contains a gerund?',
 '["She sings beautifully.", "Swimming is her hobby.", "She is swimming.", "They swam across."]', 1,
 'A gerund is a verb form used as a noun, ending in -ing. "Swimming" is the subject of the sentence, so it is a gerund.', 'hard'),

('English Language', 'Comprehension', 2020,
 'A word that has the same or nearly the same meaning as another word is called:',
 '["Antonym", "Homonym", "Synonym", "Acronym"]', 2,
 'A synonym is a word that means the same or nearly the same as another word.', 'easy'),

('English Language', 'Vocabulary', 2021,
 'The word "perspicacious" means:',
 '["Stubborn", "Having a ready insight", "Very wealthy", "Easily frightened"]', 1,
 '"Perspicacious" means having a ready understanding of things; shrewd or insightful.', 'hard'),

('English Language', 'Grammar', 2019,
 'Choose the correct sentence:',
 '["Between you and I, she is wrong.", "Between you and me, she is wrong.", "Between you and myself, she is wrong.", "Between I and you, she is wrong."]', 1,
 '"Between" is a preposition and takes the object pronoun "me", not the subject pronoun "I".', 'medium'),

('English Language', 'Phonetics', 2022,
 'Which pair of words rhymes?',
 '["Though / Tough", "Cough / Rough", "Dough / Though", "Bough / Dough"]', 2,
 '"Dough" and "Though" both end with the /oʊ/ sound, making them rhyme.', 'medium'),

('English Language', 'Tenses', 2021,
 'The sentence "By 2030, they will have built the bridge" uses which tense?',
 '["Simple Future", "Future Continuous", "Future Perfect", "Present Perfect"]', 2,
 '"Will have built" is the future perfect tense — an action that will be completed at a future point.', 'hard'),

('English Language', 'Idioms', 2020,
 '"A storm in a teacup" means:',
 '["Very bad weather", "A lot of fuss over something trivial", "Making tea in a storm", "A small problem getting bigger"]', 1,
 'This idiom describes a situation where people are very upset about something that is not really important.', 'medium'),

('English Language', 'Grammar', 2022,
 'Identify the adverb in: "She spoke quietly to the frightened child."',
 '["She", "Spoke", "Quietly", "Frightened"]', 2,
 '"Quietly" is an adverb modifying the verb "spoke" — it tells us how she spoke.', 'easy'),

('English Language', 'Vocabulary', 2019,
 'Choose the word that correctly completes the sentence: "The scientist made a ___ discovery that changed medicine."',
 '["Landmark", "Mediocre", "Subtle", "Routine"]', 0,
 '"Landmark" means an important discovery or achievement — it fits the context of changing medicine.', 'medium'),

('English Language', 'Summary', 2021,
 'In a summary, you should:',
 '["Copy exact sentences from the original", "Add your own opinions freely", "Express the main ideas in your own words", "Include all the details of the original"]', 2,
 'A summary requires expressing the main ideas briefly in your own words. Copying or adding opinions is not allowed.', 'easy'),

-- BIOLOGY
('Biology', 'Genetics', 2022,
 'Which of the following correctly represents the genotype of a homozygous dominant individual?',
 '["Aa", "aa", "AA", "aA"]', 2,
 '"AA" represents homozygous dominant — both alleles are the same dominant allele.', 'medium'),

('Biology', 'Ecology', 2021,
 'The relationship between a clownfish and a sea anemone is best described as:',
 '["Parasitism", "Competition", "Mutualism", "Predation"]', 2,
 'Mutualism: both organisms benefit. The clownfish gets shelter; the anemone gets cleaned and protected from predators.', 'medium'),

('Biology', 'Nutrition', 2022,
 'Which nutrient is the main source of energy in the body?',
 '["Proteins", "Fats", "Carbohydrates", "Vitamins"]', 2,
 'Carbohydrates are the body\'s preferred and most immediate source of energy, broken down to glucose.', 'easy'),

('Biology', 'Human Biology', 2020,
 'The organ responsible for filtering blood and producing urine is the:',
 '["Liver", "Kidney", "Pancreas", "Spleen"]', 1,
 'The kidneys filter waste products from the blood and produce urine, which is then excreted.', 'easy'),

('Biology', 'Reproduction', 2021,
 'Fertilisation in humans occurs in the:',
 '["Uterus", "Ovary", "Fallopian tube", "Cervix"]', 2,
 'Fertilisation (union of sperm and egg) takes place in the fallopian tube (oviduct).', 'medium'),

('Biology', 'Cell Biology', 2022,
 'Which structure controls what enters and leaves the cell?',
 '["Cell wall", "Cell membrane", "Nucleus", "Cytoplasm"]', 1,
 'The cell membrane (plasma membrane) is selectively permeable and regulates the movement of substances in and out of the cell.', 'easy'),

('Biology', 'Classification', 2020,
 'Organisms in the same genus are more closely related than organisms in the same:',
 '["Species", "Family", "Phylum", "Order"]', 2,
 'The classification hierarchy from specific to general is: Species → Genus → Family → Order → Class → Phylum → Kingdom. Phylum is broader (less closely related) than genus.', 'hard'),

('Biology', 'Photosynthesis', 2022,
 'Which gas is released during photosynthesis?',
 '["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"]', 2,
 'Photosynthesis produces oxygen (O₂) as a byproduct when water molecules are split during the light-dependent reactions.', 'easy'),

('Biology', 'Evolution', 2021,
 'The theory of evolution by natural selection was proposed by:',
 '["Gregor Mendel", "Louis Pasteur", "Charles Darwin", "Alexander Fleming"]', 2,
 'Charles Darwin proposed the theory of evolution by natural selection in his 1859 work "On the Origin of Species".', 'easy'),

('Biology', 'Ecology', 2019,
 'A food chain always begins with a:',
 '["Carnivore", "Herbivore", "Producer", "Decomposer"]', 2,
 'Food chains begin with producers (plants/algae) that make their own food through photosynthesis.', 'easy'),

-- CHEMISTRY
('Chemistry', 'Atomic Structure', 2022,
 'The atomic number of an element is equal to the number of:',
 '["Neutrons in the nucleus", "Protons in the nucleus", "Electrons in the outer shell", "Nucleons in the nucleus"]', 1,
 'The atomic number = number of protons in the nucleus (and also the number of electrons in a neutral atom).', 'easy'),

('Chemistry', 'Chemical Bonding', 2021,
 'Ionic bonds are formed by:',
 '["Sharing of electrons", "Transfer of electrons", "Sharing of protons", "Transfer of protons"]', 1,
 'Ionic bonds form when one atom transfers electrons to another, creating oppositely charged ions that attract each other.', 'easy'),

('Chemistry', 'Organic Chemistry', 2022,
 'The general formula for alkanes is:',
 '["CₙH₂ₙ", "CₙH₂ₙ₊₂", "CₙH₂ₙ₋₂", "CₙH₂ₙ₊₁"]', 1,
 'Alkanes (saturated hydrocarbons) have the general formula CₙH₂ₙ₊₂. Example: methane (CH₄), ethane (C₂H₆).', 'medium'),

('Chemistry', 'Electrolysis', 2020,
 'During electrolysis of dilute sulphuric acid, which gas is produced at the cathode?',
 '["Oxygen", "Hydrogen", "Sulphur dioxide", "Chlorine"]', 1,
 'At the cathode (negative electrode), H⁺ ions are discharged: 2H⁺ + 2e⁻ → H₂. Hydrogen is produced.', 'medium'),

('Chemistry', 'Moles', 2021,
 'The molar mass of water (H₂O) is:',
 '["16 g/mol", "18 g/mol", "20 g/mol", "10 g/mol"]', 1,
 'H₂O: (2 × 1) + 16 = 18 g/mol. H has atomic mass 1, O has atomic mass 16.', 'easy'),

('Chemistry', 'Acids and Bases', 2022,
 'Which of the following is a strong acid?',
 '["Ethanoic acid", "Carbonic acid", "Hydrochloric acid", "Citric acid"]', 2,
 'Hydrochloric acid (HCl) is a strong acid — it fully dissociates in water. The others are weak acids.', 'medium'),

('Chemistry', 'Periodic Table', 2019,
 'Elements in the same group of the periodic table have:',
 '["The same number of protons", "The same number of neutrons", "The same number of electrons in their outer shell", "The same mass number"]', 2,
 'Elements in the same group have the same number of valence (outer shell) electrons, giving them similar chemical properties.', 'medium'),

('Chemistry', 'Reactions', 2022,
 'In the reaction 2H₂ + O₂ → 2H₂O, hydrogen is:',
 '["Oxidised", "Reduced", "A catalyst", "A product"]', 0,
 'Hydrogen loses electrons (gains oxygen) → it is oxidised. Oxidation is the gain of oxygen/loss of electrons.', 'hard'),

('Chemistry', 'Environmental Chemistry', 2021,
 'The main cause of acid rain is:',
 '["Carbon dioxide and nitrogen", "Sulphur dioxide and nitrogen oxides", "Oxygen and ozone", "Carbon monoxide and methane"]', 1,
 'Sulphur dioxide (from burning fossil fuels) and nitrogen oxides react with water in the atmosphere to form sulphuric and nitric acids, causing acid rain.', 'medium'),

('Chemistry', 'Physical Chemistry', 2020,
 'Alloys are:',
 '["Pure metals", "Mixtures of two or more metals", "Metal compounds", "Metal oxides"]', 1,
 'An alloy is a mixture of two or more metals (or a metal and a non-metal) to improve properties. Example: steel (iron + carbon).', 'easy'),

-- PHYSICS
('Physics', 'Mechanics', 2022,
 'A car travels 120 km in 2 hours. Its average speed is:',
 '["60 km/h", "240 km/h", "30 km/h", "120 km/h"]', 0,
 'Speed = Distance ÷ Time = 120 ÷ 2 = 60 km/h.', 'easy'),

('Physics', 'Electricity', 2021,
 'The SI unit of electrical resistance is the:',
 '["Ampere", "Volt", "Ohm", "Watt"]', 2,
 'The Ohm (Ω) is the SI unit of electrical resistance, named after Georg Simon Ohm.', 'easy'),

('Physics', 'Waves', 2022,
 'The speed of light in a vacuum is approximately:',
 '["3 × 10⁶ m/s", "3 × 10⁸ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"]', 1,
 'The speed of light in a vacuum is c ≈ 3 × 10⁸ m/s (300,000 km/s).', 'easy'),

('Physics', 'Heat', 2020,
 'When a substance changes from liquid to gas at its boiling point, it:',
 '["Releases latent heat", "Absorbs latent heat", "Has no change in energy", "Decreases in volume"]', 1,
 'During vaporisation (liquid → gas), a substance absorbs latent heat of vaporisation from its surroundings.', 'medium'),

('Physics', 'Magnetism', 2021,
 'Magnetic field lines around a bar magnet:',
 '["Start at the south pole and end at the north pole", "Start at the north pole and end at the south pole", "Are parallel straight lines", "Only exist at the poles"]', 1,
 'By convention, magnetic field lines emerge from the north pole and enter the south pole (outside the magnet).', 'medium'),

('Physics', 'Modern Physics', 2022,
 'The process in which a nucleus splits into smaller parts releasing energy is called:',
 '["Nuclear fusion", "Nuclear fission", "Radioactive decay", "Ionisation"]', 1,
 'Nuclear fission is the splitting of a heavy atomic nucleus (e.g. uranium) into smaller nuclei, releasing a large amount of energy.', 'medium'),

('Physics', 'Optics', 2019,
 'A concave mirror is also called a:',
 '["Diverging mirror", "Plane mirror", "Converging mirror", "Convex mirror"]', 2,
 'A concave mirror converges parallel rays of light to a focal point — it is a converging mirror.', 'easy'),

('Physics', 'Mechanics', 2021,
 'The principle that states "the pressure applied to a fluid in a closed container is transmitted equally in all directions" is:',
 '["Archimedes\' Principle", "Pascal\'s Principle", "Bernoulli\'s Principle", "Boyle\'s Law"]', 1,
 'Pascal\'s Principle: pressure applied to a fluid is transmitted undiminished throughout the fluid.', 'hard'),

('Physics', 'Energy', 2022,
 'Which form of energy does a moving car possess?',
 '["Potential energy", "Chemical energy", "Kinetic energy", "Nuclear energy"]', 2,
 'A moving object possesses kinetic energy (KE = ½mv²). The faster and heavier the car, the more kinetic energy it has.', 'easy'),

('Physics', 'Sound', 2020,
 'Sound waves are:',
 '["Transverse waves", "Electromagnetic waves", "Longitudinal waves", "Light waves"]', 2,
 'Sound waves are longitudinal mechanical waves — the particles of the medium vibrate in the same direction as the wave travels.', 'medium'),

-- ECONOMICS
('Economics', 'Macroeconomics', 2021,
 'Inflation is defined as:',
 '["A decrease in the level of prices", "A sustained increase in the general price level", "An increase in production", "A decrease in unemployment"]', 1,
 'Inflation is a sustained rise in the general price level of goods and services over time, reducing purchasing power.', 'easy'),

('Economics', 'Microeconomics', 2022,
 'The law of demand states that:',
 '["As price rises, demand rises", "As price rises, demand falls (ceteris paribus)", "Demand is always constant", "Price does not affect demand"]', 1,
 'The law of demand: there is an inverse relationship between price and quantity demanded, all other things being equal.', 'easy'),

('Economics', 'International Trade', 2020,
 'Liberia\'s main export commodity has historically been:',
 '["Cocoa", "Coffee", "Iron ore and rubber", "Palm oil only"]', 2,
 'Liberia\'s major exports have historically been iron ore and natural rubber (from rubber plantations like Firestone).', 'medium'),

('Economics', 'Public Finance', 2021,
 'A progressive tax system means:',
 '["Everyone pays the same amount", "Higher earners pay a higher percentage of their income", "Lower earners pay more tax", "Tax rates decrease as income rises"]', 1,
 'Under a progressive tax, the tax rate increases as taxable income increases — those who earn more pay a higher percentage.', 'medium'),

('Economics', 'Money and Banking', 2022,
 'The central bank of Liberia is responsible for:',
 '["Setting import tariffs", "Controlling monetary policy and money supply", "Building roads and infrastructure", "Managing elections"]', 1,
 'The Central Bank of Liberia (CBL) manages monetary policy, controls the money supply, and regulates commercial banks.', 'medium'),

('Economics', 'Elasticity', 2019,
 'If a 10% rise in price causes a 20% fall in quantity demanded, price elasticity of demand is:',
 '["0.5 — inelastic", "2 — elastic", "1 — unit elastic", "0.2 — inelastic"]', 1,
 'PED = % change in Qd ÷ % change in Price = 20/10 = 2. Since PED > 1, demand is elastic.', 'hard'),

('Economics', 'Production', 2022,
 'The law of diminishing returns states that:',
 '["Profits always decrease", "As more of a variable factor is added to fixed factors, output eventually increases at a decreasing rate", "All factors of production are fixed", "Costs always rise"]', 1,
 'The law of diminishing returns: adding more of a variable input (e.g. labour) to a fixed input (e.g. land) eventually leads to smaller increases in output.', 'hard'),

('Economics', 'Market Structures', 2021,
 'A monopoly is characterised by:',
 '["Many sellers of identical products", "A single seller with no close substitutes", "Two main sellers", "Perfect competition"]', 1,
 'A monopoly has one seller (price maker) who produces a product with no close substitutes, giving the firm significant market power.', 'medium'),

('Economics', 'Development Economics', 2020,
 'Which of the following is NOT a characteristic of a developing economy?',
 '["Low per capita income", "High literacy rates", "Subsistence agriculture", "Inadequate infrastructure"]', 1,
 'High literacy rates are typically a characteristic of developed, not developing, economies. Developing economies tend to have lower literacy rates.', 'medium'),

('Economics', 'National Income', 2022,
 'GDP can be measured using which of the following approaches?',
 '["Output, income, and expenditure approaches", "Import, export, and savings", "Tax, spending, and borrowing", "Profit, loss, and break-even"]', 0,
 'GDP can be measured via: (1) Output approach — sum of all goods/services produced; (2) Income approach — sum of all incomes; (3) Expenditure approach — sum of all spending.', 'medium'),

-- GEOGRAPHY
('Geography', 'Physical Geography', 2021,
 'The layer of the Earth that is liquid and consists mainly of iron and nickel is the:',
 '["Crust", "Mantle", "Outer core", "Inner core"]', 2,
 'The outer core is liquid and composed mainly of iron and nickel. The inner core is solid despite high temperature due to immense pressure.', 'medium'),

('Geography', 'Climate', 2022,
 'The Intertropical Convergence Zone (ITCZ) is associated with:',
 '["Very dry conditions", "Heavy rainfall and thunderstorms", "Polar conditions", "Desert formation"]', 1,
 'The ITCZ is a belt of low pressure near the equator where trade winds converge, causing warm moist air to rise and produce heavy rainfall.', 'hard'),

('Geography', 'Liberia', 2020,
 'Which is the largest county in Liberia by area?',
 '["Montserrado", "Grand Bassa", "Nimba", "Grand Cape Mount"]', 2,
 'Nimba County is the largest county in Liberia by land area.', 'medium'),

('Geography', 'Economic Geography', 2021,
 'Liberia is a major producer of which mineral used in steelmaking?',
 '["Bauxite", "Iron ore", "Gold", "Diamonds only"]', 1,
 'Liberia has large deposits of iron ore, particularly in Nimba County and the Wologizi Range, making it a significant iron ore exporter.', 'easy'),

('Geography', 'Map Work', 2022,
 'On a topographic map, closely spaced contour lines indicate:',
 '["Flat land", "Steep slopes", "Water bodies", "Forests"]', 1,
 'Contour lines that are close together represent a steep gradient. Widely spaced contour lines represent gentle slopes.', 'easy'),

('Geography', 'Population', 2020,
 'The demographic transition model shows that countries in stage 2 experience:',
 '["High birth rate and high death rate", "High birth rate and falling death rate (rapid population growth)", "Low birth rate and low death rate", "Low birth rate and high death rate"]', 1,
 'Stage 2 of the DTM features high birth rates and falling death rates (due to improved healthcare), resulting in rapid population growth.', 'hard'),

('Geography', 'Rivers', 2021,
 'The process by which rivers deposit their load is called:',
 '["Erosion", "Transportation", "Weathering", "Deposition"]', 3,
 'Deposition occurs when a river loses energy and drops the material it has been carrying. It happens in areas of slow flow such as meanders and estuaries.', 'easy'),

('Geography', 'West Africa', 2022,
 'The River Niger flows through which group of countries?',
 '["Liberia, Sierra Leone, Guinea", "Guinea, Mali, Niger, Nigeria", "Ghana, Togo, Benin", "Senegal, Gambia, Guinea-Bissau"]', 1,
 'The Niger River passes through Guinea, Mali, Niger, and Nigeria before emptying into the Gulf of Guinea.', 'medium'),

('Geography', 'Climate', 2019,
 'Liberia has a tropical climate mainly because it:',
 '["Is in the Southern Hemisphere", "Is located near the equator", "Is surrounded by mountains", "Has a cold ocean current"]', 1,
 'Liberia\'s proximity to the equator means it receives intense solar radiation year-round, resulting in a hot, humid tropical climate with distinct rainy and dry seasons.', 'easy'),

('Geography', 'Physical Geography', 2022,
 'An ox-bow lake forms when:',
 '["A river floods its banks", "A meander is cut off from the main river", "A river dries up", "Glacial ice melts"]', 1,
 'An ox-bow lake (cutoff lake) forms when a river meander is bypassed as the river cuts through its neck during a flood, leaving a crescent-shaped lake.', 'medium'),

-- LITERATURE
('Literature', 'Literary Terms', 2022,
 'The repetition of consonant sounds at the beginning of words in a sentence is called:',
 '["Assonance", "Onomatopoeia", "Alliteration", "Rhyme"]', 2,
 'Alliteration is the repetition of the same initial consonant sound in nearby words, e.g. "Peter Piper picked a peck."', 'easy'),

('Literature', 'Drama', 2021,
 'A soliloquy in a play is when:',
 '["Two characters have a private conversation", "A character speaks their thoughts aloud alone on stage", "The narrator summarises the plot", "The chorus comments on action"]', 1,
 'A soliloquy is a speech where a character speaks their private thoughts aloud, alone on stage, letting the audience know their inner feelings.', 'medium'),

('Literature', 'Poetry', 2022,
 'A poem that tells a story, often with heroes and adventures, is called an:',
 '["Elegy", "Ode", "Sonnet", "Epic"]', 3,
 'An epic is a long narrative poem that tells the story of heroic deeds and adventures, often on a grand scale. Examples: Homer\'s Iliad, Odyssey.', 'medium'),

('Literature', 'African Literature', 2020,
 'In Chinua Achebe\'s "Things Fall Apart", the protagonist is:',
 '["Nwoye", "Okonkwo", "Ezinma", "Obierika"]', 1,
 'Okonkwo is the protagonist of "Things Fall Apart" — a proud Igbo warrior whose life is the central focus of the novel.', 'easy'),

('Literature', 'Literary Devices', 2021,
 'Giving human characteristics to non-human things is called:',
 '["Simile", "Metaphor", "Personification", "Hyperbole"]', 2,
 'Personification attributes human qualities to inanimate objects or abstract ideas, e.g. "The sun smiled down on us."', 'easy'),

('Literature', 'Literary Terms', 2022,
 'The "theme" of a literary work refers to:',
 '["The setting of the story", "The central idea or message", "The main character", "The type of narration used"]', 1,
 'The theme is the underlying message, moral, or central idea that the author explores throughout the work.', 'easy'),

('Literature', 'Prose', 2019,
 'First-person narration uses which pronoun as the narrator?',
 '["He / She", "They", "I", "You"]', 2,
 'In first-person narration, the narrator uses "I" — they are a character within the story telling it from their perspective.', 'easy'),

('Literature', 'Drama', 2020,
 'A dramatic irony occurs when:',
 '["The audience knows something the characters do not", "The characters know more than the audience", "There is a sudden plot twist", "Two characters misunderstand each other"]', 0,
 'Dramatic irony is when the audience possesses information that the characters in the story do not, creating tension or humour.', 'hard'),

('Literature', 'Poetry', 2022,
 'A haiku is a poem that consists of:',
 '["14 lines and a rhyme scheme", "3 lines with 5-7-5 syllables", "Any number of lines", "4 stanzas of 4 lines each"]', 1,
 'A haiku is a traditional Japanese poem of 3 lines with 5 syllables, 7 syllables, and 5 syllables respectively.', 'medium'),

('Literature', 'General', 2021,
 'The term "denouement" refers to:',
 '["The opening of a story", "The climax of a conflict", "The resolution or outcome at the end of a narrative", "A type of villain"]', 2,
 'The denouement is the final part of a narrative where the strands of the plot are drawn together and conflicts resolved.', 'hard');
