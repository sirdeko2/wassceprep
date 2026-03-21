import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot password state
  const [showReset,    setShowReset]    = useState(false)
  const [resetEmail,   setResetEmail]   = useState('')
  const [resetSent,    setResetSent]    = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError,   setResetError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn({ email: form.email, password: form.password })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/dashboard')
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setResetError('')
    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetLoading(false)
    if (error) { setResetError(error.message); return }
    setResetSent(true)
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

      {/* Right panel */}
      <div className="auth-panel-right">
        <div className="auth-form-box">

          {/* ── FORGOT PASSWORD VIEW ── */}
          {showReset ? (
            <>
              <div className="auth-form-title">Reset Password</div>
              <div className="auth-form-sub">
                {resetSent
                  ? 'Check your email for a password reset link.'
                  : "Enter your email and we'll send you a reset link."}
              </div>

              {!resetSent && (
                <>
                  {resetError && <div className="form-error">{resetError}</div>}
                  <form onSubmit={handleForgotPassword}>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        className="form-input"
                        type="email"
                        placeholder="you@example.com"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    <button className="btn-full btn-blue" type="submit" disabled={resetLoading}>
                      {resetLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                </>
              )}

              {resetSent && (
                <div style={{
                  background: '#e8f5e9', border: '1px solid #a5d6a7',
                  borderRadius: 10, padding: '14px 16px',
                  fontSize: 14, color: '#2E7D32', marginTop: 16
                }}>
                  ✅ Reset link sent to <strong>{resetEmail}</strong>. Check your inbox (and spam folder).
                </div>
              )}

              <div className="auth-switch" style={{ marginTop: 20 }}>
                <button
                  onClick={() => { setShowReset(false); setResetSent(false); setResetError('') }}
                  style={{ background: 'none', border: 'none', color: '#002868', cursor: 'pointer', fontSize: 14, textDecoration: 'underline', padding: 0 }}
                >
                  ← Back to Login
                </button>
              </div>
            </>
          ) : (

            /* ── LOGIN VIEW ── */
            <>
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
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Password
                    <button
                      type="button"
                      onClick={() => { setShowReset(true); setResetEmail(form.email) }}
                      style={{ background: 'none', border: 'none', color: '#002868', cursor: 'pointer', fontSize: 12, textDecoration: 'underline', padding: 0, fontWeight: 500 }}
                    >
                      Forgot password?
                    </button>
                  </label>
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
            </>
          )}

        </div>
      </div>
    </div>
  )
}
