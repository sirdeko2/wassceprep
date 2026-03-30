import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  function isActive(path) {
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="navbar">
      <Link to={user ? '/dashboard' : '/'} className="nav-logo">
        <div className="nav-logo-icon">LT</div>
        <div>
          <div className="nav-logo-text">WASSCEPrep</div>
          <div className="nav-logo-sub">Legacy Tech</div>
        </div>
      </Link>

      <div className="nav-center">
        <Link to="/subjects" className={`nav-center-btn${isActive('/subjects') || isActive('/quiz') ? ' nav-center-btn--active' : ''}`}>
          <span>⏱️</span> Mock &amp; Practice
        </Link>
        <Link to="/tutor" className={`nav-center-btn${isActive('/tutor') ? ' nav-center-btn--active' : ''}`}>
          <span>🤖</span> AI Tutor
        </Link>
        <Link to="/past-papers" className={`nav-center-btn${isActive('/past-papers') ? ' nav-center-btn--active' : ''}`}>
          <span>📄</span> Past Papers
        </Link>
        <Link to={user ? '/progress' : '/register'} className={`nav-center-btn${isActive('/progress') ? ' nav-center-btn--active' : ''}`}>
          <span>📊</span> Progress Tracking
        </Link>
      </div>

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
            <Link to="/login" className="nav-btn nav-btn-ghost">Log In</Link>
            <Link to="/register" className="nav-btn nav-btn-primary">Get Started Free</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
