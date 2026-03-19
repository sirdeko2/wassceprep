import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'

// ResultsPage is used when navigating to /results with state
// e.g. navigate('/results', { state: { score, total, subject, mode } })
export default function ResultsPage() {
  const navigate = useNavigate()

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="quiz-layout">
        <div className="result-card">
          <div className="result-icon">📊</div>
          <div className="result-score" style={{ color: 'var(--blue)', fontSize: 40 }}>
            Results
          </div>
          <div className="result-desc">
            Your quiz results will appear here after completing a session.
          </div>
          <div className="result-actions">
            <button className="btn-quiz btn-quiz-primary" onClick={() => navigate('/subjects')}>
              Practice Again
            </button>
            <button className="btn-quiz btn-quiz-outline" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
