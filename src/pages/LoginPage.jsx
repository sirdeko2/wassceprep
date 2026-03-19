import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const [form,  setForm]  = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn({ email: form.email, password: form.password })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/dashboard')
  }

  return (
    <div className="auth-screen">
      {/* Left panel */}
      <div className="auth-panel-left">
        <div className="auth-left-title">WELCOME <em>BACK.</em></div>
        <p className="auth-left-desc">Continue your WASSCE preparation journey.</p>
        <ul className="auth-left-features">
          <li>500+ real WASSCE past questions</li>
          <li>AI tutor available 24/7</li>
          <li>Track your improvement over time</li>
          <li>Completely free, forever</li>
        </ul>
      </div>

      {/* Right panel — form */}
      <div className="auth-panel-right">
        <div className="auth-form-box">
          <div className="auth-form-title">Log back in</div>
          <div className="auth-form-sub">Pick up where you left off</div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button className="btn-full btn-blue" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="auth-switch">
            No account? <Link to="/register">Create one free</Link>
          </div>
          <div className="auth-switch" style={{ marginTop: 8 }}>
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
