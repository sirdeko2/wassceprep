import Navbar from '@/components/layout/Navbar'
import { Link } from 'react-router-dom'
import { useProgress } from '@/hooks/useData'
import { SUBJECTS, getGrade } from '@/data/subjects'

export default function ProgressPage() {
  const { progress, loading } = useProgress()

  return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: 'var(--blue)', marginBottom: 8 }}>
          Your Progress
        </h1>
        <p style={{ color: 'var(--gray-400)', marginBottom: 36 }}>
          Track your performance across all subjects.
        </p>

        {loading ? (
          <p>Loading your progress...</p>
        ) : !progress?.totalSessions ? (
          <p>No sessions yet. <Link to="/subjects">Start practicing!</Link></p>
        ) : (
          <>
            <div className="stats-row" style={{ marginBottom: 36 }}>
              <div className="stat-card">
                <div className="stat-card-label">Total Sessions</div>
                <div className="stat-card-value stat-blue">{progress.totalSessions}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Questions Answered</div>
                <div className="stat-card-value stat-red">{progress.totalQuestions}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Overall Average</div>
                <div className="stat-card-value stat-green">{progress.avgScore}%</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Best Subject</div>
                <div className="stat-card-value stat-gold" style={{ fontSize: 18, marginTop: 6 }}>
                  {progress.bestSubject}
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue)', marginBottom: 16 }}>
              Performance by Subject
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SUBJECTS.map(s => {
                const data = progress.bySubject?.[s.name]
                if (!data) return null
                const grade = getGrade(data.avg)
                return (
                  <div key={s.id} style={{
                    background: 'white', borderRadius: 12, padding: '16px 20px',
                    border: '1px solid var(--gray-200)', display: 'flex',
                    alignItems: 'center', gap: 16
                  }}>
                    <span style={{ fontSize: 28 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--blue)', marginBottom: 6 }}>{s.name}</div>
                      <div style={{ height: 6, background: 'var(--gray-200)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${data.avg}%`, background: s.color, borderRadius: 100 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: grade.color }}>
                        {data.avg}%
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{data.sessions} sessions</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
