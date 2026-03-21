import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'

import LandingPage        from '@/pages/LandingPage'
import LoginPage          from '@/pages/LoginPage'
import RegisterPage       from '@/pages/RegisterPage'
import DashboardPage      from '@/pages/DashboardPage'
import SubjectsPage       from '@/pages/SubjectsPage'
import QuizPage           from '@/pages/QuizPage'
import ResultsPage        from '@/pages/ResultsPage'
import TutorPage          from '@/pages/TutorPage'
import ProgressPage       from '@/pages/ProgressPage'
import NotFoundPage       from '@/pages/NotFoundPage'
import AdminPage          from '@/pages/AdminPage'
import ResetPasswordPage  from '@/pages/ResetPasswordPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading...</div>
  return user ? children : <Navigate to="/login" replace />
}

function SetupBanner() {
  if (isSupabaseConfigured) return null
  return (
    <div style={{
      background: '#fff3cd', borderBottom: '1px solid #ffc107',
      padding: '10px 24px', textAlign: 'center', fontSize: 13, color: '#856404'
    }}>
      ⚙️ <strong>Setup required:</strong> Copy <code>.env.example</code> to <code>.env</code> and add your Supabase and Anthropic keys to enable auth. See <strong>README.md</strong>.
    </div>
  )
}

export default function App() {
  return (
    <>
      <SetupBanner />
      <Routes>
        <Route path="/"               element={<LandingPage />} />
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/register"       element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard"      element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/subjects"       element={<PrivateRoute><SubjectsPage /></PrivateRoute>} />
        <Route path="/quiz/:subject"  element={<PrivateRoute><QuizPage /></PrivateRoute>} />
        <Route path="/results"        element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
        <Route path="/tutor"          element={<PrivateRoute><TutorPage /></PrivateRoute>} />
        <Route path="/progress"       element={<PrivateRoute><ProgressPage /></PrivateRoute>} />
        <Route path="/admin"          element={<PrivateRoute><AdminPage /></PrivateRoute>} />
        <Route path="*"               element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
