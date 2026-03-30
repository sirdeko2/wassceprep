export const SUBJECTS = [
  {
    id: 'english',
    name: 'English Language',
    icon: '📖',
    color: '#002868',
    bgColor: '#e6eaf5',
    papers: [
      { number: 1, name: 'Lexis & Structure (MCQ)', type: 'mcq',   duration: 60,  totalMarks: 50,  questions: 50 },
      { number: 2, name: 'Essay, Comprehension & Summary', type: 'essay', duration: 120, totalMarks: 100, sections: [
        { id: 'A', title: 'Essay Writing', instruction: 'Write ONE essay of about 450 words on any ONE of the following topics.', choose: 1, questions: 5 },
        { id: 'B', title: 'Comprehension', instruction: 'Read the passage carefully and answer ALL questions.', choose: null, questions: 5 },
        { id: 'C', title: 'Summary', instruction: 'In not more than 60 words, summarise the passage in your own words.', choose: null, questions: 1 },
      ]},
      { number: 3, name: 'Oral/Phonetics', type: 'mcq', duration: 45, totalMarks: 30, questions: 30 },
    ],
  },
  {
    id: 'maths',
    name: 'Mathematics',
    icon: '🔢',
    color: '#BF0A30',
    bgColor: '#f5e6ea',
    papers: [
      { number: 1, name: 'Objective (MCQ)', type: 'mcq',   duration: 90,  totalMarks: 50,  questions: 50 },
      { number: 2, name: 'Theory & Problem Solving', type: 'essay', duration: 150, totalMarks: 100, sections: [
        { id: 'A', title: 'Section A — Compulsory', instruction: 'Answer ALL 5 questions. Show ALL working clearly.', choose: null, questions: 5 },
        { id: 'B', title: 'Section B — Answer 5 of 8', instruction: 'Answer ANY FIVE of the following 8 questions. Show ALL working. A non-programmable calculator is allowed.', choose: 5, questions: 8 },
      ]},
    ],
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: '🧬',
    color: '#2E7D32',
    bgColor: '#e8f5e9',
    papers: [
      { number: 1, name: 'Objective (MCQ)', type: 'mcq',   duration: 60,  totalMarks: 50,  questions: 50 },
      { number: 2, name: 'Essay & Structured', type: 'essay', duration: 120, totalMarks: 80, sections: [
        { id: 'A', title: 'Section A — Short Answer (Compulsory)', instruction: 'Answer ALL questions in this section.', choose: null, questions: 4 },
        { id: 'B', title: 'Section B — Essay (Choose 4 of 6)', instruction: 'Answer any FOUR questions. At least ONE must be chosen from each sub-section.', choose: 4, questions: 6 },
      ]},
      { number: 3, name: 'Practical — Specimen Examination', type: 'practical', duration: 165, totalMarks: 50, sections: [
        { id: 'A', title: 'Specimen Analysis', instruction: 'You are provided with specimens A, B, and C. Study them carefully and answer ALL questions.', choose: null, questions: 3 },
      ]},
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: '⚗️',
    color: '#7B1FA2',
    bgColor: '#f3e5f5',
    papers: [
      { number: 1, name: 'Objective (MCQ)', type: 'mcq',   duration: 75,  totalMarks: 50,  questions: 50 },
      { number: 2, name: 'Theory & Calculations', type: 'essay', duration: 150, totalMarks: 100, sections: [
        { id: 'A', title: 'Section A — Short Answer (Compulsory)', instruction: 'Answer ALL questions in this section.', choose: null, questions: 5 },
        { id: 'B', title: 'Section B — Answer 5 of 6', instruction: 'Answer any FIVE of the following 6 questions. Show all working for calculations.', choose: 5, questions: 6 },
      ]},
      { number: 3, name: 'Practical — Qualitative & Quantitative Analysis', type: 'practical', duration: 165, totalMarks: 50, sections: [
        { id: 'A', title: 'Titration & Salt Analysis', instruction: 'Carry out the following experiments. For each observation, write what you SEE, then your INFERENCE, then the EQUATION.', choose: null, questions: 2 },
      ]},
    ],
  },
  {
    id: 'physics',
    name: 'Physics',
    icon: '⚡',
    color: '#E65100',
    bgColor: '#fff3e0',
    papers: [
      { number: 1, name: 'Objective (MCQ)', type: 'mcq',   duration: 75,  totalMarks: 50,  questions: 50 },
      { number: 2, name: 'Theory & Calculations', type: 'essay', duration: 120, totalMarks: 80, sections: [
        { id: 'A', title: 'Section A — Short Structured (Compulsory)', instruction: 'Answer ALL questions. For calculations show: formula → substitution → working → answer with UNIT.', choose: null, questions: 5 },
        { id: 'B', title: 'Section B — Answer 4 of 5', instruction: 'Answer any FOUR questions. You MUST show: formula → substitution → working → answer with UNIT.', choose: 4, questions: 5 },
      ]},
      { number: 3, name: 'Practical — Laboratory Experiment', type: 'practical', duration: 165, totalMarks: 50, sections: [
        { id: 'A', title: 'Experiment & Data Analysis', instruction: 'The following data was obtained from an experiment. Complete the data table, plot a graph, and answer the questions that follow.', choose: null, questions: 4 },
      ]},
    ],
  },
  {
    id: 'economics',
    name: 'Economics',
    icon: '📈',
    color: '#1565C0',
    bgColor: '#e3f2fd',
    papers: [
      { number: 1, name: 'Objective (MCQ)', type: 'mcq',   duration: 60,  totalMarks: 50,  questions: 50 },
      { number: 2, name: 'Essay & Structured', type: 'essay', duration: 150, totalMarks: 100, sections: [
        { id: 'A', title: 'Section A — Answer 5 of 8', instruction: 'Answer any FIVE questions from this section. Each question carries 20 marks.', choose: 5, questions: 8 },
      ]},
    ],
  },
  {
    id: 'geography',
    name: 'Geography',
    icon: '🌍',
    color: '#00695C',
    bgColor: '#e0f2f1',
    papers: [
      { number: 1, name: 'Objective (MCQ)', type: 'mcq',   duration: 60,  totalMarks: 50,  questions: 50 },
      { number: 2, name: 'Essay — Physical & Human Geography', type: 'essay', duration: 150, totalMarks: 100, sections: [
        { id: 'A', title: 'Section A — Physical Geography (Answer 2 of 3)', instruction: 'Answer any TWO questions from this section.', choose: 2, questions: 3 },
        { id: 'B', title: 'Section B — Human & Regional Geography (Answer 2 of 3)', instruction: 'Answer any TWO questions from this section.', choose: 2, questions: 3 },
      ]},
      { number: 3, name: 'Practical — Map Work & Data Interpretation', type: 'practical', duration: 90, totalMarks: 50, sections: [
        { id: 'A', title: 'Topographic Map Reading', instruction: 'Study the topographic map extract provided and answer ALL questions.', choose: null, questions: 5 },
      ]},
    ],
  },
  {
    id: 'literature',
    name: 'Literature in English',
    icon: '📚',
    color: '#4E342E',
    bgColor: '#efebe9',
    papers: [
      { number: 1, name: 'General Knowledge (MCQ)', type: 'mcq',   duration: 60,  totalMarks: 50,  questions: 50 },
      { number: 2, name: 'Essay — Prose', type: 'essay', duration: 75, totalMarks: 50, sections: [
        { id: 'A', title: 'Section A — African Prose (Answer 1 of 2)', instruction: 'Answer any ONE question from this section. Essays must show textual evidence.', choose: 1, questions: 2 },
        { id: 'B', title: 'Section B — Non-African Prose (Answer 1 of 2)', instruction: 'Answer any ONE question from this section.', choose: 1, questions: 2 },
      ]},
      { number: 3, name: 'Essay — Drama & Poetry', type: 'essay', duration: 90, totalMarks: 50, sections: [
        { id: 'A', title: 'Section A — Drama (Answer 1 of 2)', instruction: 'Answer any ONE question from this section. Essays must show textual evidence; avoid plot summary.', choose: 1, questions: 2 },
        { id: 'B', title: 'Section B — African Poetry (Answer 1 of 2)', instruction: 'Answer any ONE question from this section. Analyse character, theme, setting, and style.', choose: 1, questions: 2 },
        { id: 'C', title: 'Section C — Non-African Poetry (Answer 1 of 2)', instruction: 'Answer any ONE question from this section.', choose: 1, questions: 2 },
        { id: 'D', title: 'Section D — Additional Question (Answer 1 more from A, B, or C)', instruction: 'Answer ONE additional question from Section A, B, or C. You may NOT answer a second question from the section you already chose in that section.', choose: 1, questions: 0 },
      ]},
    ],
  },
]

export const SUBJECT_NAMES = SUBJECTS.map(s => s.name)

export function getSubject(nameOrId) {
  return SUBJECTS.find(s => s.name === nameOrId || s.id === nameOrId)
}

export function getGrade(pct) {
  if (pct >= 75) return { grade: 'A1', label: 'Excellent',  color: '#2E7D32' }
  if (pct >= 70) return { grade: 'B2', label: 'Very Good',  color: '#388E3C' }
  if (pct >= 65) return { grade: 'B3', label: 'Good',       color: '#43A047' }
  if (pct >= 60) return { grade: 'C4', label: 'Credit',     color: '#F9A825' }
  if (pct >= 55) return { grade: 'C5', label: 'Credit',     color: '#FB8C00' }
  if (pct >= 50) return { grade: 'C6', label: 'Credit',     color: '#FF7043' }
  if (pct >= 45) return { grade: 'D7', label: 'Pass',       color: '#E53935' }
  if (pct >= 40) return { grade: 'E8', label: 'Pass',       color: '#B71C1C' }
  return           { grade: 'F9', label: 'Fail',        color: '#7B1FA2' }
}
