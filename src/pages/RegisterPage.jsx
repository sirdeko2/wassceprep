import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate   = useNavigate()
  const [form,        setForm]        = useState({ fullName: '', email: '', county: '', password: '' })
  const [tosAccepted, setTosAccepted] = useState(false)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [emailSent,   setEmailSent]   = useState(false)   // show "check your email" screen

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!tosAccepted) { setError('Please accept the Terms of Service to continue'); return }
    setLoading(true)
    const { data, error } = await signUp({
      email:    form.email,
      password: form.password,
      fullName: form.fullName,
      county:   form.county,
    })
    setLoading(false)
    if (error) { setError(error.message); return }

    // If Supabase email confirmation is enabled, session will be null
    // and the user must verify before they can log in.
    if (data?.session) {
      // Email confirmation disabled — log straight in
      navigate('/dashboard')
    } else {
      // Email confirmation enabled — show "check your inbox" screen
      setEmailSent(true)
    }
  }

  const counties = [
    'Montserrado','Nimba','Bong','Lofa','Margibi','Grand Bassa',
    'Grand Cape Mount','Grand Gedeh','Grand Kru','Maryland',
    'Sinoe','River Cess','River Gee','Gbarpolu','Other'
  ]

  // ── Email sent confirmation screen ─────────────────────────
  if (emailSent) {
    return (
      <div className="auth-screen">
        <div className="auth-panel-left">
          <div className="auth-left-title">ALMOST <em>THERE.</em></div>
          <p className="auth-left-desc">One more step — check your inbox to verify your email and activate your account.</p>
        </div>
        <div className="auth-panel-right">
          <div className="auth-form-box" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
            <div className="auth-form-title">Check your email</div>
            <p style={{ color: '#4a5568', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
              We sent a confirmation link to <strong>{form.email}</strong>.<br />
              Click it to activate your account and start studying.
            </p>
            <div style={{
              background: '#e6eaf5', borderRadius: 10, padding: '14px 18px',
              fontSize: 13, color: '#002868', marginBottom: 24, textAlign: 'left', lineHeight: 1.6
            }}>
              <strong>Didn't receive it?</strong> Check your spam folder. The link expires in 24 hours.
              If it still doesn't arrive, try registering again with the same email.
            </div>
            <Link to="/login" style={{
              display: 'block', background: '#002868', color: 'white',
              padding: '12px 0', borderRadius: 10, fontSize: 15, fontWeight: 700,
              textDecoration: 'none', marginBottom: 12
            }}>
              Go to Login
            </Link>
            <Link to="/" style={{ color: '#8892a4', fontSize: 13 }}>← Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Registration form ───────────────────────────────────────
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

            {/* Terms of Service checkbox */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
              <input
                id="tos"
                type="checkbox"
                checked={tosAccepted}
                onChange={e => setTosAccepted(e.target.checked)}
                style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, cursor: 'pointer', accentColor: '#002868' }}
              />
              <label htmlFor="tos" style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.5, cursor: 'pointer' }}>
                I agree to the{' '}
                <Link to="/terms" target="_blank" style={{ color: '#002868', fontWeight: 600 }}>
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/terms#privacy" target="_blank" style={{ color: '#002868', fontWeight: 600 }}>
                  Privacy Policy
                </Link>
              </label>
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
