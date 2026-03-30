import Navbar from '@/components/layout/Navbar'
import { useNavigate } from 'react-router-dom'
import { SUBJECTS } from '@/data/subjects'
import { useAuth } from '@/context/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'

// Free tier: 3 subjects only (the two core WASSCE subjects + one science)
const FREE_SUBJECT_IDS = ['maths', 'english', 'biology']

export default function SubjectsPage() {
  const navigate = useNavigate()
  const { user }           = useAuth()
  const { hasFullAccess }  = useSubscription()

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="subject-select-layout">
        <div style={{ marginBottom: 32 }}>
          <h1 className="subject-select-title">Mock &amp; Practice Exams</h1>
          <p className="subject-select-sub">
            Choose a subject and mode. <strong>Practice</strong> is untimed — Paper 1 MCQ only, unlimited attempts.
            <strong> Mock Exam</strong> replicates the real WASSCE — all papers, timed, once per day.
          </p>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
            <div style={{ background: 'var(--blue-light)', border: '1px solid var(--blue-mid)', borderRadius: 12, padding: '12px 18px', flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 700, color: 'var(--blue)', marginBottom: 4 }}>📝 Practice Mode</div>
              <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5 }}>
                Paper 1 MCQ only • No timer • Unlimited attempts • Instant answer feedback
              </div>
            </div>
            <div style={{ background: 'var(--red-light)', border: '1px solid var(--red)', borderRadius: 12, padding: '12px 18px', flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>⏱️ Mock Exam Mode</div>
              <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.5 }}>
                All papers • Strictly timed • AI-marked essays • Once per day per subject
                {!hasFullAccess && <span style={{ color: 'var(--red)', fontWeight: 700 }}> — 🔒 Paid only</span>}
              </div>
            </div>
          </div>

          {!hasFullAccess && (
            <div style={{ background: 'var(--gold)', borderRadius: 12, padding: '14px 20px', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)' }}>
                🔒 Free plan: 3 subjects • Practice only • No explanations
              </span>
              <button
                style={{ background: 'var(--blue)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                onClick={() => navigate('/upgrade')}
              >
                Upgrade $5/mo — Unlock All
              </button>
            </div>
          )}
        </div>

        <div className="subject-select-grid">
          {SUBJECTS.map(s => {
            const isFreeSubject = FREE_SUBJECT_IDS.includes(s.id)
            const isLocked = !hasFullAccess && !isFreeSubject

            return (
              <div
                key={s.id}
                className="subject-select-card"
                style={isLocked ? { opacity: 0.55, position: 'relative' } : {}}
              >
                {isLocked && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'var(--gray-200)', color: 'var(--gray-600)',
                    padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                  }}>
                    🔒 Paid
                  </div>
                )}
                <div className="subject-select-icon">{s.icon}</div>
                <div className="subject-select-name">{s.name}</div>
                <div className="subject-select-meta">
                  {s.name === 'Biology' || s.name === 'Chemistry' || s.name === 'Physics' || s.name === 'Geography'
                    ? '3 papers • MCQ + Theory + Practical'
                    : s.name === 'Literature in English'
                    ? '3 papers • MCQ + Prose + Drama'
                    : '2 papers • MCQ + Theory'}
                </div>
                <div className="subject-select-modes">
                  {/* Practice button */}
                  {isLocked ? (
                    <button
                      className="mode-btn mode-practice"
                      style={{ opacity: 0.6, cursor: 'not-allowed' }}
                      onClick={() => navigate('/upgrade')}
                    >
                      🔒 Practice
                    </button>
                  ) : (
                    <button
                      className="mode-btn mode-practice"
                      onClick={() => navigate(`/quiz/${s.id}?mode=practice`)}
                    >
                      Practice
                    </button>
                  )}

                  {/* Mock Exam button — locked for ALL free users regardless of subject */}
                  {!hasFullAccess ? (
                    <button
                      className="mode-btn mode-mock"
                      style={{ opacity: 0.6, cursor: 'not-allowed', background: 'var(--gray-200)', color: 'var(--gray-400)' }}
                      onClick={() => navigate('/upgrade')}
                    >
                      🔒 Mock
                    </button>
                  ) : (
                    <button
                      className="mode-btn mode-mock"
                      onClick={() => navigate(`/quiz/${s.id}?mode=mock`)}
                    >
                      Mock Exam
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
