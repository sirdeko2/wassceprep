import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Navbar({ variant = 'public' }) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to={user ? '/dashboard' : '/'} className="nav-logo">
        <div className="nav-logo-icon">LT</div>
        <div>
          <div className="nav-logo-text">WASSCEPrep</div>
          <div className="nav-logo-sub">Legacy Tech</div>
        </div>
      </Link>

      {/* Center nav links */}
      <div className="nav-center">
        <Link to="/subjects" className="nav-center-btn">
          <span>📝</span> Past Paper Practice
        </Link>
        <Link to="/subjects?mode=mock" className="nav-center-btn">
          <span>⏱️</span> Timed Mock Exams
        </Link>
        <Link to="/tutor" className="nav-center-btn">
          <span>🤖</span> AI Tutor
        </Link>
        <Link to={user ? '/progress' : '/register'} className="nav-center-btn">
          <span>📊</span> Progress Tracking
        </Link>
      </div>

      {/* Right side */}
      <div className="nav-right">
        {user ? (
          <div className="nav-user">
            <span className="nav-username">{profile?.full_name || user.email}</span>
            <div className="nav-avatar">
              {(profile?.full_name || user.email)?.[0]?.toUpperCase()}
            </div>
            <button className="nav-btn nav-btn-ghost" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        ) : (
          <div className="nav-links">
            <Link to="/login"    className="nav-btn nav-btn-ghost">Log In</Link>
            <Link to="/register" className="nav-btn nav-btn-primary">Get Started Free</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
