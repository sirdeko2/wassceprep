// Central source of truth for all subjects
// This is used across the app for subject cards, quiz selection, tutor, etc.

export const SUBJECTS = [
  { id: 'english',   name: 'English Language', icon: '📖', color: '#002868', bgColor: '#e6eaf5' },
  { id: 'maths',     name: 'Mathematics',      icon: '🔢', color: '#BF0A30', bgColor: '#f5e6ea' },
  { id: 'biology',   name: 'Biology',          icon: '🧬', color: '#2E7D32', bgColor: '#e8f5e9' },
  { id: 'chemistry', name: 'Chemistry',        icon: '⚗️', color: '#7B1FA2', bgColor: '#f3e5f5' },
  { id: 'physics',   name: 'Physics',          icon: '⚡', color: '#E65100', bgColor: '#fff3e0' },
  { id: 'economics', name: 'Economics',        icon: '📈', color: '#1565C0', bgColor: '#e3f2fd' },
  { id: 'geography', name: 'Geography',        icon: '🌍', color: '#00695C', bgColor: '#e0f2f1' },
  { id: 'literature',name: 'Literature',       icon: '📚', color: '#4E342E', bgColor: '#efebe9' },
]

export const SUBJECT_NAMES = SUBJECTS.map(s => s.name)

export function getSubject(nameOrId) {
  return SUBJECTS.find(s => s.name === nameOrId || s.id === nameOrId)
}

// WAEC grading scale
export function getGrade(pct) {
  if (pct >= 75) return { grade: 'A1',  label: 'Excellent',    color: '#2E7D32' }
  if (pct >= 70) return { grade: 'B2',  label: 'Very Good',    color: '#388E3C' }
  if (pct >= 65) return { grade: 'B3',  label: 'Good',         color: '#43A047' }
  if (pct >= 60) return { grade: 'C4',  label: 'Credit',       color: '#F9A825' }
  if (pct >= 55) return { grade: 'C5',  label: 'Credit',       color: '#FB8C00' }
  if (pct >= 50) return { grade: 'C6',  label: 'Credit',       color: '#FF7043' }
  if (pct >= 45) return { grade: 'D7',  label: 'Pass',         color: '#E53935' }
  if (pct >= 40) return { grade: 'E8',  label: 'Pass',         color: '#B71C1C' }
  return           { grade: 'F9',  label: 'Fail',          color: '#7B1FA2' }
}
