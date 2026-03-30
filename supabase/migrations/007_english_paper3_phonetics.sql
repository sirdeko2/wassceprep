-- ============================================================
-- WASSCEPrep — English Language Paper 3 (Oral/Phonetics)
-- 30 MCQ questions on: stress, vowel sounds, consonants,
-- rhymes, and phonetic symbol recognition
-- Written format as used in Liberia (no oral recording)
-- Run after migrations 001–006
-- ============================================================

INSERT INTO questions (subject, paper_number, question_type, topic, year, question_text, options, correct_answer_index, explanation, difficulty, marks, is_active) VALUES

-- ── STRESS PATTERNS ──────────────────────────────────────────────────────────
('English Language',3,'mcq','Word Stress',2022,
'Which syllable carries the primary stress in the word "PhoTOgraphy"?',
'["First syllable (PHO)","Second syllable (TO)","Third syllable (gra)","Fourth syllable (phy)"]',
1,
'In "photography", the stress falls on the second syllable: pho-TO-gra-phy. The vowel sound in the stressed syllable is longer and louder.',
'medium',1),

('English Language',3,'mcq','Word Stress',2021,
'In the word "ecoNOmy", which syllable is stressed?',
'["First (e)","Second (co)","Third (no)","Fourth (my)"]',
2,
'The word "economy" is stressed on the third syllable: e-co-NO-my. This is a common WASSCE stress pattern to know.',
'medium',1),

('English Language',3,'mcq','Word Stress',2022,
'Which word has the stress on the FIRST syllable?',
'["reCORD (verb)","PROtest (noun)","deCIDE","supPORT"]',
1,
'When "protest" is used as a NOUN, the stress shifts to the first syllable: PRO-test. As a verb it is pro-TEST.',
'hard',1),

('English Language',3,'mcq','Sentence Stress',2021,
'In the sentence "I did NOT say she stole the money", which word carries the strongest stress?',
'["I","NOT","she","money"]',
1,
'The stressed word "NOT" changes the meaning: the speaker is denying the act of saying. Sentence stress highlights the most important or contrasted information.',
'medium',1),

('English Language',3,'mcq','Word Stress',2022,
'Which syllable is stressed in "comMITtee"?',
'["First","Second","Third","All equally"]',
1,
'The word "committee" is stressed on the second syllable: com-MIT-tee.',
'easy',1),

('English Language',3,'mcq','Word Stress',2020,
'The word "PERmit" (noun) and "perMIT" (verb) show which phonetic feature?',
'["Vowel change","Consonant change","Stress shift","Tone change"]',
2,
'Words that are identical in spelling but differ in stress based on their word class (noun vs verb) demonstrate a stress shift. This is called a "heteronym".',
'hard',1),

-- ── VOWEL SOUNDS ─────────────────────────────────────────────────────────────
('English Language',3,'mcq','Vowel Sounds',2022,
'Which word contains the same vowel sound as the underlined part in "b**ea**t"?',
'["bed","bit","feet","bat"]',
2,
'The word "beat" contains the long vowel /iː/. The word "feet" also has the /iː/ sound. "bed" has /e/, "bit" has /ɪ/, and "bat" has /æ/.',
'easy',1),

('English Language',3,'mcq','Vowel Sounds',2021,
'Which of the following words contains a DIPHTHONG (two vowel sounds)?',
'["sit","run","boy","hot"]',
2,
'The word "boy" contains the diphthong /ɔɪ/ — two vowel sounds gliding together. The others contain single (monophthong) vowel sounds.',
'medium',1),

('English Language',3,'mcq','Vowel Sounds',2022,
'The vowel sound in "bird" is represented by which phonetic symbol?',
'["/ɑː/","/ɜː/","/ɔː/","/uː/"]',
1,
'The vowel sound in "bird" is /ɜː/ — a mid-central long vowel. Other words with this sound: "heard", "word", "turn".',
'hard',1),

('English Language',3,'mcq','Vowel Sounds',2020,
'Which pair of words rhyme?',
'["boot / book","said / bed","tone / bone","love / move"]',
2,
'"Tone" and "bone" both end with the /oʊ/ vowel sound followed by /n/, making them a rhyming pair. The others have different vowel sounds despite similar spellings.',
'easy',1),

('English Language',3,'mcq','Vowel Sounds',2021,
'Which word contains the short vowel sound /ɪ/ as in "sit"?',
'["see","sky","ship","side"]',
2,
'"Ship" contains the short /ɪ/ vowel. "See" has /iː/, "sky" has /aɪ/, and "side" has /aɪ/.',
'easy',1),

('English Language',3,'mcq','Vowel Sounds',2022,
'The phonetic transcription /kæt/ represents which word?',
'["cart","coat","cat","cute"]',
2,
'/kæt/ uses the short /æ/ vowel (as in "hat"), the /k/ consonant, and /t/. This is the phonetic spelling of "cat".',
'medium',1),

-- ── CONSONANT SOUNDS ──────────────────────────────────────────────────────────
('English Language',3,'mcq','Consonants',2022,
'Which word begins with a VOICED consonant?',
'["fish","pin","very","cool"]',
2,
'"Very" begins with /v/, which is a voiced labio-dental fricative. /f/ in "fish" is its unvoiced counterpart. "pin" begins with /p/ (unvoiced) and "cool" with /k/ (unvoiced).',
'medium',1),

('English Language',3,'mcq','Consonants',2021,
'How many consonant sounds are in the word "strength"?',
'["4","5","6","7"]',
2,
'"Strength" = /s/ /t/ /r/ /ɛ/ /ŋ/ /k/ /θ/ → 6 consonants. The vowel is /ɛ/ in the middle. Note: "ng" = one sound /ŋ/ and "th" = one sound /θ/.',
'hard',1),

('English Language',3,'mcq','Consonants',2022,
'Which word contains a SILENT consonant?',
'["bread","knife","clean","stamp"]',
1,
'"Knife" contains a silent "k" — it is not pronounced. The word is said as /naɪf/.',
'easy',1),

('English Language',3,'mcq','Consonants',2020,
'The consonant sound /ʃ/ (as in "shoe") is found in which word?',
'["chess","sure","size","thin"]',
1,
'"Sure" contains /ʃ/ — despite the spelling with "s", it makes the "sh" sound. "Chess" has /tʃ/, "size" has /z/, "thin" has /θ/.',
'medium',1),

('English Language',3,'mcq','Consonants',2021,
'Which of the following is a NASAL consonant?',
'["/b/","/m/","/f/","/s/"]',
1,
'/m/ is a nasal consonant — air flows through the nose during its production. Other nasals in English are /n/ and /ŋ/.',
'medium',1),

('English Language',3,'mcq','Consonants',2022,
'The "th" in "this" and "that" represents which consonant sound?',
'["/θ/ (voiceless)","/ð/ (voiced)","/t/","/d/"]',
1,
'The "th" in "this" and "that" is the voiced dental fricative /ð/. The "th" in "think" and "three" is the voiceless /θ/.',
'hard',1),

-- ── RHYMES ────────────────────────────────────────────────────────────────────
('English Language',3,'mcq','Rhymes',2022,
'Which word rhymes with "though"?',
'["through","tough","flow","plough"]',
2,
'"Though" is pronounced /ðoʊ/. "Flow" is also /floʊ/ — they share the same ending vowel sound. "Through" = /θruː/, "tough" = /tʌf/, "plough" = /plaʊ/.',
'medium',1),

('English Language',3,'mcq','Rhymes',2021,
'Which word does NOT rhyme with "break"?',
'["steak","make","lake","speak"]',
3,
'"Speak" has the /iːk/ ending, while "break", "steak", "make", and "lake" all end in the /eɪk/ sound. "Speak" is the odd one out.',
'easy',1),

('English Language',3,'mcq','Rhymes',2022,
'Which pair of words is a PERFECT rhyme?',
'["love / prove","blood / food","hate / late","cough / rough"]',
2,
'"Hate" (/heɪt/) and "late" (/leɪt/) share the exact same vowel-consonant ending /eɪt/, making them a perfect rhyme.',
'easy',1),

('English Language',3,'mcq','Rhymes',2020,
'The words "flour", "power", and "tower" all rhyme because they share which ending sound?',
'["/ɔː/","/aʊər/","/uːr/","/ɔɪ/"]',
1,
'All three words end with the /aʊər/ diphthong + /r/ sound. This is a common phonetic pattern in WASSCE oral questions.',
'hard',1),

-- ── PHONETIC SYMBOLS ──────────────────────────────────────────────────────────
('English Language',3,'mcq','Phonetic Symbols',2022,
'What does the phonetic symbol /ə/ represent?',
'["A long "a" sound","The schwa — an unstressed mid-central vowel","A silent letter marker","The "th" sound"]',
1,
'The schwa /ə/ is the most common vowel sound in English. It appears in unstressed syllables: "ago" /əˈɡoʊ/, "sofa" /ˈsoʊfə/.',
'medium',1),

('English Language',3,'mcq','Phonetic Symbols',2021,
'Which word is correctly transcribed as /ˈtɪʧər/?',
'["Teacher","Ticker","Tiger","Tighter"]',
0,
'/ˈtɪʧər/ = /tɪ/ (as in "tick") + /ʧ/ ("ch" sound) + /ər/ (unstressed ending). This is the phonetic transcription of "teacher".',
'medium',1),

('English Language',3,'mcq','Phonetic Symbols',2022,
'The symbol /ː/ after a vowel in phonetic transcription indicates:',
'["The vowel is silent","The vowel is long","The vowel is nasal","The vowel is stressed"]',
1,
'The length mark /ː/ shows the vowel is elongated. Example: /iː/ in "feet" vs /ɪ/ in "fit".',
'easy',1),

('English Language',3,'mcq','Phonetic Symbols',2020,
'Which phonetic transcription correctly represents the word "night"?',
'["/nɪɡt/","/naɪt/","/nɛt/","/nɪt/"]',
1,
'"Night" is pronounced /naɪt/. The "gh" is silent, and "igh" makes the /aɪ/ diphthong sound.',
'easy',1),

('English Language',3,'mcq','Phonetic Symbols',2021,
'The word "judge" in phonetic symbols is /dʒʌdʒ/. How many SOUNDS does it contain?',
'["5","4","3","6"]',
1,
'"Judge" = /dʒ/ + /ʌ/ + /dʒ/ = 3 phonemes. Despite having 5 letters, it has only 3 distinct sounds. "dʒ" is a single affricate sound.',
'hard',1),

('English Language',3,'mcq','Phonetic Symbols',2022,
'Which pair of words contains the same phonetic sound for the underlined letters: "ph**one**" and "b**one**"?',
'["Yes, both contain /oʊn/","No, ph has a different vowel","Yes, both contain /ɒn/","No, they are completely different"]',
0,
'Both "phone" and "bone" contain the /oʊn/ sequence. The vowel is the diphthong /oʊ/ and both end with /n/.',
'medium',1),

-- ── MIXED/APPLICATION ────────────────────────────────────────────────────────
('English Language',3,'mcq','Applied Phonetics',2021,
'How many syllables does the word "international" have?',
'["4","5","6","7"]',
1,
'"International" = in-ter-na-tion-al = 5 syllables. Counting syllables is a key oral skill tested in WASSCE Paper 3.',
'easy',1),

('English Language',3,'mcq','Applied Phonetics',2020,
'Which sentence uses the correct pronunciation rule: "an" before a word beginning with a vowel SOUND?',
'["a university","an hour","a honest man","a elephant"]',
1,
'"An hour" is correct because "hour" begins with a vowel SOUND (/aʊ/), not a consonant sound, even though it is spelt with "h". "A university" is correct because "university" begins with /j/ (consonant sound).',
'medium',1);
