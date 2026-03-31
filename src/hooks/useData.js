import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useQuestions(subject, limit = 10) {
  const [questions, setQuestions] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    if (!subject) return
    setLoading(true)

    supabase
      .from('questions')
      .select('*')
      .eq('subject', subject)
      .eq('is_active', true)
      .limit(limit * 3) // fetch more than needed so we can shuffle
      .then(({ data, error }) => {
        if (error) { setError(error.message); setLoading(false); return }
        // Shuffle and slice
        const shuffled = (data || []).sort(() => Math.random() - 0.5).slice(0, limit)
        setQuestions(shuffled)
        setLoading(false)
      })
  }, [subject, limit])

  return { questions, loading, error }
}

// ─────────────────────────────────────────────────────────
// useProgress — fetch a user's progress stats from Supabase
// ─────────────────────────────────────────────────────────
export function useProgress() {
  const { user } = useAuth()
  const [progress, setProgress] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user) return

    supabase
      .from('quiz_sessions')
      .select('subject, score_pct, total_questions, correct_answers, mode, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) { setLoading(false); return }

        // Compute stats
        const totalSessions  = data.length
        const totalQuestions = data.reduce((sum, s) => sum + s.total_questions, 0)
        const avgScore       = totalSessions
          ? Math.round(data.reduce((sum, s) => sum + s.score_pct, 0) / totalSessions)
          : 0

        // Per-subject breakdown
        const bySubject = {}
        data.forEach(s => {
          if (!bySubject[s.subject]) bySubject[s.subject] = { sessions: 0, totalScore: 0 }
          bySubject[s.subject].sessions++
          bySubject[s.subject].totalScore += s.score_pct
        })
        Object.keys(bySubject).forEach(subj => {
          bySubject[subj].avg = Math.round(bySubject[subj].totalScore / bySubject[subj].sessions)
        })

        const bestSubject = Object.entries(bySubject)
          .sort((a, b) => b[1].avg - a[1].avg)[0]?.[0] || 'N/A'

        setProgress({ totalSessions, totalQuestions, avgScore, bySubject, bestSubject, recent: data.slice(0, 10) })
        setLoading(false)
      })
  }, [user])

  return { progress, loading }
}

// ─────────────────────────────────────────────────────────
// saveSession — save a completed quiz session to Supabase
// ─────────────────────────────────────────────────────────
export async function saveSession({ userId, subject, mode, correctAnswers, totalQuestions, timeTakenSeconds }) {
  const scorePct = Math.round((correctAnswers / totalQuestions) * 100)

  const { error } = await supabase.from('quiz_sessions').insert({
    user_id:          userId,
    subject,
    mode,
    correct_answers:  correctAnswers,
    total_questions:  totalQuestions,
    score_pct:        scorePct,
    time_taken_secs:  timeTakenSeconds,
  })

  return { error }
}
