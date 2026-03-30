import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/context/AuthContext'
import { useProgress } from '@/hooks/useData'
import { useSubscription } from '@/hooks/useSubscription'
import { SUBJECTS } from '@/data/subjects'

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const { progress, loading } = useProgress()
  const { hasFullAccess, isPaid } = useSubscription()
  const name = profile?.full_name || user?.email?.split('@')[0] || 'Student'

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="dashboard-layout">

        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Main</div>
            <Link to="/dashboard"  className="sidebar-item active"><span>🏠</span> Dashboard</Link>
            <Link to="/subjects"   className="sidebar-item"><span>⏱️</span> Mock &amp; Practice <span className="sidebar-badge">8</span></Link>
            <Link to="/tutor"      className="sidebar-item"><span>🤖</span> AI Tutor</Link>
            <Link to="/past-papers" className="sidebar-item"><span>📄</span> Past Papers</Link>
            <Link to="/progress"   className="sidebar-item"><span>📊</span> Progress</Link>
            {!isPaid && (
              <Link to="/upgrade" className="sidebar-item" style={{ color: 'var(--gold)', fontWeight: 700 }}>
                <span>⭐</span> Upgrade to Full Access
              </Link>
            )}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">Subjects</div>
            {SUBJECTS.map(s => (
              <Link key={s.id} to={`/quiz/${s.id}`} className="sidebar-item">
                <span>{s.icon}</span> {s.name}
              </Link>
            ))}
          </div>
        </aside>

        <main className="main-content">
          {!hasFullAccess && (
            <div className="upgrade-banner" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 24 }}>⭐</div>
              <div className="upgrade-banner-text">
                <strong>Unlock full access</strong> — Unlimited questions, mock exams with AI marking, all subjects &amp; analytics for just $5/month.
              </div>
              <Link to="/upgrade">
                <button className="upgrade-banner-btn">Upgrade Now</button>
              </Link>
            </div>
          )}

          <div className="welcome-banner">
            <div>
              <div className="welcome-title">Welcome back, {name} 👋</div>
              <div className="welcome-sub">Keep going — you are closer to passing than yesterday.</div>
            </div>
            <div className="welcome-streak">
              <div className="streak-num">{profile?.streak_days || 1}</div>
              <div className="streak-label">Day Streak 🔥</div>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-card-label">Questions Done</div>
              <div className="stat-card-value stat-blue">
                {loading ? '...' : progress?.totalQuestions || 0}
              </div>
              <div className="stat-card-sub">across all subjects</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Avg. Score</div>
              <div className="stat-card-value stat-green">
                {loading ? '...' : `${progress?.avgScore || 0}%`}
              </div>
              <div className="stat-card-sub">all sessions</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Sessions Taken</div>
              <div className="stat-card-value stat-red">
                {loading ? '...' : progress?.totalSessions || 0}
              </div>
              <div className="stat-card-sub">this month</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Best Subject</div>
              <div className="stat-card-value stat-gold" style={{ fontSize: 18, marginTop: 6 }}>
                {loading ? '...' : progress?.bestSubject || 'N/A'}
              </div>
              <div className="stat-card-sub">
                {progress?.bySubject?.[progress?.bestSubject]?.avg
                  ? `${progress.bySubject[progress.bestSubject].avg}% avg`
                  : 'Start practicing!'}
              </div>
            </div>
          </div>

          <div className="cards-title">
            Continue Studying <Link to="/subjects">View all →</Link>
          </div>
          <div className="subject-cards">
            {SUBJECTS.map(s => {
              const subjectProgress = progress?.bySubject?.[s.name]
              const pct = subjectProgress?.avg || 0
              return (
                <Link key={s.id} to={`/quiz/${s.id}`} className="subject-card">
                  <div className="subject-card-accent" style={{ background: s.color }} />
                  <div className="subject-card-icon">{s.icon}</div>
                  <div className="subject-card-name">{s.name}</div>
                  <div className="subject-card-count">
                    {subjectProgress
                      ? `${subjectProgress.sessions} session${subjectProgress.sessions > 1 ? 's' : ''}`
                      : 'Not started'}
                  </div>
                  <div className="subject-progress-bar">
                    <div className="subject-progress-fill" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="cards-title">Recent Activity</div>
          <div className="activity-list">
            {loading ? (
              <div className="activity-item">Loading...</div>
            ) : progress?.recent?.length ? (
              progress.recent.map((s, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-dot" style={{
                    background: s.score_pct >= 60 ? 'var(--green)' : s.score_pct >= 45 ? 'var(--orange)' : 'var(--red)'
                  }} />
                  <div className="activity-text">
                    <strong>{s.subject}</strong> — {s.mode === 'mock' ? 'Mock Exam' : 'Practice Session'}
                  </div>
                  <div className={`activity-score score-${s.score_pct >= 60 ? 'good' : s.score_pct >= 45 ? 'ok' : 'bad'}`}>
                    {s.score_pct}%
                  </div>
                  <div className="activity-time">
                    {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="activity-item">
                <div className="activity-text">No sessions yet. <Link to="/subjects">Start practicing!</Link></div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
