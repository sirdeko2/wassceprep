import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate   = useNavigate()
  const [form,    setForm]    = useState({ fullName: '', email: '', county: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error } = await signUp({
      email:    form.email,
      password: form.password,
      fullName: form.fullName,
      county:   form.county,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/dashboard')
  }

  const counties = [
    'Montserrado','Nimba','Bong','Lofa','Margibi','Grand Bassa',
    'Grand Cape Mount','Grand Gedeh','Grand Kru','Maryland',
    'Sinoe','River Cess','River Gee','Gbarpolu','Other'
  ]

  return (
    <div className="auth-screen">
      <div className="auth-panel-left">
        <div className="auth-left-title">FREE <em>WASSCE</em> PREP.</div>
        <p className="auth-left-desc">Join thousands of Liberian students studying smarter.</p>
        <ul className="auth-left-features">
          <li>No credit card required</li>
          <li>Instant access to all 8 subjects</li>
          <li>AI tutor included for free</li>
          <li>Works on any phone or computer</li>
        </ul>
      </div>

      <div className="auth-panel-right">
        <div className="auth-form-box">
          <div className="auth-form-title">Create your account</div>
          <div className="auth-form-sub">It is completely free — always</div>

          {error && <div className="form-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Your full name"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
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
              <label className="form-label">County</label>
              <select
                className="form-select"
                value={form.county}
                onChange={e => setForm({ ...form, county: e.target.value })}
                required
              >
                <option value="">Select your county</option>
                {counties.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button className="btn-full btn-red" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
          <div className="auth-switch" style={{ marginTop: 8 }}>
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
