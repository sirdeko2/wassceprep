import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  useEffect(() => {
    // Supabase puts the token in the URL hash — this handles it automatically
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User is now in password recovery mode, form is ready
      }
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError("Passwords don't match"); return }
    if (password.length < 6)  { setError("Password must be at least 6 characters"); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
    setTimeout(() => navigate('/login'), 3000)
  }

  return (
    <div className="auth-screen">
      <div className="auth-panel-left">
        <div className="auth-left-title">RESET YOUR <em>PASSWORD.</em></div>
        <p className="auth-left-desc">Choose a new password to secure your account.</p>
      </div>

      <div className="auth-panel-right">
        <div className="auth-form-box">
          <div className="auth-form-title">New Password</div>
          <div className="auth-form-sub">Enter a new password for your account</div>

          {success ? (
            <div style={{
              background: '#e8f5e9', border: '1px solid #a5d6a7',
              borderRadius: 10, padding: '14px 16px',
              fontSize: 14, color: '#2E7D32', marginTop: 16
            }}>
              ✅ Password updated! Redirecting you to login...
            </div>
          ) : (
            <>
              {error && <div className="form-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Repeat your new password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                  />
                </div>
                <button className="btn-full btn-blue" type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
