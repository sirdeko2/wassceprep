import Navbar from '@/components/layout/Navbar'
import { Link } from 'react-router-dom'
import { useProgress } from '@/hooks/useData'
import { SUBJECTS, getGrade } from '@/data/subjects'

// Pure-SVG line chart — no extra dependencies
function LineChart({ sessions }) {
  if (!sessions || sessions.length < 2) return null

  const W = 600
  const H = 180
  const PAD = { top: 20, right: 20, bottom: 40, left: 40 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const points = sessions.map((s, i) => ({
    x: PAD.left + (i / (sessions.length - 1)) * innerW,
    y: PAD.top + innerH - (s.score_pct / 100) * innerH,
    pct: s.score_pct,
    label: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    subject: s.subject,
    mode: s.mode,
  }))

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
  const fill = `${polyline} ${PAD.left + innerW},${PAD.top + innerH} ${PAD.left},${PAD.top + innerH}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(pct => {
        const y = PAD.top + innerH - (pct / 100) * innerH
        return (
          <g key={pct}>
            <line x1={PAD.left} x2={PAD.left + innerW} y1={y} y2={y}
              stroke="#e5e7eb" strokeWidth="1" strokeDasharray={pct === 50 ? '4 4' : '0'} />
            <text x={PAD.left - 6} y={y + 4} fontSize="10" fill="#9ca3af" textAnchor="end">{pct}%</text>
          </g>
        )
      })}
      {/* Fill under line */}
      <polygon points={fill} fill="rgba(59,130,246,0.08)" />
      {/* Line */}
      <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="white" stroke="#3b82f6" strokeWidth="2" />
          {/* X-axis label every ~3 points */}
          {(i === 0 || i === points.length - 1 || i % Math.max(1, Math.floor(points.length / 5)) === 0) && (
            <text x={p.x} y={H - 6} fontSize="9" fill="#9ca3af" textAnchor="middle">{p.label}</text>
          )}
        </g>
      ))}
    </svg>
  )
}

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
            {/* Summary stats */}
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

            {/* Historical progress chart (spec 3.8) */}
            {progress.recent?.length >= 2 && (
              <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid var(--gray-200)', marginBottom: 32 }}>
                <div style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 16, marginBottom: 4 }}>
                  📈 Score Trend — Last {progress.recent.length} Sessions
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 16 }}>
                  Showing your most recent quiz and mock exam scores over time
                </div>
                <LineChart sessions={[...progress.recent].reverse()} />
                <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                  {progress.recent.slice(0, 5).map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--gray-600)', background: 'var(--off-white)', padding: '4px 10px', borderRadius: 100 }}>
                      {s.subject}: <strong style={{ color: getGrade(s.score_pct).color }}>{s.score_pct}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-subject breakdown */}
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
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{data.sessions} session{data.sessions !== 1 ? 's' : ''}</div>
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
