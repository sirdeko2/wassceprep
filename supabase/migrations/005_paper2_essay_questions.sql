-- ============================================================
-- WASSCEPrep — Migration 005: Paper 2 Essay/Theory Questions
-- Adds structured essay and theory questions for all 8 subjects.
-- Requirements per subject:
--   Mathematics  : 5 compulsory (Sec A) + 8 choice/answer 5 (Sec B) = 13
--   English Lang : 5 essays (Sec A) + 1 comprehension (Sec B) + 1 summary (Sec C) = 7 entries
--   Biology      : 4 short compulsory (Sec A) + 6 essay/choose 4 (Sec B) = 10
--   Chemistry    : 5 short compulsory (Sec A) + 6 choose 5 (Sec B) = 11
--   Physics      : 5 short compulsory (Sec A) + 5 calc/choose 4 (Sec B) = 10
--   Economics    : 8 choose 5 (Sec A) = 8
--   Geography    : 3 physical/choose 2 (Sec A) + 3 human/choose 2 (Sec B) = 6
--   Literature   : 2+2 prose (P2) + 2+2+2 drama/poetry (P3) = 10
-- ============================================================

-- ── Make MCQ-specific columns nullable for essay/structured/practical rows ──
-- options and correct_answer_index are required for MCQ only.
-- Essay questions don't need these fields.
ALTER TABLE questions ALTER COLUMN options DROP NOT NULL;
ALTER TABLE questions ALTER COLUMN correct_answer_index DROP NOT NULL;
ALTER TABLE questions ALTER COLUMN correct_answer_index DROP DEFAULT;
ALTER TABLE questions ADD CONSTRAINT chk_mcq_options
  CHECK (question_type != 'mcq' OR (options IS NOT NULL AND correct_answer_index IS NOT NULL));

-- ──────────────────────────────────────────────────────────
-- MATHEMATICS Paper 2 — Theory & Problem Solving
-- Section A: 5 compulsory (each ~10 marks)
-- Section B: 8 questions, answer any 5 (each ~10 marks)
-- ──────────────────────────────────────────────────────────
INSERT INTO questions (subject, paper_number, question_type, section, topic, year, question_text, marks, mark_scheme, model_answer, difficulty, is_active) VALUES

-- Section A (compulsory)
('Mathematics', 2, 'structured', 'A', 'Number Bases', 2022,
'(a) Convert 11011₂ to base 10.
(b) Express 47₁₀ in base 2.
(c) Calculate: 101₂ + 110₂, leaving your answer in base 2.',
10,
'(a) 1×16 + 1×8 + 0×4 + 1×2 + 1×1 = 27. Award 2 marks.
(b) 47 ÷ 2 = 23 r1; 23 ÷ 2 = 11 r1; 11 ÷ 2 = 5 r1; 5 ÷ 2 = 2 r1; 2 ÷ 2 = 1 r0; 1 ÷ 2 = 0 r1 → 101111₂. Award 3 marks (1 for method, 2 for correct answer).
(c) 101 + 110 = 1011₂. Award 2 marks. Show working: 1+0=1, 0+1=1, 1+1=10 carry 1, 0+0+1=1.
Award up to 3 marks for method even if final answer has minor error.',
'(a) 11011₂ = 16 + 8 + 0 + 2 + 1 = 27₁₀
(b) 47 ÷ 2 repeatedly: 101111₂
(c) 101₂ + 110₂: 1+0=1; 0+1=1; 1+1=10 → carry 1; carry in = 1011₂',
'medium', true),

('Mathematics', 2, 'structured', 'A', 'Sets', 2021,
'In a class of 40 students, 25 study French, 20 study Spanish, and 8 study both.
(a) Draw a Venn diagram to represent this information.
(b) How many students study French only?
(c) How many students study neither subject?',
10,
'(a) Correct Venn diagram with two overlapping circles labelled French (25) and Spanish (20), intersection = 8. Award 3 marks.
(b) French only = 25 − 8 = 17. Award 2 marks.
(c) French ∪ Spanish = 25 + 20 − 8 = 37. Neither = 40 − 37 = 3. Award 3 marks (1 for union formula, 1 for union value, 1 for final answer).
Diagram mark: 2 marks even if (b) or (c) incorrect.',
'(a) Venn diagram: French circle with 17, intersection 8, Spanish with 12, outside 3.
(b) French only = 25 − 8 = 17 students.
(c) Total in French ∪ Spanish = 37, so 40 − 37 = 3 study neither.',
'medium', true),

('Mathematics', 2, 'essay', 'A', 'Linear Equations', 2022,
'Solve the simultaneous equations:
3x + 2y = 16
5x − 3y = 7
Show all working clearly.',
10,
'Elimination or substitution method acceptable. Award 1 mark for correct method chosen.
Multiply first equation by 3: 9x + 6y = 48
Multiply second equation by 2: 10x − 6y = 14
Add: 19x = 62, x = 62/19 ≈ 3.26.
Substitute to find y.
Correct x: 4 marks. Correct y: 4 marks. Method marks: 2 marks.
Accept any correct method (substitution, elimination, matrix).',
'Multiply eq1 by 3: 9x + 6y = 48
Multiply eq2 by 2: 10x − 6y = 14
Add: 19x = 62, so x = 62/19
Substitute: 3(62/19) + 2y = 16 → y = (16 × 19 − 186) / 38 = 116/38 = 58/19',
'medium', true),

('Mathematics', 2, 'essay', 'A', 'Mensuration', 2021,
'A cylinder has a radius of 7 cm and a height of 15 cm.
(a) Calculate the curved surface area of the cylinder. [Take π = 22/7]
(b) Calculate the total surface area.
(c) Calculate the volume of the cylinder.',
10,
'(a) Curved SA = 2πrh = 2 × (22/7) × 7 × 15 = 660 cm². Award 3 marks.
(b) Total SA = 2πr² + 2πrh = 2 × (22/7) × 49 + 660 = 308 + 660 = 968 cm². Award 3 marks.
(c) Volume = πr²h = (22/7) × 49 × 15 = 2310 cm³. Award 4 marks.
Penalise 1 mark for missing units in final answer. Award method marks even if π value used incorrectly.',
'(a) Curved SA = 2πrh = 2 × 22/7 × 7 × 15 = 660 cm²
(b) Total SA = 2πr(r + h) = 2 × 22/7 × 7 × (7 + 15) = 44 × 22 = 968 cm²
(c) V = πr²h = 22/7 × 49 × 15 = 2310 cm³',
'medium', true),

('Mathematics', 2, 'essay', 'A', 'Statistics', 2022,
'The ages (in years) of 10 workers in an office are: 24, 31, 28, 35, 42, 24, 31, 28, 19, 38.
(a) Find the mean age.
(b) Find the median age.
(c) Find the modal age.
(d) Find the range.',
10,
'(a) Sum = 300; Mean = 300/10 = 30. Award 3 marks (1 for sum, 1 for division, 1 for answer).
(b) Ordered: 19, 24, 24, 28, 28, 31, 31, 35, 38, 42. Median = (28+31)/2 = 29.5. Award 3 marks.
(c) Mode = 24, 28, and 31 (bimodal or trimodal — accept any if all correct). Award 2 marks.
(d) Range = 42 − 19 = 23. Award 2 marks.',
'Ordered: 19, 24, 24, 28, 28, 31, 31, 35, 38, 42
(a) Mean = 300/10 = 30 years
(b) Median = (28 + 31)/2 = 29.5 years
(c) Modes = 24, 28, and 31
(d) Range = 42 − 19 = 23',
'easy', true),

-- Section B (choose 5 of 8)
('Mathematics', 2, 'essay', 'B', 'Trigonometry', 2022,
'In a right-angled triangle PQR, angle Q = 90°, PQ = 8 cm and QR = 15 cm.
(a) Find PR (the hypotenuse).
(b) Find sin P, cos P, and tan P.
(c) Find angle P, correct to the nearest degree.',
10,
'(a) PR² = 8² + 15² = 64 + 225 = 289; PR = 17 cm. Award 3 marks.
(b) sin P = QR/PR = 15/17; cos P = PQ/PR = 8/17; tan P = QR/PQ = 15/8. Award 3 marks (1 per ratio).
(c) angle P = arctan(15/8) = arctan(1.875) ≈ 62°. Award 4 marks (2 for correct trig, 2 for angle).
Penalise 1 mark if no degree symbol.',
'(a) PR = √(8² + 15²) = √289 = 17 cm
(b) sin P = 15/17, cos P = 8/17, tan P = 15/8
(c) P = arctan(15/8) ≈ 62°',
'medium', true),

('Mathematics', 2, 'essay', 'B', 'Coordinate Geometry', 2021,
'A(2, 3) and B(8, 11) are two points on a straight line.
(a) Find the gradient of AB.
(b) Find the equation of line AB.
(c) Find the midpoint of AB.
(d) Find the length of AB.',
10,
'(a) gradient m = (11−3)/(8−2) = 8/6 = 4/3. Award 2 marks.
(b) y − 3 = (4/3)(x − 2) → 3y − 9 = 4x − 8 → 4x − 3y + 1 = 0. Award 3 marks.
(c) Midpoint = ((2+8)/2, (3+11)/2) = (5, 7). Award 2 marks.
(d) Length = √[(8−2)² + (11−3)²] = √(36 + 64) = √100 = 10 units. Award 3 marks.',
'(a) m = (11−3)/(8−2) = 4/3
(b) y − 3 = 4/3(x − 2) → 4x − 3y + 1 = 0
(c) Midpoint = (5, 7)
(d) Length = √(6² + 8²) = 10 units',
'medium', true),

('Mathematics', 2, 'essay', 'B', 'Probability', 2022,
'A bag contains 5 red balls, 3 blue balls, and 2 green balls.
(a) A ball is drawn at random. Find the probability it is: (i) red, (ii) not green.
(b) Two balls are drawn without replacement. Find the probability that both are red.
(c) What is the probability that the first is blue and the second is green?',
10,
'(a)(i) P(red) = 5/10 = 1/2. (ii) P(not green) = 8/10 = 4/5. Award 2 marks.
(b) P(both red) = (5/10) × (4/9) = 20/90 = 2/9. Award 4 marks (2 for method, 2 for answer).
(c) P(blue then green) = (3/10) × (2/9) = 6/90 = 1/15. Award 4 marks.',
'(a)(i) 5/10 = 1/2; (ii) 8/10 = 4/5
(b) (5/10) × (4/9) = 2/9
(c) (3/10) × (2/9) = 1/15',
'medium', true),

('Mathematics', 2, 'essay', 'B', 'Linear Programming', 2021,
'A farmer has land for at most 40 hectares of crops. He can plant maize (x hectares) or rice (y hectares), subject to:
x ≥ 5, y ≥ 10, x + y ≤ 40.
The profit is $200 per hectare of maize and $300 per hectare of rice.
(a) Write down the constraints.
(b) Draw the feasible region on a graph.
(c) Find the combination that maximises profit and state the maximum profit.',
10,
'(a) x ≥ 5; y ≥ 10; x + y ≤ 40; x, y ≥ 0. Award 2 marks.
(b) Correctly drawn graph with feasible region shaded. Award 4 marks.
(c) Vertices of feasible region: (5, 10), (30, 10), (5, 35). Profit P = 200x + 300y.
At (5, 10): P = 1000 + 3000 = 4000. At (30, 10): P = 6000 + 3000 = 9000. At (5, 35): P = 1000 + 10500 = 11500.
Maximum: 5 ha maize, 35 ha rice, profit = $11,500. Award 4 marks.',
'(a) x ≥ 5, y ≥ 10, x + y ≤ 40
(b) Graph with feasible region bounded by those constraints
(c) Maximum at vertex (5, 35): P = 200(5) + 300(35) = $11,500',
'hard', true),

('Mathematics', 2, 'essay', 'B', 'Algebra — Quadratic Equations', 2022,
'(a) Solve by factorisation: 2x² − 7x + 3 = 0.
(b) Solve using the quadratic formula: 3x² + 5x − 2 = 0.
(c) The sum of the roots of a quadratic equation is 5 and the product is 6. Write down the equation.',
10,
'(a) 2x² − 7x + 3 = (2x − 1)(x − 3) = 0 → x = ½ or x = 3. Award 4 marks.
(b) x = [−5 ± √(25 + 24)] / 6 = [−5 ± 7] / 6 → x = 1/3 or x = −2. Award 4 marks.
(c) x² − (sum)x + (product) = 0 → x² − 5x + 6 = 0. Award 2 marks.',
'(a) (2x − 1)(x − 3) = 0 → x = 1/2 or x = 3
(b) x = (−5 ± √49)/6 → x = 1/3 or x = −2
(c) x² − 5x + 6 = 0',
'medium', true),

('Mathematics', 2, 'essay', 'B', 'Graphs', 2021,
'(a) Complete the table of values for y = x² − 3x − 4 for x from −2 to 5.
(b) Draw the graph on a grid.
(c) Use your graph to find: (i) the minimum value of y, (ii) the values of x where y = 0.',
10,
'(a) Values: x: −2,−1,0,1,2,3,4,5; y: 6,0,−4,−6,−6,−4,0,6. Award 2 marks.
(b) Smooth parabola plotted correctly through all points. Award 4 marks.
(c)(i) Minimum y = −6.25 (at x = 1.5). (ii) y = 0 at x = −1 and x = 4. Award 4 marks.',
'(a) Table: y values = 6, 0, −4, −6, −6, −4, 0, 6
(b) Smooth U-shaped parabola
(c)(i) Minimum ≈ −6.25; (ii) roots at x = −1 and x = 4',
'medium', true),

('Mathematics', 2, 'essay', 'B', 'Mensuration — Circles & Sectors', 2022,
'A sector of a circle has a radius of 14 cm and an angle of 90° at the centre. [π = 22/7]
(a) Find the area of the sector.
(b) Find the perimeter of the sector.
(c) A cone is formed by rolling the sector into a cone shape. Find the radius of the base of the cone.',
10,
'(a) Area = (θ/360) × πr² = (90/360) × (22/7) × 196 = ¼ × 616 = 154 cm². Award 3 marks.
(b) Arc length = (90/360) × 2πr = (1/4) × 2 × (22/7) × 14 = 22 cm. Perimeter = 22 + 14 + 14 = 50 cm. Award 3 marks.
(c) Arc of sector = circumference of base of cone → 2πr_base = 22 → r_base = 22/(2 × 22/7) = 22 × 7/44 = 3.5 cm. Award 4 marks.',
'(a) Area = (90/360)π(14)² = 154 cm²
(b) Arc = 22 cm; Perimeter = 22 + 14 + 14 = 50 cm
(c) r_base = arc/(2π) = 22/(2π) = 3.5 cm',
'hard', true);

-- Mathematics Section B question 8 of 8 (Vectors & Transformation)
INSERT INTO questions (subject, paper_number, question_type, section, topic, year, question_text, marks, mark_scheme, model_answer, difficulty, is_active) VALUES
('Mathematics', 2, 'essay', 'B', 'Vectors & Transformation', 2021,
'(a) Given vectors p = (3, -2) and q = (-1, 4):
(i) Find p + q and |p + q|.
(ii) Find 3p - 2q.
(b) A translation T maps point A(2, 1) to A''(5, -1). Find the translation vector.
(c) Under a reflection in the line y = x, point P(3, -1) maps to P''. Find the coordinates of P''.
(d) Describe fully the transformation that maps triangle ABC with vertices A(1,1), B(3,1), C(2,3) to A''(-1,-1), B''(-3,-1), C''(-2,-3).',
10,
'(a)(i) p + q = (2, 2); |p + q| = √(4 + 4) = √8 = 2√2 ≈ 2.83. Award 3 marks.
(ii) 3p − 2q = (9, -6) − (-2, 8) = (11, -14). Award 2 marks.
(b) Translation vector = A'' − A = (5-2, -1-1) = (3, -2). Award 2 marks.
(c) Under reflection y = x, (x, y) → (y, x): P(3, -1) → P''(-1, 3). Award 1 mark.
(d) All coordinates negated: (x, y) → (-x, -y) = rotation of 180° about the origin. Award 2 marks.',
'(a)(i) p + q = (2, 2); |p + q| = 2√2
(ii) 3p − 2q = (11, -14)
(b) Translation vector = (3, -2)
(c) P'' = (-1, 3)
(d) 180° rotation about the origin (or enlargement scale factor -1 from origin)',
'medium', true);

-- ──────────────────────────────────────────────────────────
-- ENGLISH LANGUAGE Paper 2 — Essay, Comprehension & Summary
-- Section A: 5 essay prompts, student chooses 1
-- Section B: comprehension passage + 5 questions (all compulsory)
-- Section C: 1 summary question (compulsory)
-- ──────────────────────────────────────────────────────────
INSERT INTO questions (subject, paper_number, question_type, section, topic, year, question_text, marks, mark_scheme, model_answer, difficulty, is_active) VALUES

('English Language', 2, 'essay', 'A', 'Formal Letter', 2022,
'Write a formal letter to the Principal of your school requesting permission for the students'' association to organise a graduation party. Your letter should be between 400 and 450 words.',
20,
'Format (5 marks): Correct letter format (sender address, date, recipient address, salutation, subject heading, valediction, signature).
Content (10 marks): Clear request, reasons given, proposed date/venue, assurance of orderly behaviour, gratitude expressed.
Language (5 marks): Formal register maintained throughout; no colloquialisms; correct grammar, spelling, and punctuation.
Deduct 1 mark for every 10 words over/under the word limit.',
'[Your Address]
[Date]
The Principal,
[School Name],
[Address]

Dear Sir/Madam,

RE: REQUEST FOR PERMISSION TO ORGANISE GRADUATION PARTY

I am writing on behalf of the students'' association to respectfully request your permission to organise a graduation party for the final-year students of our school...

[Body continues with reasons, proposed date, assurances of orderly conduct, and closing pleasantries]

Yours faithfully,
[Name]
[Position]',
'medium', true),

('English Language', 2, 'essay', 'A', 'Narrative Essay', 2021,
'Write a story that begins with the words: "The day I will never forget started like any other..."
Your story should be between 400 and 450 words.',
20,
'Content (10 marks): Clear narrative structure (beginning, middle, end); vivid descriptions; character development; resolution of conflict or tension.
Language (5 marks): Appropriate use of narrative tense (past tense); varied sentence structures; correct grammar and punctuation.
Style (5 marks): Use of literary devices (simile, metaphor, personification); engaging opening and conclusion; appropriate vocabulary.
Word count: deduct 1 mark per 10 words over/under limit.',
'The day I will never forget started like any other — a humid Monday morning in Monrovia, the market already filling with vendors and the smell of frying plantain...

[Story continues: vivid scenes, a central event such as an accident, discovery, or reunion, emotional resolution]

...I returned home that evening a changed person, carrying with me a lesson no classroom could ever have taught.',
'medium', true),

('English Language', 2, 'essay', 'A', 'Expository Essay', 2022,
'Write an expository essay on the topic: "The Importance of Education for Liberia''s Development". Your essay should be between 400 and 450 words.',
20,
'Content (10 marks): Clear thesis; supporting arguments (economic development, reduction of poverty, national unity, professional workforce); counterarguments addressed; conclusion.
Structure (5 marks): Introduction, body paragraphs with topic sentences, conclusion.
Language (5 marks): Formal academic register; correct grammar and punctuation; varied vocabulary.',
'Education is widely regarded as the most powerful instrument for national development. In Liberia, a country recovering from decades of conflict, education holds particular significance...

[Body: discuss economic benefits, social cohesion, professional capacity, reduced dependence on foreign expertise]

In conclusion, investing in education is not merely a moral obligation but an economic imperative for Liberia''s sustainable development.',
'medium', true),

('English Language', 2, 'essay', 'A', 'Speech', 2021,
'You have been asked to give a speech at a school assembly on the topic: "Peer Pressure and How to Resist It". Write your speech in 400 to 450 words.',
20,
'Format (4 marks): Appropriate speech format (salutation, body, closing remarks/call to action, valediction).
Content (10 marks): Clear definition of peer pressure; examples; effects; practical strategies for resistance; motivational tone.
Language (6 marks): Persuasive language; rhetorical devices (repetition, rhetorical questions, direct address); correct grammar.',
'Ladies and gentlemen, distinguished teachers, and my fellow students — good morning.

Today, I stand before you to address one of the most insidious challenges facing young people today: peer pressure...

[Body: definitions, real-life examples, effects on academic performance and health, strategies such as assertiveness, choosing friends wisely, seeking guidance]

Let us make the choice to stand tall in the face of pressure. Thank you.',
'medium', true),

('English Language', 2, 'essay', 'A', 'Article', 2022,
'Write an article for your school magazine on the topic: "The Role of Technology in Modern Education". Your article should be between 400 and 450 words.',
20,
'Format (4 marks): Headline/title, author attribution, introduction, body, conclusion.
Content (10 marks): Benefits of technology (access to information, interactive learning, digital literacy), challenges (cost, electricity, distraction), balanced view.
Language (6 marks): Engaging journalistic style; varied sentence structure; correct grammar and vocabulary.',
'TECHNOLOGY: TRANSFORMING THE CLASSROOM
By [Student Name]

The chalk and blackboard that once defined the classroom are rapidly giving way to tablets, projectors, and online platforms...

[Body: explores educational apps, online resources, challenges in resource-limited settings, recommendations]

As Liberia advances, embracing educational technology — thoughtfully and equitably — will be essential to building the classrooms of tomorrow.',
'medium', true),

-- Section B: Comprehension (all compulsory)
('English Language', 2, 'essay', 'B', 'Comprehension', 2022,
'Read the following passage carefully and answer all the questions that follow.

PASSAGE:
The Amazon rainforest, often described as the "lungs of the Earth," produces approximately 20 percent of the world''s oxygen and is home to an estimated 10 percent of all species on our planet. Yet every year, vast tracts of this irreplaceable ecosystem are cleared for farming, cattle ranching, and logging. In Liberia, a similar pattern has emerged: the country''s forests, once among the densest in West Africa, have been reduced by decades of logging concessions and agricultural expansion.

The consequences of deforestation are not merely environmental. Communities that depend on forests for food, medicine, and clean water find their livelihoods destroyed. Scientists warn that unchecked deforestation will accelerate climate change, reduce rainfall, and cause irreversible loss of biodiversity. In Liberia, erratic rainfall patterns already threaten rice production, the country''s staple crop, placing food security at risk.

Yet solutions exist. Community forestry programmes, where local populations are given legal rights to manage and benefit from forest resources, have shown promising results in both reducing deforestation and improving rural incomes. International carbon credit schemes, which pay countries to preserve forest cover, provide another financial incentive. What is required above all is political will — a government committed to long-term environmental stewardship over short-term economic gain.

(i) In two sentences, state the two main topics discussed in the passage.
(ii) What does the phrase "lungs of the Earth" suggest about the Amazon rainforest?
(iii) Identify two consequences of deforestation mentioned in the passage.
(iv) What are TWO solutions proposed in the passage?
(v) The word "irreplaceable" appears in the first paragraph. What does it mean in this context?',
20,
'(i) Award 2 marks: The passage discusses deforestation of tropical forests (Amazon and Liberia) and its consequences. Solutions to deforestation are also discussed. Accept two clear main points.
(ii) Award 3 marks: The metaphor suggests that the Amazon is essential to the Earth''s life/breathing, producing oxygen just as lungs supply oxygen to the body. Must reference oxygen/life to earn full marks.
(iii) Award 4 marks (2 marks each): Any two of: destruction of communities'' livelihoods; acceleration of climate change; reduced rainfall; irreversible biodiversity loss; threat to food security/rice production.
(iv) Award 4 marks (2 each): Community forestry programmes with legal rights for local communities; international carbon credit schemes.
(v) Award 4 marks: Cannot be replaced; something so unique/valuable that once destroyed it cannot be recovered. Must convey idea of permanent loss.',
'(i) The passage discusses the causes and effects of deforestation in tropical regions, with specific reference to Liberia. It also explores potential solutions to deforestation.
(ii) The phrase suggests that the Amazon is vital to the Earth''s survival, producing oxygen just as lungs produce it in living organisms.
(iii) Communities lose their livelihoods; climate change is accelerated and rainfall reduced.
(iv) Community forestry programmes; international carbon credit schemes.
(v) "Irreplaceable" means impossible to replace or restore — so unique and valuable that once destroyed it is gone permanently.',
'medium', true),

-- Section C: Summary
('English Language', 2, 'structured', 'C', 'Summary Writing', 2022,
'Using the passage in Section B, write a summary of the CONSEQUENCES of deforestation, as discussed in the passage. Your summary must be in your own words and must not exceed 60 words.',
10,
'Content (5 marks): Student must identify: (1) loss of community livelihoods; (2) acceleration of climate change; (3) reduced rainfall; (4) biodiversity loss; (5) threat to food security. Award 1 mark per valid point, max 5.
Language (5 marks): Written entirely in student''s own words; no direct copying from the passage (direct lifting = 0 marks); grammatically correct; within 60-word limit. Deduct 1 mark per 10 words over limit.
Key rule: Award ZERO marks for content if student copies sentences directly from the passage.',
'Deforestation devastates forest-dependent communities, destroying their sources of food, medicine, and water. It worsens climate change and disrupts rainfall patterns, threatening agricultural production and food security. It also causes permanent loss of plant and animal species. In Liberia, these effects are particularly severe given the country''s reliance on rice cultivation and forest resources.',
'medium', true);

-- ──────────────────────────────────────────────────────────
-- BIOLOGY Paper 2 — Essay & Structured
-- Section A: 4 short compulsory questions
-- Section B: 6 essay questions, choose 4
-- ──────────────────────────────────────────────────────────
INSERT INTO questions (subject, paper_number, question_type, section, topic, year, question_text, marks, mark_scheme, model_answer, difficulty, is_active) VALUES

('Biology', 2, 'structured', 'A', 'Cell Biology', 2022,
'(a) State TWO differences between a plant cell and an animal cell.
(b) Name the organelle responsible for: (i) energy production (ii) protein synthesis.
(c) Describe the role of the cell membrane.',
10,
'(a) 2 marks: Any two of: plant cells have cell wall, animal cells do not; plant cells have chloroplasts (most), animal cells do not; plant cells have large central vacuole, animal cells have small or no vacuoles; plant cells have fixed shape, animal cells may be irregular.
(b) (i) Mitochondria (ii) Ribosome. 2 marks.
(c) 6 marks: Controls what enters and leaves the cell (selective permeability); maintains homeostasis; phospholipid bilayer with embedded proteins; allows diffusion, osmosis, active transport; communication between cells.',
'(a) Plant cells: cell wall + chloroplasts; Animal cells: no cell wall, no chloroplasts.
(b) (i) Mitochondria; (ii) Ribosome.
(c) The cell membrane is a selectively permeable phospholipid bilayer that controls the passage of substances into and out of the cell, maintaining the cell''s internal environment.',
'easy', true),

('Biology', 2, 'structured', 'A', 'Nutrition', 2021,
'(a) State the function of each of the following nutrients: (i) proteins (ii) lipids (iii) carbohydrates.
(b) Describe the test for starch, including the reagent used and the colour change observed.',
10,
'(a) Proteins: growth and repair; enzyme/hormone production. Lipids: energy storage, insulation, cell membranes. Carbohydrates: primary energy source. Award 2 marks each (1 per clear function), total 6.
(b) Test: add iodine solution; colour change from orange-brown to blue-black indicates presence of starch. Award 4 marks (2 for iodine, 2 for correct colour change).',
'(a) Proteins: growth and repair of tissues. Lipids: energy storage and insulation. Carbohydrates: primary energy source.
(b) Add iodine solution to the sample. If starch is present, the colour changes from orange-brown to blue-black.',
'easy', true),

('Biology', 2, 'structured', 'A', 'Ecology', 2022,
'The following data was collected from a woodland ecosystem:
Producers (oak trees): 10,000 kg/ha
Primary consumers (caterpillars): 1,000 kg/ha
Secondary consumers (birds): 100 kg/ha
(a) Construct a pyramid of biomass from this data.
(b) What percentage of energy is transferred from producers to primary consumers?
(c) State ONE reason why energy is lost at each trophic level.',
10,
'(a) Correct pyramid with widest base (producers 10,000), narrowing upward (1,000; 100). Award 3 marks.
(b) Transfer = (1000/10000) × 100 = 10%. Award 3 marks.
(c) Any one of: heat loss through respiration; energy used in movement; undigested food excreted; not all biomass is consumed. Award 4 marks.',
'(a) Pyramid: producers (10,000) → primary consumers (1,000) → secondary consumers (100).
(b) (1,000/10,000) × 100 = 10% efficiency.
(c) Energy is lost as heat through respiration.',
'medium', true),

('Biology', 2, 'structured', 'A', 'Genetics', 2021,
'In peas, round seeds (R) are dominant over wrinkled seeds (r).
(a) Cross a heterozygous round-seeded plant (Rr) with a wrinkled-seeded plant (rr).
(b) Draw a Punnett square showing the possible offspring.
(c) State the phenotypic ratio of the offspring.
(d) What is the probability that an offspring will be wrinkled?',
10,
'(a) Rr × rr. Award 1 mark.
(b) Correct Punnett square: gametes R, r from Rr; r, r from rr → Rr, Rr, rr, rr. Award 4 marks.
(c) Phenotypic ratio: 1 round : 1 wrinkled (50:50). Award 3 marks.
(d) Probability of wrinkled = 2/4 = 1/2 = 50%. Award 2 marks.',
'(a) Rr × rr
(b) Punnett: Rr, Rr, rr, rr
(c) Phenotypic ratio: 1 round : 1 wrinkled
(d) Probability wrinkled = 1/2',
'medium', true),

-- Section B (choose 4 of 6)
('Biology', 2, 'essay', 'B', 'Human Biology — Respiratory System', 2022,
'(a) Describe the pathway of air from the nose to the alveoli.
(b) Explain how the alveoli are adapted for efficient gas exchange. Give FOUR structural adaptations.
(c) Distinguish between breathing (ventilation) and respiration.',
20,
'(a) Nose → nasal cavity (warms, moistens, filters) → pharynx → larynx → trachea → bronchi (two) → bronchioles → alveoli. Award 4 marks for correct pathway with 4+ structures named.
(b) 8 marks for four adaptations (2 marks each): large surface area (millions of alveoli); one-cell-thick walls (thin diffusion distance); moist lining (dissolves gases); rich capillary network (short diffusion path); concentration gradient maintained by blood flow and ventilation.
(c) 8 marks: Breathing/ventilation = mechanical movement of air in and out of lungs; Respiration = chemical process in cells releasing energy from glucose using oxygen, producing CO₂ and water. Must make clear distinction.',
'(a) Air enters: nose → nasal cavity → pharynx → larynx → trachea → bronchi → bronchioles → alveoli.
(b) Adaptations: (1) very large surface area; (2) walls one cell thick; (3) moist inner surface; (4) dense capillary network to maintain diffusion gradient.
(c) Breathing: mechanical movement of air into/out of lungs. Respiration: biochemical release of energy from glucose in cells (aerobic: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP).',
'medium', true),

('Biology', 2, 'essay', 'B', 'Photosynthesis', 2021,
'(a) Write the overall equation for photosynthesis in words and in chemical symbols.
(b) Describe an experiment to investigate the effect of light intensity on the rate of photosynthesis using aquatic plants.
(c) State and explain THREE factors that can limit the rate of photosynthesis.',
20,
'(a) Words: carbon dioxide + water → glucose + oxygen (in the presence of light and chlorophyll). Chemical: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂. Award 4 marks.
(b) 8 marks: aquatic plant (Elodea) in water; light source at varying distances; count bubbles per minute; control variables (CO₂ level, temperature); repeat and average. Award marks for each valid experimental component.
(c) 8 marks: (i) Light intensity — more light → faster rate, until another factor limits. (ii) CO₂ concentration — more CO₂ → faster rate (substrate for Calvin cycle). (iii) Temperature — up to optimum (~30°C) rate increases; above optimum enzymes denature.',
'(a) CO₂ + H₂O → C₆H₁₂O₆ + O₂ (with light and chlorophyll)
(b) Place Elodea in sodium hydrogen carbonate solution; count oxygen bubbles produced per minute at varying light distances; control CO₂ and temperature; repeat.
(c) Limiting factors: light intensity (rate increases with more light); CO₂ concentration (substrate availability); temperature (enzyme activity).',
'medium', true),

('Biology', 2, 'essay', 'B', 'Reproduction', 2022,
'(a) Describe the process of fertilisation in flowering plants, including pollination.
(b) Describe the main events of the menstrual cycle in humans, including the role of hormones FSH, LH, oestrogen, and progesterone.
(c) State TWO similarities and TWO differences between sexual and asexual reproduction.',
20,
'(a) 6 marks: Pollination = transfer of pollen from anther to stigma; pollen tube grows down style; male nucleus travels to ovule; fuses with female gamete (egg cell) in ovary → zygote → seed.
(b) 8 marks: Menstrual cycle (~28 days): FSH stimulates follicle growth and oestrogen production; oestrogen rebuilds uterine lining; LH surge triggers ovulation (day 14); corpus luteum produces progesterone; progesterone maintains uterine lining; if no fertilisation, progesterone drops, lining sheds (menstruation).
(c) Similarities: 2 marks (any two of: both produce offspring; both require genetic material). Differences: 2 marks (sexual involves two parents, asexual one; sexual produces variation, asexual produces clones).',
'(a) Pollen lands on stigma → pollen tube grows → male gamete travels to ovule → fertilisation → zygote.
(b) Cycle: FSH → follicle growth + oestrogen → uterine lining rebuilds → LH surge → ovulation → corpus luteum → progesterone → maintain lining → if no fertilisation, progesterone drops → menstruation.
(c) Similarities: both produce offspring; require genetic material. Differences: sexual = 2 parents, variation; asexual = 1 parent, clones.',
'hard', true),

('Biology', 2, 'essay', 'B', 'Evolution & Classification', 2021,
'(a) Explain Darwin''s theory of evolution by natural selection, using an example.
(b) State and explain FOUR pieces of evidence that support the theory of evolution.
(c) Describe the binomial system of classification and give one example.',
20,
'(a) 6 marks: variation within species; some variations are heritable; competition for limited resources; individuals with favourable variations survive and reproduce; favourable traits become more common over generations. Example: peppered moths (pre- and post-industrial). Award marks for clear mechanism.
(b) 8 marks: Four from: fossil record (sequence of ancient organisms); comparative anatomy (homologous structures); molecular evidence (DNA similarities); embryology (similar embryonic development); observed evolution (antibiotic resistance). Award 2 marks each.
(c) 6 marks: binomial = genus + species names; Latin; universally accepted; italicised; e.g. Homo sapiens (humans).',
'(a) Natural selection: variation exists; favourable traits aid survival; survivors reproduce and pass on traits; population changes over generations. Example: peppered moth — dark moths survived industrial pollution better.
(b) Evidence: fossils; homologous structures; DNA similarities; antibiotic resistance observed.
(c) Binomial: Genus species (e.g. Homo sapiens). Genus capitalised, species lowercase, both italicised.',
'hard', true),

('Biology', 2, 'essay', 'B', 'Ecology — West Africa / Liberia', 2022,
'(a) Define the following ecological terms: ecosystem, food chain, food web, niche.
(b) Describe TWO ways in which human activity affects biodiversity in West Africa, with specific reference to Liberia.
(c) Explain why conserving biodiversity is important, giving THREE reasons.',
20,
'(a) 8 marks (2 per definition): Ecosystem = community of organisms interacting with their physical environment. Food chain = linear sequence showing energy transfer. Food web = network of interconnected food chains. Niche = role/position of an organism in its ecosystem (including what it eats and what eats it).
(b) 6 marks (3 each): Deforestation — removal of habitats for logging/agriculture destroys species; Overfishing/hunting — reduces wild populations. Must include Liberian context (rubber, iron ore, coastal fishing).
(c) 6 marks (2 each): Medical resources — many medicines derived from plants; Food security — genetic diversity of crops; ecosystem services — clean water, clean air, pollination.',
'(a) Ecosystem: community + environment. Food chain: e.g. grass → grasshopper → frog → snake. Food web: interconnected chains. Niche: organism''s role (diet, habitat, behaviour).
(b) Deforestation for rubber/logging destroys habitat. Bushmeat hunting reduces mammal populations.
(c) Biodiversity provides medicines; supports food security through crop diversity; maintains ecosystem services.',
'medium', true),

('Biology', 2, 'essay', 'B', 'Homeostasis', 2022,
'(a) Define homeostasis and explain why it is important for living organisms.
(b) Describe how the human body regulates blood glucose levels, including the roles of insulin and glucagon.
(c) Explain what happens in the body of a person with Type 1 Diabetes and how it is managed.',
20,
'(a) 4 marks: Homeostasis = maintenance of a stable internal environment despite external changes; important because enzymes work best within narrow temperature/pH ranges; all metabolic processes require stable conditions.
(b) 10 marks: After a meal, blood glucose rises; pancreas (β cells) secretes insulin; insulin stimulates glucose uptake by cells and conversion to glycogen (liver/muscle); blood glucose falls. If blood glucose too low, pancreas (α cells) secretes glucagon; glucagon stimulates glycogen breakdown to glucose; blood glucose rises.
(c) 6 marks: Type 1: immune system destroys β cells; no insulin produced; glucose cannot enter cells; hyperglycaemia; managed by insulin injections, blood glucose monitoring, carbohydrate-controlled diet.',
'(a) Homeostasis = stable internal environment. Important for enzyme function and metabolic reactions.
(b) High glucose → insulin from β cells → glucose uptake + glycogen storage → glucose falls. Low glucose → glucagon from α cells → glycogenolysis → glucose rises.
(c) Type 1: β cells destroyed → no insulin → hyperglycaemia. Management: daily insulin injections + glucose monitoring.',
'hard', true);

-- ──────────────────────────────────────────────────────────
-- CHEMISTRY Paper 2 — Theory & Calculations
-- Section A: 5 compulsory short-answer
-- Section B: 6 questions, choose 5
-- ──────────────────────────────────────────────────────────
INSERT INTO questions (subject, paper_number, question_type, section, topic, year, question_text, marks, mark_scheme, model_answer, difficulty, is_active) VALUES

('Chemistry', 2, 'structured', 'A', 'Atomic Structure', 2022,
'(a) Define the term "isotope" and give one example.
(b) An atom of element X has 17 protons and 18 neutrons. State: (i) the atomic number of X, (ii) the mass number of X, (iii) the electronic configuration of X.
(c) In which group and period of the periodic table is element X?',
10,
'(a) Isotopes: atoms of the same element with the same number of protons but different numbers of neutrons. Example: ¹²C and ¹⁴C (or ³⁵Cl and ³⁷Cl). Award 3 marks.
(b)(i) Atomic number = 17. (ii) Mass number = 17 + 18 = 35. (iii) 2, 8, 7. Award 3 marks.
(c) X has 3 electron shells → Period 3. Outermost shell has 7 electrons → Group VII (17). Award 4 marks.',
'(a) Isotopes: same element, different neutron numbers. E.g. ³⁵Cl and ³⁷Cl.
(b)(i) 17; (ii) 35; (iii) 2,8,7.
(c) Group VII, Period 3 (this is chlorine).',
'medium', true),

('Chemistry', 2, 'structured', 'A', 'Chemical Bonding', 2021,
'(a) Distinguish between ionic and covalent bonding.
(b) Draw the dot-and-cross diagram for: (i) NaCl (sodium chloride), (ii) H₂O (water).
(c) Explain why NaCl has a high melting point but H₂O has a relatively low melting point.',
10,
'(a) Ionic: transfer of electrons between metals and non-metals; electrostatic attraction between ions. Covalent: sharing of electron pairs between non-metals. Award 4 marks (2 each).
(b) NaCl: Na donates 1 electron to Cl → Na⁺ [2,8]⁺ and Cl⁻ [2,8,8]⁻. H₂O: O shares 2 pairs with 2 H atoms; 2 lone pairs on O. Award 4 marks.
(c) NaCl: giant ionic lattice; many strong electrostatic forces require large energy to break. H₂O: simple molecular; weak van der Waals/hydrogen bonds between molecules; easier to overcome. Award 2 marks.',
'(a) Ionic: electron transfer → ions; Covalent: electron sharing → molecules.
(b) NaCl: Na⁺ + Cl⁻ (dot-cross). H₂O: O with 2 shared pairs + 2 lone pairs.
(c) NaCl: giant ionic lattice, strong forces, high melting point. H₂O: simple molecule, weak intermolecular forces, low melting point.',
'medium', true),

('Chemistry', 2, 'structured', 'A', 'Mole Calculations', 2022,
'(a) Define the "mole" and state Avogadro''s number.
(b) Calculate the molar mass of Ca(OH)₂. [Ca=40, O=16, H=1]
(c) How many moles are in 37 g of Ca(OH)₂?
(d) How many molecules are in 0.5 mol of CO₂?',
10,
'(a) A mole is the amount of substance containing 6.02×10²³ particles. Award 2 marks.
(b) M(Ca(OH)₂) = 40 + 2(16+1) = 40 + 34 = 74 g/mol. Award 2 marks.
(c) n = m/M = 37/74 = 0.5 mol. Award 3 marks.
(d) Number of molecules = 0.5 × 6.02×10²³ = 3.01×10²³. Award 3 marks.',
'(a) Mole: 6.02×10²³ particles.
(b) M = 40 + 2(17) = 74 g/mol.
(c) n = 37/74 = 0.5 mol.
(d) 0.5 × 6.02×10²³ = 3.01×10²³ molecules.',
'medium', true),

('Chemistry', 2, 'structured', 'A', 'Acids, Bases and Salts', 2021,
'(a) Define: (i) an acid, (ii) a base, according to the Arrhenius theory.
(b) Complete and balance: HCl + NaOH → ___
(c) A solution has pH 3. State whether it is acidic, alkaline, or neutral, and explain what this tells us about the concentration of H⁺ ions.',
10,
'(a)(i) Acid: produces H⁺ ions in aqueous solution. (ii) Base: produces OH⁻ ions in aqueous solution. Award 4 marks.
(b) HCl + NaOH → NaCl + H₂O. Award 3 marks.
(c) pH 3 = acidic; high concentration of H⁺ ions (greater than 10⁻⁷ mol/L). Award 3 marks.',
'(a)(i) Acid: releases H⁺ in water. (ii) Base: releases OH⁻ in water.
(b) HCl + NaOH → NaCl + H₂O
(c) pH 3 = acidic. High H⁺ concentration (10⁻³ mol/L).',
'easy', true),

('Chemistry', 2, 'structured', 'A', 'Organic Chemistry — Hydrocarbons', 2022,
'(a) State the general formula for alkanes and give the name and structural formula of the first two members of the series.
(b) Describe the reaction of methane with chlorine in the presence of UV light (substitution reaction).
(c) What is cracking? Why is it industrially important?',
10,
'(a) CₙH₂ₙ₊₂. Methane CH₄; Ethane C₂H₆. Award 4 marks.
(b) CH₄ + Cl₂ → CH₃Cl + HCl; a hydrogen atom is substituted by chlorine; requires UV light to initiate reaction. Award 3 marks.
(c) Cracking: breaking large hydrocarbon molecules into smaller more useful ones (e.g. petrol, ethene) using heat and/or catalyst. Industrially important because it produces more petrol from crude oil and produces alkenes for plastics. Award 3 marks.',
'(a) CₙH₂ₙ₊₂. Methane: CH₄; Ethane: C₂H₆.
(b) CH₄ + Cl₂ → CH₃Cl + HCl (UV light, substitution).
(c) Cracking: thermal decomposition of large hydrocarbons → petrol fractions + alkenes for polymers.',
'medium', true),

-- Section B (choose 5 of 6)
('Chemistry', 2, 'essay', 'B', 'Stoichiometry', 2022,
'Consider the reaction: 2Mg(s) + O₂(g) → 2MgO(s) [Mg=24, O=16]
(a) Balance this equation (it is already balanced — confirm and explain what it tells you).
(b) Calculate the mass of MgO produced when 12 g of Mg burns completely.
(c) What volume of O₂ (at STP) is required to react with 12 g of Mg? [Molar volume at STP = 22.4 L/mol]
(d) If only 8 g of MgO is actually obtained, calculate the percentage yield.',
20,
'(a) Equation is balanced: 2 mol Mg reacts with 1 mol O₂ to produce 2 mol MgO. Award 2 marks for confirming with mole ratios.
(b) Moles Mg = 12/24 = 0.5 mol. From equation, 0.5 mol Mg → 0.5 mol MgO. Mass MgO = 0.5 × 40 = 20 g. Award 6 marks.
(c) Moles O₂ = 0.5/2 = 0.25 mol. Volume = 0.25 × 22.4 = 5.6 L. Award 6 marks.
(d) Theoretical yield = 20 g. % yield = (8/20) × 100 = 40%. Award 6 marks.',
'(a) Balanced: 2Mg + O₂ → 2MgO (mole ratio 2:1:2).
(b) n(Mg) = 0.5 mol → n(MgO) = 0.5 mol → mass = 0.5 × 40 = 20 g.
(c) n(O₂) = 0.25 mol → V = 0.25 × 22.4 = 5.6 L.
(d) % yield = 8/20 × 100 = 40%.',
'hard', true),

('Chemistry', 2, 'essay', 'B', 'Electrochemistry', 2021,
'(a) Define electrolysis and name the four components of an electrolytic cell.
(b) During the electrolysis of aqueous copper(II) sulphate using copper electrodes: describe what happens at the anode and at the cathode.
(c) State TWO industrial applications of electrolysis.
(d) Write the half-equations for the reactions at each electrode during the electrolysis of molten NaCl.',
20,
'(a) Electrolysis: decomposition of a compound by passing an electric current through it in molten or aqueous form. Components: electrolyte, anode (positive), cathode (negative), external power source. Award 5 marks.
(b) Cathode: Cu²⁺ + 2e⁻ → Cu; copper deposited. Anode: Cu → Cu²⁺ + 2e⁻; copper dissolves. Mass of anode decreases, mass of cathode increases. Award 7 marks.
(c) Electroplating; purification of copper; extraction of aluminium; electrolysis of brine. Award 4 marks (2 each).
(d) Cathode: Na⁺ + e⁻ → Na. Anode: 2Cl⁻ → Cl₂ + 2e⁻. Award 4 marks.',
'(a) Electrolysis: uses electric current to cause chemical change. Components: electrolyte, anode, cathode, power source.
(b) Cathode: Cu²⁺ + 2e⁻ → Cu (deposited). Anode: Cu → Cu²⁺ + 2e⁻ (dissolved).
(c) Electroplating; copper purification.
(d) Cathode: Na⁺ + e⁻ → Na; Anode: 2Cl⁻ → Cl₂ + 2e⁻.',
'hard', true),

('Chemistry', 2, 'essay', 'B', 'Rates of Reaction', 2022,
'(a) State FOUR factors that affect the rate of a chemical reaction.
(b) Describe an experiment to investigate the effect of concentration on the reaction between sodium thiosulphate and hydrochloric acid, including how you would measure the rate.
(c) Explain, using collision theory, why increasing temperature increases the rate of reaction.',
20,
'(a) Concentration; temperature; surface area (particle size); catalyst; light (for some reactions). Award 4 marks (1 each, max 4).
(b) 10 marks: Na₂S₂O₃ + HCl → S precipitate (cloudy); draw cross under flask; time until cross disappears; vary concentration of Na₂S₂O₃; keep other variables constant; record time, calculate 1/time as rate. Award marks for: correct reagents, measurement method, independent/dependent variables, controls.
(c) 6 marks: Higher temperature → particles have more kinetic energy → move faster → more frequent collisions → more collisions exceed activation energy → more successful collisions per second → faster rate.',
'(a) Temperature; concentration; surface area; catalyst.
(b) Na₂S₂O₃ + HCl → sulphur precipitate. Place cross on paper under flask; vary Na₂S₂O₃ concentration; time until cross disappears; rate = 1/time.
(c) Higher temperature → more kinetic energy → faster particles → more frequent collisions above activation energy.',
'medium', true),

('Chemistry', 2, 'essay', 'B', 'Environmental Chemistry', 2022,
'(a) Describe the greenhouse effect and explain how human activities are intensifying it.
(b) Name THREE greenhouse gases and state their sources.
(c) State and explain THREE consequences of global warming.
(d) Suggest TWO ways to reduce greenhouse gas emissions relevant to Liberia.',
20,
'(a) 6 marks: Sun radiates short-wave radiation → Earth absorbs and re-emits long-wave infrared → greenhouse gases trap heat → Earth stays warm. Human activities (burning fossil fuels, deforestation) increase CO₂ levels → more heat trapped → warming.
(b) 6 marks (2 each): CO₂ (fossil fuels/deforestation); CH₄ (cattle/rice paddies/landfills); N₂O (fertilisers); H₂O vapour; CFCs (aerosols). Any three.
(c) 4 marks: Rising sea levels (ice melting); more extreme weather events; changes in rainfall patterns; species extinction. Any two, with explanation.
(d) 4 marks: Reduce deforestation/increase reforestation; use of solar/hydroelectric energy instead of fossil fuels; reduce burning of charcoal for cooking. Accept any relevant Liberian context.',
'(a) Greenhouse gases trap outgoing infrared radiation, warming Earth. Human activities increase CO₂/CH₄ levels.
(b) CO₂ (fossil fuels); CH₄ (cattle/wetlands); N₂O (fertilisers).
(c) Sea level rise; extreme weather; biodiversity loss.
(d) Reforestation programmes; switch to solar/hydro energy.',
'medium', true),

('Chemistry', 2, 'essay', 'B', 'Periodic Table Trends', 2021,
'(a) Describe how atomic radius, electronegativity, and ionisation energy change across Period 3 (Na to Cl) and explain these trends.
(b) Describe the reactions of sodium, magnesium, and aluminium with water or dilute acid, and explain the trend in reactivity.
(c) Compare the physical properties (state, melting point, electrical conductivity) of sodium (Na) and silicon (Si) and explain the differences in terms of structure and bonding.',
20,
'(a) 9 marks: Atomic radius decreases (increasing nuclear charge, same shielding). Electronegativity increases (stronger nuclear attraction for electrons). First ionisation energy generally increases (electrons held more tightly). Allow exceptions (dips at Mg/Al and P/S).
(b) 7 marks: Na reacts vigorously with water (fizzes, floats, catches fire): 2Na + 2H₂O → 2NaOH + H₂. Mg reacts slowly with cold water, quickly with steam. Al reacts with dilute acid (with oxide layer). Trend: reactivity decreases Na > Mg > Al (increasing nuclear charge, harder to lose electrons).
(c) 4 marks: Na: metallic structure, metallic bonding → good conductor, lower melting point than Si. Si: giant covalent (macromolecular) structure → very high melting point, poor conductor.',
'(a) Across Period 3: atomic radius decreases; ionisation energy increases; electronegativity increases (more protons, same shielding).
(b) Na + H₂O → NaOH + H₂ (vigorous). Mg + H₂O → slow. Al + HCl → reacts. Reactivity: Na > Mg > Al.
(c) Na: metallic bonding, conducts, melts ~98°C. Si: giant covalent, ~1410°C melting point, semiconductor.',
'hard', true),

('Chemistry', 2, 'essay', 'B', 'Organic Chemistry — Polymers', 2022,
'(a) Distinguish between addition polymerisation and condensation polymerisation, giving one example of each.
(b) Draw the structural formula of the repeating unit of poly(ethene) and name the monomer.
(c) State THREE problems caused by plastic waste in the environment and suggest TWO solutions.
(d) Name and describe ONE natural polymer and state its biological function.',
20,
'(a) 6 marks: Addition: monomers with C=C bonds join, no other product. Example: poly(ethene) from ethene. Condensation: monomers join releasing small molecule (H₂O or HCl). Example: nylon, polyester.
(b) 4 marks: Monomer = ethene (CH₂=CH₂). Repeating unit: –[CH₂–CH₂]ₙ–.
(c) 6 marks: Litter/visual pollution; clogging waterways; harm to marine life; release of toxic chemicals; slow decomposition. Two solutions: biodegradable plastics; recycling programmes; banning single-use plastics.
(d) 4 marks: DNA/protein/starch/cellulose — any one, with biological function (DNA: genetic information; protein: structure/enzymes; starch: energy storage in plants; cellulose: structural in plant cell walls).',
'(a) Addition: ethene → poly(ethene), no byproduct. Condensation: amino acids → protein + H₂O.
(b) Monomer: ethene. Repeating unit: –CH₂–CH₂–.
(c) Problems: marine pollution, blocked drains, toxins. Solutions: recycling, biodegradable alternatives.
(d) DNA: stores and transmits genetic information.',
'medium', true);

-- ──────────────────────────────────────────────────────────
-- PHYSICS Paper 2 — Theory & Calculations
-- Section A: 5 compulsory short structured
-- Section B: 5 questions, choose 4
-- Key rule: ALL calculations MUST show formula → substitution → working → answer with unit
-- ──────────────────────────────────────────────────────────
INSERT INTO questions (subject, paper_number, question_type, section, topic, year, question_text, marks, mark_scheme, model_answer, difficulty, is_active) VALUES

('Physics', 2, 'structured', 'A', 'Mechanics — Speed & Acceleration', 2022,
'A car starts from rest and reaches a velocity of 30 m/s in 10 seconds.
(a) Calculate the acceleration of the car.
(b) If the car maintains this acceleration, what is its velocity after 15 seconds?
(c) Calculate the distance travelled in the first 10 seconds.',
10,
'RULE: Award full marks only when formula → substitution → working → answer WITH unit is shown.
(a) a = (v−u)/t = (30−0)/10 = 3 m/s². [Formula 1 mark; substitution 1 mark; answer with unit 1 mark]
(b) v = u + at = 0 + 3×15 = 45 m/s. [3 marks same structure]
(c) s = ut + ½at² = 0 + ½×3×100 = 150 m. OR s = (u+v)/2 × t = 15×10 = 150 m. [4 marks]',
'(a) a = (v−u)/t = (30−0)/10 = 3 m/s²
(b) v = u + at = 0 + 3×15 = 45 m/s
(c) s = ½at² = ½ × 3 × 100 = 150 m',
'medium', true),

('Physics', 2, 'structured', 'A', 'Forces — Newton''s Laws', 2021,
'(a) State Newton''s three laws of motion.
(b) A force of 50 N acts on a mass of 10 kg. Calculate the acceleration produced.
(c) A 5 kg object rests on a surface. Calculate its weight. [g = 10 m/s²]',
10,
'(a) First: an object at rest or moving at constant velocity remains so unless acted upon by an unbalanced force. Second: F = ma. Third: for every action there is an equal and opposite reaction. Award 4 marks (1.5 each, rounded).
(b) a = F/m = 50/10 = 5 m/s². Show formula, substitution, unit. Award 3 marks.
(c) W = mg = 5 × 10 = 50 N. Formula, substitution, unit. Award 3 marks.',
'(a) 1st: inertia. 2nd: F=ma. 3rd: equal and opposite reactions.
(b) a = F/m = 50/10 = 5 m/s²
(c) W = mg = 5 × 10 = 50 N',
'easy', true),

('Physics', 2, 'structured', 'A', 'Heat — Specific Heat Capacity', 2022,
'(a) Define specific heat capacity and state its SI unit.
(b) Calculate the heat energy required to raise the temperature of 2 kg of water from 20°C to 80°C. [Specific heat capacity of water = 4200 J/kg°C]
(c) A 500 g aluminium block absorbs 9000 J of heat energy and its temperature rises by 20°C. Calculate the specific heat capacity of aluminium.',
10,
'(a) Specific heat capacity (c): energy needed to raise the temperature of 1 kg of a substance by 1°C (or 1 K). Unit: J/(kg·°C) or J/kg·K. Award 3 marks.
(b) Q = mcΔT = 2 × 4200 × (80−20) = 2 × 4200 × 60 = 504,000 J = 504 kJ. Award 4 marks (formula 1, substitution 1, working 1, answer+unit 1).
(c) c = Q/(mΔT) = 9000/(0.5 × 20) = 9000/10 = 900 J/kg°C. Award 3 marks.',
'(a) c = energy per kg per °C rise. Unit: J/kg°C.
(b) Q = mcΔT = 2 × 4200 × 60 = 504,000 J
(c) c = Q/(mΔT) = 9000/(0.5 × 20) = 900 J/kg°C',
'medium', true),

('Physics', 2, 'structured', 'A', 'Electricity — Ohm''s Law', 2021,
'(a) State Ohm''s Law.
(b) A resistor has a potential difference of 12 V across it and carries a current of 2 A. Calculate its resistance.
(c) In a series circuit, three resistors of 4Ω, 6Ω, and 10Ω are connected to a 40 V supply. Calculate: (i) total resistance, (ii) current through the circuit.',
10,
'(a) Ohm''s Law: the current through a conductor is directly proportional to the potential difference across it, at constant temperature. V = IR. Award 2 marks.
(b) R = V/I = 12/2 = 6 Ω. Formula, substitution, answer with unit. Award 3 marks.
(c)(i) R_total = 4 + 6 + 10 = 20 Ω. Award 2 marks.
(ii) I = V/R = 40/20 = 2 A. Formula, substitution, answer with unit. Award 3 marks.',
'(a) V = IR at constant temperature.
(b) R = 12/2 = 6 Ω
(c)(i) R_total = 20 Ω; (ii) I = 40/20 = 2 A',
'easy', true),

('Physics', 2, 'structured', 'A', 'Waves', 2022,
'(a) State the relationship between frequency, wavelength, and wave speed.
(b) A wave has a frequency of 500 Hz and a wavelength of 0.68 m. Calculate its speed.
(c) State TWO differences between transverse and longitudinal waves, giving an example of each.',
10,
'(a) v = fλ (wave speed = frequency × wavelength). Award 2 marks.
(b) v = fλ = 500 × 0.68 = 340 m/s. Formula, substitution, answer with unit. Award 4 marks.
(c) Transverse: vibration perpendicular to direction of travel; e.g. light/water waves. Longitudinal: vibration parallel to direction of travel; e.g. sound. Award 4 marks (1 mark per valid point).',
'(a) v = fλ
(b) v = 500 × 0.68 = 340 m/s
(c) Transverse: vibration perpendicular, e.g. light. Longitudinal: vibration parallel, e.g. sound.',
'easy', true),

-- Section B (choose 4 of 5)
('Physics', 2, 'essay', 'B', 'Mechanics — Work, Energy, Power', 2022,
'(a) Define work, energy, and power, giving the formula and SI unit for each.
(b) A 60 kg student climbs a staircase of height 4 m in 8 seconds. [g = 10 m/s²]
Calculate: (i) work done against gravity, (ii) power developed.
(c) Explain the principle of conservation of energy, using a falling ball as an example.
(d) A ball of mass 0.5 kg is thrown upwards with an initial velocity of 20 m/s. Calculate its maximum height. [Ignore air resistance]',
20,
'(a) Work = force × distance (J); Energy = capacity to do work (J); Power = work/time (W). Award 6 marks (2 each — formula and unit).
(b)(i) W = mgh = 60 × 10 × 4 = 2400 J. Award 4 marks (formula, substitution, working, unit).
(ii) P = W/t = 2400/8 = 300 W. Award 4 marks.
(c) Energy cannot be created or destroyed, only converted. Falling ball: KE increases as PE decreases; at bottom, KE = initial PE. Award 3 marks.
(d) Using v² = u² − 2gh: 0 = 400 − 2×10×h → h = 400/20 = 20 m. Award 3 marks.',
'(a) Work = Fd (J); Energy (J); Power = W/t (W).
(b)(i) W = 60×10×4 = 2400 J; (ii) P = 2400/8 = 300 W
(c) PE converts to KE as ball falls; total energy conserved.
(d) v² = u² − 2gh → h = 400/20 = 20 m',
'medium', true),

('Physics', 2, 'essay', 'B', 'Electricity — Circuits & Power', 2021,
'(a) Distinguish between EMF and terminal voltage of a battery.
(b) Three resistors (6Ω, 12Ω, 4Ω) are connected: first two in parallel, then that combination in series with the third.
Calculate: (i) resistance of parallel combination, (ii) total circuit resistance.
(c) If the supply voltage is 24 V: calculate the (i) total current from the supply, (ii) power dissipated by the 4Ω resistor.
(d) State Kirchhoff''s first law.',
20,
'(a) EMF = total energy per coulomb provided by source. Terminal voltage = EMF − internal resistance × current; accounts for internal resistance drop. Award 4 marks.
(b)(i) 1/R_p = 1/6 + 1/12 = 2/12 + 1/12 = 3/12; R_p = 4Ω. Award 4 marks.
(ii) R_total = 4 + 4 = 8Ω. Award 2 marks.
(c)(i) I = V/R = 24/8 = 3 A. Award 3 marks.
(ii) P = I²R = 3² × 4 = 36 W. Award 4 marks.
(d) Kirchhoff''s 1st law: the sum of currents entering a junction equals the sum leaving. Award 3 marks.',
'(a) EMF: total energy per charge from source. Terminal voltage = EMF − Ir.
(b)(i) 1/R_p = 1/6 + 1/12 = 4Ω; (ii) R_total = 4 + 4 = 8Ω.
(c)(i) I = 24/8 = 3 A; (ii) P = 3² × 4 = 36 W.
(d) Sum of currents in = sum of currents out at any junction.',
'hard', true),

('Physics', 2, 'essay', 'B', 'Light — Refraction & Lenses', 2022,
'(a) State Snell''s Law of refraction.
(b) A ray of light travels from water (n=1.33) into glass (n=1.5) at an angle of incidence of 30°. Calculate the angle of refraction.
(c) Draw a ray diagram showing how a convex lens forms a real, inverted image when an object is placed beyond the focal point.
(d) State ONE use each of a convex lens and a concave mirror in everyday life.',
20,
'(a) n₁sinθ₁ = n₂sinθ₂; the ratio sin(i)/sin(r) = n₂/n₁ is constant. Award 3 marks.
(b) 1.33 × sin30° = 1.5 × sinθ_r → sin θ_r = (1.33 × 0.5)/1.5 = 0.6650/1.5 = 0.4433 → θ_r = arcsin(0.4433) ≈ 26.3°. Award 6 marks (formula 2, substitution 2, answer + unit 2).
(c) 6 marks: object beyond F; two rays — one parallel to axis (refracts through F), one through optical centre (straight); image formed on other side of lens, inverted, real. Award marks for correct ray paths and correctly placed image.
(d) Convex lens: camera/eye/magnifying glass. Concave mirror: car headlight/shaving mirror. Award 2 marks each.',
'(a) n₁sinθ₁ = n₂sinθ₂
(b) sin θ_r = 1.33×0.5/1.5 = 0.4433; θ_r ≈ 26.3°
(c) Ray diagram: parallel ray → through F; centre ray → straight; real inverted image beyond F on other side.
(d) Convex: camera. Concave mirror: headlight.',
'hard', true),

('Physics', 2, 'essay', 'B', 'Modern Physics — Radioactivity', 2021,
'(a) Describe the three types of nuclear radiation (alpha, beta, gamma) in terms of: composition, charge, mass, penetrating power, and ionising ability.
(b) A radioactive isotope has a half-life of 12 years. If the initial activity is 800 Bq, what is the activity after: (i) 12 years, (ii) 36 years?
(c) State TWO medical uses and ONE industrial use of radioactivity.
(d) Write a balanced nuclear equation for alpha decay of ²²⁶Ra (Radium, Z=88).',
20,
'(a) 9 marks (3 each): Alpha: 2 protons + 2 neutrons (He nucleus), +2 charge, mass 4 amu, stopped by paper, high ionising. Beta: electron, −1 charge, ~0 mass, stopped by 3mm Al, moderate ionising. Gamma: electromagnetic radiation, 0 charge, 0 mass, partially stopped by lead/concrete, low ionising.
(b)(i) After 1 half-life (12 yr): 800/2 = 400 Bq. Award 3 marks.
(ii) After 3 half-lives (36 yr): 800/2³ = 800/8 = 100 Bq. Award 3 marks.
(c) Medical: cancer treatment (radiotherapy); diagnosis (medical tracers/PET scan). Industrial: thickness control in manufacturing; sterilisation; carbon-14 dating. Award 4 marks (2 each).
(d) ²²⁶Ra → ⁴He + ²²²Rn. Atomic: 88 → 2 + 86. Mass: 226 → 4 + 222. Award 4 marks.',
'(a) Alpha: ⁴He, +2, paper stops it. Beta: e⁻, −1, Al stops it. Gamma: EM wave, no charge, lead needed.
(b)(i) 400 Bq; (ii) 100 Bq.
(c) Medical: radiotherapy; tracers. Industrial: thickness gauging.
(d) ²²⁶₈₈Ra → ⁴₂He + ²²²₈₆Rn',
'hard', true),

('Physics', 2, 'essay', 'B', 'Magnetism & Electromagnetism', 2022,
'(a) State and explain Faraday''s law of electromagnetic induction.
(b) Describe, with a diagram, how a simple AC generator works.
(c) A transformer has 200 turns on the primary coil and 50 turns on the secondary coil. The primary voltage is 240 V.
Calculate: (i) the secondary voltage, (ii) the secondary current if the primary current is 0.5 A (assume 100% efficiency).
(d) Explain why transformers are important in power transmission.',
20,
'(a) 4 marks: An EMF is induced in a conductor when it is in a changing magnetic flux. EMF is proportional to the rate of change of flux. Must include "changing" and "rate of change".
(b) 6 marks: rotating coil between magnets; slip rings and brushes; as coil rotates, flux changes; current reverses direction every half revolution → AC output. Diagram with coil, magnets, slip rings.
(c)(i) Vs/Vp = Ns/Np → Vs = 240 × (50/200) = 60 V. Award 4 marks.
(ii) From power: Vp × Ip = Vs × Is → Is = (240 × 0.5)/60 = 2 A. Award 4 marks.
(d) 2 marks: Transformers allow voltage to be stepped up for efficient long-distance transmission (less current, less power loss in cables), then stepped down for safe use.',
'(a) EMF induced when magnetic flux changes; proportional to rate of change.
(b) Rotating coil in field; slip rings; EMF induced reversing every half turn → AC.
(c)(i) Vs = 240 × 50/200 = 60 V; (ii) Is = 240×0.5/60 = 2 A.
(d) Step up voltage → reduce current → reduce I²R power loss in cables.',
'hard', true);

-- ──────────────────────────────────────────────────────────
-- ECONOMICS Paper 2 — Essay & Structured
-- Section A: 8 questions, choose 5 (20 marks each)
-- ──────────────────────────────────────────────────────────
INSERT INTO questions (subject, paper_number, question_type, section, topic, year, question_text, marks, mark_scheme, model_answer, difficulty, is_active) VALUES

('Economics', 2, 'essay', 'A', 'Supply & Demand', 2022,
'(a) Using a demand-supply diagram, explain what happens to the equilibrium price and quantity of palm oil in Liberia when a drought destroys palm plantations.
(b) Distinguish between a change in quantity demanded and a change in demand.
(c) State THREE non-price factors that affect the demand for a good.',
20,
'(a) 8 marks: Supply decreases (shifts left); with demand unchanged, equilibrium price rises and equilibrium quantity falls. Full marks require: correct diagram (labelled axes, D and S curves, shift in S, new equilibrium P and Q), plus verbal explanation.
(b) 6 marks: Change in quantity demanded = movement along demand curve due to price change. Change in demand = shift of entire demand curve due to non-price factors.
(c) 6 marks: Income; prices of substitutes/complements; taste/preferences; population; advertising/expectations. Any three, 2 marks each.',
'(a) Drought → supply decreases → S curve shifts left → equilibrium price rises, equilibrium quantity falls.
(b) Quantity demanded: movement along curve (price change). Demand: shift of curve (non-price factors).
(c) Income; prices of related goods; consumer preferences.',
'medium', true),

('Economics', 2, 'essay', 'A', 'Elasticity', 2021,
'(a) Define price elasticity of demand (PED) and state its formula.
(b) The price of rice in Monrovia rises from $0.50 to $0.60 per cup, and the quantity demanded falls from 1000 to 800 cups per day. Calculate the PED.
(c) Is rice elastic or inelastic? Explain what this means for a government considering a tax on rice.
(d) Distinguish between price elastic and price inelastic demand, giving one example of each.',
20,
'(a) PED = % change in Qd / % change in P. Award 4 marks.
(b) % ΔQd = (800−1000)/1000 × 100 = −20%. % ΔP = (0.60−0.50)/0.50 × 100 = 20%. PED = −20/20 = −1. Ignore sign → PED = 1 (unit elastic). Award 6 marks.
(c) PED = 1: unit elastic. A tax increases price; total revenue stays roughly constant. Burden split between consumers and producers. For a staple food, burden falls heavily on the poor — regressive effect. Award 4 marks.
(d) Elastic: |PED| > 1; consumers are responsive to price; example: luxury goods. Inelastic: |PED| < 1; consumers are unresponsive; example: medicines, petrol. Award 6 marks.',
'(a) PED = %ΔQd / %ΔP
(b) PED = −20% / 20% = −1 (unit elastic)
(c) Unit elastic: tax revenue impact neutral; burden on poor consumers.
(d) Elastic: |PED|>1 (luxury goods). Inelastic: |PED|<1 (medicines).',
'hard', true),

('Economics', 2, 'essay', 'A', 'National Income', 2022,
'(a) Define Gross Domestic Product (GDP) and explain ONE limitation of using GDP as a measure of living standards.
(b) State THREE components of aggregate demand (AD).
(c) Using the expenditure approach, the following data is available for Liberia (in millions of USD): Consumption = 1800; Investment = 400; Government Spending = 600; Exports = 300; Imports = 250. Calculate GDP.
(d) Distinguish between nominal GDP and real GDP.',
20,
'(a) GDP = total monetary value of all goods and services produced in a country in a year. Limitation: does not account for income distribution/inequality; ignores informal economy; does not measure wellbeing. Award 5 marks.
(b) Consumption (C); Investment (I); Government spending (G); Net exports (X−M). Any three: 3 marks.
(c) GDP = C + I + G + (X − M) = 1800 + 400 + 600 + (300 − 250) = 2800 + 50 = 2850 USD million. Award 6 marks.
(d) Nominal GDP: measured at current prices; affected by inflation. Real GDP: adjusted for inflation; allows comparison over time. Award 6 marks.',
'(a) GDP: total value of production in a year. Limitation: ignores inequality.
(b) C, I, G, (X−M).
(c) GDP = 1800 + 400 + 600 + 50 = 2850 million USD.
(d) Nominal: current prices. Real: inflation-adjusted.',
'medium', true),

('Economics', 2, 'essay', 'A', 'Money & Banking', 2021,
'(a) State FOUR functions of money.
(b) Explain the process of credit creation by commercial banks, using a simple numerical example starting with an initial deposit of $1000 and a reserve requirement of 10%.
(c) Distinguish between the functions of a central bank and a commercial bank.
(d) State TWO instruments of monetary policy a central bank can use to reduce inflation.',
20,
'(a) Medium of exchange; store of value; unit of account; standard of deferred payment. Award 4 marks.
(b) Deposit $1000; bank keeps $100 (10%), lends $900; $900 deposited, bank keeps $90, lends $810... Credit multiplier = 1/0.10 = 10; total money created = $10,000. Award 6 marks.
(c) Central bank: lender of last resort; controls money supply; issues currency; manages national reserves; regulates banks. Commercial bank: accepts deposits; gives loans; provides services to public. Award 6 marks.
(d) Raise interest rates (reduces borrowing); increase reserve requirements; open market operations (sell bonds). Any two: 4 marks.',
'(a) Medium of exchange; store of value; unit of account; deferred payment.
(b) $1000 → lend $900 → $900 deposit → lend $810 etc. Total credit = $10,000 (multiplier = 10).
(c) Central: issues currency, controls money supply. Commercial: takes deposits, gives loans.
(d) Raise interest rates; sell government bonds.',
'hard', true),

('Economics', 2, 'essay', 'A', 'International Trade', 2022,
'(a) State THREE advantages of international trade for Liberia.
(b) Explain the theory of comparative advantage with a simple numerical example involving two countries and two goods.
(c) What is a tariff? State ONE advantage and ONE disadvantage of tariff protection for a developing country.
(d) Describe the Balance of Payments (BOP) and distinguish between the current account and capital account.',
20,
'(a) Access to wider markets; economies of scale; technology transfer; foreign exchange earnings; specialisation. Any three: 6 marks.
(b) Comparative advantage: a country should produce goods at a lower opportunity cost. Example: if Country A produces cloth cheaper relative to wine and Country B produces wine cheaper relative to cloth — both benefit from trade and specialising. Full numerical example with opportunity costs: 6 marks.
(c) Tariff: tax on imported goods. Advantage: protects infant industries; generates government revenue. Disadvantage: retaliatory tariffs; higher prices for consumers; inefficiency. Award 4 marks.
(d) BOP: record of all economic transactions between a country and the world. Current account: trade in goods/services, income, transfers. Capital account: flows of investment (FDI, portfolio). Award 4 marks.',
'(a) Foreign exchange; specialisation; technology access.
(b) Comparative advantage example: Country A: 1 cloth = 2 wine opportunity cost; Country B: 1 wine = 2 cloth. Both benefit from specialising.
(c) Tariff: import tax. Protects infant industries (pro); higher consumer prices (con).
(d) BOP: current (goods/services) + capital (investment flows).',
'hard', true),

('Economics', 2, 'essay', 'A', 'Poverty & Development', 2022,
'(a) Distinguish between absolute poverty and relative poverty.
(b) Identify and explain FOUR causes of poverty in Liberia.
(c) Suggest and explain THREE policies a government could use to reduce poverty.
(d) What is the Human Development Index (HDI) and what does it measure?',
20,
'(a) Absolute poverty: income below minimum needed for survival (e.g. World Bank $2.15/day line). Relative poverty: income below a proportion of average national income. Award 4 marks.
(b) Causes (any four, 3 marks each, max 12): lack of education/skills; political instability/conflict; poor infrastructure; low agricultural productivity; dependence on commodity exports (rubber, iron ore, timber); limited industrial development; healthcare costs; corruption. Must relate to Liberia for full marks.
(c) Policies (4 marks): free/subsidised education; healthcare provision; microfinance; rural development; cash transfers; agricultural support; job creation. Any three with explanation.
(d) HDI: composite measure of development considering: life expectancy (health), education (years of schooling), and income (GNI per capita). Ranges 0 to 1. Award 4 marks.',
'(a) Absolute poverty: below survival income line. Relative poverty: below national average proportion.
(b) Low education; infrastructure deficits; conflict history; commodity dependency.
(c) Free education; healthcare; rural development investment.
(d) HDI: life expectancy + education + income index.',
'medium', true),

('Economics', 2, 'essay', 'A', 'Economic Development', 2021,
'(a) Distinguish between economic growth and economic development.
(b) Explain the role of rubber and iron ore in Liberia''s economy.
(c) State FOUR characteristics of developing economies like Liberia.
(d) Explain how foreign direct investment (FDI) can help and hinder Liberia''s development.',
20,
'(a) Growth: increase in real GDP. Development: improvement in living standards, health, education, and equality — wider concept. Award 4 marks.
(b) Rubber: historically Liberia''s main export; important for foreign exchange but vulnerable to price shocks; exploited by Firestone concession; employs many rural workers. Iron ore: major export; mining generates GDP but enclave economy (profit repatriated); little local processing. Award 6 marks.
(c) Low income per capita; high population growth; large informal sector; dependence on primary exports; low industrialisation; poor infrastructure; brain drain; high unemployment. Any four: 4 marks.
(d) Advantages: capital inflows; technology transfer; employment creation; tax revenues. Disadvantages: profits repatriated; may exploit resources without development; environmental damage; "resource curse." Award 6 marks.',
'(a) Growth: GDP increase. Development: broader wellbeing improvement.
(b) Rubber and iron ore: main exports, foreign exchange earners, vulnerable to price shocks, limited linkages.
(c) Low income, informal sector, commodity dependence, low industrialisation.
(d) FDI pros: capital, jobs, tech. Cons: profit repatriation, resource exploitation.',
'medium', true),

('Economics', 2, 'essay', 'A', 'Public Finance', 2022,
'(a) Distinguish between a direct tax and an indirect tax, giving one example of each.
(b) State THREE objectives of government taxation.
(c) Explain what is meant by a "budget deficit" and explain how a government might finance it.
(d) Discuss ONE benefit and ONE drawback of government borrowing to finance a budget deficit.',
20,
'(a) Direct tax: paid directly by the person/firm; e.g. income tax, corporation tax. Indirect tax: passed on to consumers through prices; e.g. VAT, customs duty. Award 4 marks.
(b) Revenue collection; income redistribution; control inflation; protect infant industries; fund public goods. Any three: 6 marks.
(c) Budget deficit: government expenditure exceeds government revenue. Financed by: borrowing (issuing bonds); printing money; using foreign reserves. Award 6 marks.
(d) Benefit: funds infrastructure/development spending without raising taxes. Drawback: interest payments burden future taxpayers; may crowd out private investment; risk of debt crisis. Award 4 marks.',
'(a) Direct: income tax (payer = bearer). Indirect: VAT (shifted to consumer).
(b) Revenue; redistribution; economic management.
(c) Deficit = spending > revenue. Financed by bonds/borrowing.
(d) Benefit: development investment. Drawback: future debt burden.',
'medium', true);

-- ──────────────────────────────────────────────────────────
-- GEOGRAPHY Paper 2 — Essay: Physical & Human Geography
-- Section A: 3 physical, choose 2 (each 25 marks)
-- Section B: 3 human/regional, choose 2 (each 25 marks)
-- ──────────────────────────────────────────────────────────
INSERT INTO questions (subject, paper_number, question_type, section, topic, year, question_text, marks, mark_scheme, model_answer, difficulty, is_active) VALUES

('Geography', 2, 'essay', 'A', 'Physical Geography — Climate', 2022,
'(a) Explain the formation of convectional rainfall, using a labelled diagram.
(b) Describe the characteristics of the tropical monsoon climate, with reference to West Africa.
(c) Explain how the Harmattan wind affects Liberia''s climate and population.',
25,
'(a) 8 marks: Solar heating warms ground; surface air heats and rises; air cools adiabatically; condensation at dew point; cumulonimbus clouds form; heavy, short-lived rainfall with thunder. Correct diagram with arrows, labels, cloud formation: 4 diagram marks + 4 explanation marks.
(b) 10 marks: Characteristics include: distinct wet and dry seasons; wet season June–September (SW monsoon); dry season November–March (NE Harmattan/dry); high temperatures year-round (25–30°C); high annual rainfall (1500–3000mm). Reference to ITCZ movement.
(c) 7 marks: Harmattan = NE trade wind from Sahara; dry, dusty, cool; brings dust haze (reducing visibility); can cause respiratory problems; reduces humidity (drying effect on crops and skin); limits agricultural production during its passage.',
'(a) Diagram: sun heats ground → air rises → cooling → condensation → cumulus → cumulonimbus → heavy rain.
(b) West African monsoon: wet (Jun–Sep) and dry (Nov–Mar) seasons; ITCZ movement drives rainfall pattern.
(c) Harmattan: NE wind from Sahara; brings dust, reduces humidity and visibility; affects health and agriculture.',
'medium', true),

('Geography', 2, 'essay', 'A', 'Physical Geography — Rivers', 2022,
'(a) Describe the THREE stages of a river''s course (upper, middle, lower) and the features formed in each stage.
(b) Explain how a meander forms and how an ox-bow lake develops from a meander.
(c) Name TWO major rivers in Liberia and describe ONE economic use of each.',
25,
'(a) 12 marks: Upper: steep gradient, V-shaped valley, waterfalls, potholes, interlocking spurs — erosion dominant (vertical). Middle: gentler gradient, meanders, broader valley, floodplain — lateral erosion and some deposition. Lower: flat gradient, wide floodplain, ox-bow lakes, delta/estuary at mouth — deposition dominant. 4 marks per stage.
(b) 8 marks: Meander = bend in river; erosion on outer (concave) bank, deposition on inner (convex) bank; bend becomes more pronounced; neck narrows; flood cuts off neck; ox-bow lake = isolated meander.
(c) 5 marks: St. Paul River: hydroelectric power/irrigation/fishing. Mano River: fishing/transport/boundary marker. Lofa River: hydropower/agriculture. Any two Liberian rivers with valid uses.',
'(a) Upper: waterfalls, V-valley (erosion). Middle: meanders, floodplain (lateral erosion). Lower: delta, wide plain (deposition).
(b) Erosion on outer bend, deposition inner; neck cut off → ox-bow lake.
(c) St. Paul: hydropower. Mano: boundary/fishing.',
'medium', true),

('Geography', 2, 'essay', 'A', 'Physical Geography — Rocks & Soils', 2021,
'(a) Classify rocks into THREE types and give TWO examples of each.
(b) Describe the processes of physical and chemical weathering, giving one example of each.
(c) Explain why Liberia''s soils are generally poor for arable farming despite the country''s high rainfall.',
25,
'(a) 6 marks: Igneous: granite, basalt. Sedimentary: limestone, sandstone. Metamorphic: marble, quartzite. 1 mark per correct pair.
(b) 12 marks: Physical (mechanical): freeze-thaw (water enters cracks, freezes, expands, breaks rock); exfoliation. Chemical: hydrolysis (feldspar + water → clay); carbonation (limestone + CO₂ + H₂O → calcium bicarbonate, dissolves). 6 marks per type (process + example).
(c) 7 marks: Heavy rainfall leaches nutrients from soil (laterisation); acidic soils (low pH); iron/aluminium oxides concentrate (laterite soils); rapid organic matter decomposition in heat; topsoil erosion on slopes. Despite fertility of forests, soil itself is nutrient-poor.',
'(a) Igneous: granite, basalt. Sedimentary: limestone, sandstone. Metamorphic: marble, quartzite.
(b) Physical: freeze-thaw expansion. Chemical: carbonation dissolves limestone.
(c) Leaching removes nutrients; laterite soils; rapid decomposition; topsoil erosion.',
'hard', true),

-- Section B (Human/Regional, choose 2 of 3)
('Geography', 2, 'essay', 'B', 'Human Geography — Population', 2022,
'(a) Explain the demographic transition model (DTM) and state at which stage most West African countries are.
(b) Discuss the causes and consequences of rural-to-urban migration in Liberia.
(c) Explain what is meant by "population density" and describe the distribution of Liberia''s population.',
25,
'(a) 8 marks: DTM Stage 1: high birth and death rates → stable population. Stage 2: death rates fall (medicine, sanitation), birth rates high → rapid growth. Stage 3: birth rates begin to fall → growth slows. Stage 4: low BR and DR → stable. Most West African countries at Stage 2/early Stage 3. Must name stages and explain transition.
(b) 10 marks: Causes: better job opportunities; education; healthcare; conflict displacement; improved infrastructure in cities. Consequences: growth of informal settlements (slums); urban unemployment; urban infrastructure pressure; brain drain from rural areas; loss of agricultural labour; growth of Monrovia. Must address both causes and effects.
(c) 7 marks: Population density = number of people per km². Liberia: total ~5 million; concentrated in coastal cities (Monrovia) and along rivers; less dense in interior forest areas; Nimba County (mining) densely populated; southeastern counties sparse.',
'(a) DTM: Stage 1 (both high) → Stage 2 (death rate falls) → Stage 3 (birth rate falls) → Stage 4 (both low). Most of West Africa: Stage 2/3.
(b) Rural-urban: push (poverty, conflict) and pull (jobs, services). Consequences: Monrovia slums, informal economy.
(c) Population density: people per km². Liberia dense on coast/rivers, sparse interior.',
'medium', true),

('Geography', 2, 'essay', 'B', 'Economic Geography — Agriculture & Resources', 2022,
'(a) Describe the importance of rubber and palm oil to Liberia''s economy.
(b) Explain the causes and effects of deforestation in Liberia.
(c) Suggest and explain THREE measures to manage Liberia''s forest resources sustainably.',
25,
'(a) 8 marks: Rubber: main export earner historically; large plantations (Firestone); employs thousands; vulnerable to global rubber price. Palm oil: traditional and commercial production; food source; export potential; can compete with Malaysia/Indonesia if developed. Award 4 marks each.
(b) 10 marks: Causes: commercial logging concessions; shifting cultivation; charcoal production; population growth; weak enforcement of forestry laws. Effects: loss of biodiversity; soil erosion; disrupted water cycle; climate impact; displacement of forest communities; loss of livelihoods. Must distinguish causes from effects clearly.
(c) 7 marks: Community forestry (give local communities rights and benefits); reforestation programmes; stricter regulation of logging concessions; sustainable timber certification (FSC); eco-tourism; payment for ecosystem services. Any three with explanation.',
'(a) Rubber: main export, large estates, foreign exchange. Palm oil: food, export potential.
(b) Causes: logging, farming, charcoal. Effects: erosion, biodiversity loss, climate change.
(c) Community forestry; reforestation; stricter logging laws.',
'medium', true),

('Geography', 2, 'essay', 'B', 'Regional Geography — West Africa', 2021,
'(a) Name FIVE countries of the Economic Community of West African States (ECOWAS) and explain TWO benefits of regional economic integration.
(b) Describe the physical geography of the West African coast, with reference to the features found there.
(c) Explain how iron ore mining has affected Liberia''s development, including both positive and negative impacts.',
25,
'(a) 8 marks: Countries: Nigeria, Ghana, Senegal, Côte d''Ivoire, Guinea, Sierra Leone, Liberia, Gambia, Mali, Burkina Faso, etc. Any five: 3 marks. Benefits: free movement of labour and goods; larger market for trade; shared infrastructure investment; collective bargaining power; any two explained clearly: 5 marks.
(b) 9 marks: Atlantic coastline; lagoons and sandbars (offshore barrier islands); mangrove swamps in river mouths; sandy beaches; rocky headlands (Sierra Leone, Cape Palmas); Guinea Coast (straight, surf-swept); upwelling of cold currents off Senegal; abundant fishing grounds.
(c) 8 marks: Positive: government revenue and royalties; foreign exchange earnings; employment (Nimba County mines); infrastructure development around mines. Negative: environmental degradation; limited local processing (ore exported raw); enclave economy (profits leave country); social disruption; health impacts from dust/water pollution.',
'(a) ECOWAS: Nigeria, Ghana, Côte d''Ivoire, Guinea, Sierra Leone. Benefits: free trade, labour mobility.
(b) Coast: lagoons, mangroves, sandy beaches, upwelling currents.
(c) Iron ore: revenue and employment (positive); enclave economy, environment damage (negative).',
'hard', true);

-- ──────────────────────────────────────────────────────────
-- LITERATURE IN ENGLISH
-- Paper 2 (Prose): Section A (African, choose 1 of 2) + Section B (Non-African, choose 1 of 2)
-- Paper 3 (Drama & Poetry): Sections A, B, C, D
-- ──────────────────────────────────────────────────────────
INSERT INTO questions (subject, paper_number, question_type, section, topic, year, question_text, marks, mark_scheme, model_answer, difficulty, is_active) VALUES

-- Paper 2 Section A: African Prose
('Literature in English', 2, 'essay', 'A', 'African Prose — Character', 2022,
'Examine the character of Okonkwo in Chinua Achebe''s "Things Fall Apart". How does his character contribute to his tragic downfall? Support your answer with specific evidence from the text.',
25,
'Content (15 marks): Must identify Okonkwo''s key traits (fear of failure/weakness; pride; excessive masculinity; violence; refusal to adapt); show how each trait contributes to downfall (exile; break with community; son''s conversion; suicide); use at least FOUR textual references/episodes. Each well-analysed point with textual support = 3 marks.
Style (5 marks): Clear essay structure; introduction with thesis; body paragraphs with topic sentences; conclusion.
Language (5 marks): Accurate grammar; sophisticated vocabulary; varied sentence structures.
Deduct marks for: plot summary without analysis; no textual evidence; poor structure.',
'Introduction: Okonkwo''s downfall is the product of his own tragic flaws — his excessive pride and rigid masculinity — rather than mere circumstance.

Body (example paragraph): Okonkwo''s deep-seated fear of appearing weak, like his father Unoka, drives him to extreme harshness. His killing of Ikemefuna, against the advice of Ogbuefi Ezeudu, demonstrates his inability to place human feeling above masculine reputation. This act alienates his son Nwoye, whose eventual conversion to Christianity can be traced directly to Okonkwo''s emotional distance.

Conclusion: Okonkwo''s tragedy lies in his inability to adapt; his virtues, taken to an extreme, become fatal flaws.',
'hard', true),

('Literature in English', 2, 'essay', 'A', 'African Prose — Theme', 2021,
'Discuss the theme of conflict between tradition and change in ONE African prose novel you have studied. Show how this theme is developed through characters and events.',
25,
'Same marking criteria as above. Acceptable texts: Things Fall Apart (Achebe); Mine Boy (Abrahams); Arrow of God (Achebe); The River Between (Ngugi); Season of Migration to the North (Salih).
Award marks for: identification of the tradition vs change conflict; specific characters embodying each side; key events that dramatise the conflict; analysis of the outcome; use of at least 4 textual examples; clear thesis and argument.
Deduct for pure plot retelling without thematic analysis.',
'Thesis: In Ngugi wa Thiong''o''s "The River Between," the tension between Christianity and Gikuyu tradition tears the ridge apart, embodied in the doomed love between Waiyaki and Nyambura.

[Body: Waiyaki represents synthesis — educated in Western ways but rooted in tradition; Nyambura''s father Chege-Joshua represents rigid Christianity; the female circumcision conflict dramatises the unbridgeable divide; Waiyaki''s final failure shows neither side can win alone]

Conclusion: The theme suggests that cultural change is inevitable, but violent rupture destroys what could have been preserved.',
'hard', true),

-- Paper 2 Section B: Non-African Prose
('Literature in English', 2, 'essay', 'B', 'Non-African Prose — Character', 2022,
'Examine the presentation of social class in ONE non-African prose novel you have studied. How does the author use characters to explore the inequalities of their society?',
25,
'Acceptable texts: Pride and Prejudice (Austen); Great Expectations (Dickens); Lord of the Flies (Golding); The Old Man and the Sea (Hemingway); Animal Farm (Orwell — allegory accepted).
Award marks for: identifying how class/social hierarchy is constructed; characters representing different classes; key scenes showing class conflict or aspiration; authorial techniques (irony, symbolism, narrative perspective); 4+ textual references; thesis-driven argument; NOT plot summary.',
'Thesis: In Jane Austen''s "Pride and Prejudice," social class functions as both barrier and target: characters aspire upward or enforce downward exclusion, revealing Austen''s satirical critique of Georgian England''s obsession with rank.

[Body: Mrs Bennet''s fixation on wealth; Darcy''s initial pride; Elizabeth''s refusal to be diminished; Lady Catherine as class enforcer; Wickham''s exploitation of social expectation]

Conclusion: Austen does not challenge the class system outright but exposes its moral bankruptcy through Elizabeth''s intelligence and integrity triumphing over birth.',
'hard', true),

('Literature in English', 2, 'essay', 'B', 'Non-African Prose — Setting & Theme', 2021,
'How does the setting of ONE non-African prose novel you have studied contribute to the themes of the work? Discuss with close reference to the text.',
25,
'Setting and theme must be clearly linked. Award marks for: identification of key settings (physical, temporal, social); analysis of how setting creates atmosphere or meaning; connection to central themes; specific episodes/quotations; 4+ examples; thesis-driven argument. Deduct for plot summary not linked to setting or theme.',
'(Using "Lord of the Flies") The deserted tropical island is not merely a backdrop but a thematic instrument: its initial paradise quality reflects the boys'' hopes for a rational, peaceful society, while its increasing darkness — the jungle, the "beast" in the forest — externalises the innate savagery Golding believes lies within human nature...

[Body: the conch on the beach = democracy; Castle Rock = savagery; the dead parachutist as false beast = fear itself; final naval officer''s appearance = irony of civilisation rescuing barbarism it created]',
'hard', true),

-- Paper 3 Section A: Drama
('Literature in English', 3, 'essay', 'A', 'Drama — Tragedy', 2022,
'In the play you have studied, discuss how the playwright creates and sustains dramatic tension. Refer to specific scenes and techniques.',
20,
'Techniques to look for: dramatic irony; soliloquy/aside; conflict between characters; stage directions; language (imagery, repetition); structural devices (climax, subplot). Award marks for: identification of techniques (2 marks each); analysis of specific scenes (3 marks each); evaluation of effectiveness; at least 3 techniques discussed with evidence; clear essay structure.',
'(Using Shakespeare''s Macbeth or Soyinka''s The Lion and the Jewel)
Dramatic tension in Macbeth is built progressively from Act 1 Scene 7, where Macbeth''s soliloquy "If it were done when ''tis done" reveals his moral hesitation, creating irony for an audience that knows murder is coming...

[Techniques: dramatic irony (witches'' prophecies); Lady Macbeth''s manipulation; the dagger soliloquy; Banquo''s ghost at the banquet]',
'hard', true),

('Literature in English', 3, 'essay', 'A', 'Drama — Character & Theme', 2021,
'Choose ONE major character from the play you have studied. Analyse how this character''s actions and decisions drive the plot and express the central themes of the play.',
20,
'Award marks for: analysis of character''s role in plot (3 marks); connection to 2+ themes (4 marks per theme); specific scenes/lines as evidence (3 marks); analysis of characterisation techniques (3 marks); essay structure (3 marks); language (4 marks).',
'(Example: Baroka in "The Lion and the Jewel" by Wole Soyinka)
Baroka, the Bale of Ilujinle, embodies the central tension between tradition and modernity. His cunning manipulation of Sidi — pretending impotence — represents tradition''s survival through guile rather than confrontation...

[Analysis: the stamp incident, seduction scene, final triumph; themes of tradition vs modernity, power, gender]',
'hard', true),

-- Paper 3 Section B: African Poetry
('Literature in English', 3, 'essay', 'B', 'African Poetry — Analysis', 2022,
'Analyse the use of imagery and language in TWO African poems you have studied. Show how the poets use these techniques to convey their messages.',
20,
'Award marks for: close reading of each poem (4 marks each); identification of at least 3 images/devices per poem; analysis of effect (not just identification); connection to poem''s message/theme; comparison between poems where relevant; quotations used and embedded; essay structure; language.',
'(Using poems by Kofi Awoonor and Christopher Okigbo, or other prescribed African poets)
In Awoonor''s "Song of Sorrow," the repetition of the line "Dzogbese Lisa has struck me" creates a rhythmic lament that mirrors traditional African dirge singing, drawing the reader into the speaker''s grief...

[Second poem analysis: contrasting imagery; comparison of tone; both poems use natural imagery to explore identity or loss]',
'hard', true),

('Literature in English', 3, 'essay', 'B', 'African Poetry — Theme', 2021,
'Discuss the theme of identity or alienation in TWO African poems you have studied. How do the poets express this theme through their use of language?',
20,
'Same criteria as above. Identity/alienation in post-colonial African poetry: displacement; tension between African and Western values; nostalgia for pre-colonial culture; language as tool of resistance. Award marks for: textual evidence; analysis; thematic discussion; structure; language.',
'(Example: using Senghor''s "Black Woman" and Okigbo''s "Introduction")
Leopold Senghor''s "Black Woman" celebrates African femininity and identity through sensory imagery — "naked woman, black woman / Clothed with your colour which is life" — positioning Africa as nurturing mother against the alienation of colonial experience...

[Second poem: how Okigbo''s mythological references to Idoto construct a personal African identity through cultural memory]',
'hard', true),

-- Paper 3 Section C: Non-African Poetry
('Literature in English', 3, 'essay', 'C', 'Non-African Poetry — Techniques', 2022,
'Analyse how ONE non-African poet uses sound devices (rhyme, rhythm, alliteration, assonance) to enhance the meaning of TWO poems from your prescribed text.',
20,
'Award marks for: identification of sound devices (1 mark each; min 3 per poem); analysis of effect on meaning (2 marks each); specific quotations embedded in analysis; connection to poem''s theme; comparison between two poems; structure; language quality.',
'(Example: using Wilfred Owen''s "Dulce et Decorum Est")
Owen''s deliberate disruption of the heroic war ballad form — irregular metre mimicking a soldier''s exhausted, stumbling march — begins the poem''s deconstruction of the Latin motto "Dulce et decorum est pro patria mori." The alliteration in "Gas! GAS! Quick, boys!" creates urgency and panic...

[Analysis of "Anthem for Doomed Youth": sonnet form; auditory imagery — "the monstrous anger of the guns" replacing church bells; pathos of "candles" and "tenderness of patient minds"]',
'hard', true),

('Literature in English', 3, 'essay', 'C', 'Non-African Poetry — Theme', 2021,
'Discuss the theme of nature or conflict in TWO non-African poems you have studied. How do the poets'' attitudes differ?',
20,
'Award for: clear statement of each poet''s attitude; evidence from specific lines; analysis of techniques; identification of similarities/differences in approach; conclusion evaluating how perspectives differ; structure; language.',
'(Example: using Tennyson''s "The Eagle" and Hopkins'' "Pied Beauty")
Tennyson''s depiction of the eagle — "He clasps the crag with crooked hands" — presents nature as power and dominance, the alliteration suggesting strength and control. In contrast, Hopkins'' "Pied Beauty" celebrates the variety and "dappled" unpredictability of the natural world as evidence of divine creativity...

[Comparison: Tennyson = sublime, majestic; Hopkins = joyful, spiritual; both use compressed imagery but to different ends]',
'hard', true);

-- Remove the extra Literature Paper 1 question (fix count to exactly 50)
-- The 51st question in 003 migration needs to be deactivated.
-- We identify it as the last inserted Literature MCQ and set is_active = false.
-- Rather than deleting (which could break FKs), we deactivate it.
UPDATE questions
SET is_active = false
WHERE subject = 'Literature in English'
  AND paper_number = 1
  AND question_type = 'mcq'
  AND id = (
    SELECT id FROM questions
    WHERE subject = 'Literature in English'
      AND paper_number = 1
      AND question_type = 'mcq'
    ORDER BY created_at DESC
    LIMIT 1
  );
