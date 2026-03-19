import Navbar from '@/components/layout/Navbar'
import { useNavigate } from 'react-router-dom'
import { SUBJECTS } from '@/data/subjects'

export default function SubjectsPage() {
  const navigate = useNavigate()

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="subject-select-layout">
        <div className="subject-select-title">Choose a Subject</div>
        <div className="subject-select-sub">Select a subject and practice mode to begin your session.</div>
        <div className="subject-select-grid">
          {SUBJECTS.map(s => (
            <div key={s.id} className="subject-select-card">
              <div className="subject-select-icon">{s.icon}</div>
              <div className="subject-select-name">{s.name}</div>
              <div className="subject-select-meta">Questions available</div>
              <div className="subject-select-modes">
                <button
                  className="mode-btn mode-practice"
                  onClick={() => navigate(`/quiz/${s.id}?mode=practice`)}
                >
                  Practice
                </button>
                <button
                  className="mode-btn mode-mock"
                  onClick={() => navigate(`/quiz/${s.id}?mode=mock`)}
                >
                  Mock Exam
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
