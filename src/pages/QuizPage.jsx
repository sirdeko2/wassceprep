import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/context/AuthContext'
import { getSubject, getGrade } from '@/data/subjects'
import { supabase } from '@/lib/supabase'
import { saveSession } from '@/hooks/useData'
import { useSubscription } from '@/hooks/useSubscription'
import { cacheQuestions, getCachedQuestions } from '@/lib/offlineCache'

const LETTERS = ['A', 'B', 'C', 'D']

export default function QuizPage() {
  const { subject: subjectId } = useParams()
  const [searchParams]         = useSearchParams()
  const mode                   = searchParams.get('mode') || 'practice'
  const navigate               = useNavigate()
  const { user }               = useAuth()
  const { hasFullAccess }      = useSubscription()
  const subjectInfo            = getSubject(subjectId)
  const subjectName            = subjectInfo?.name || subjectId

  // Paper navigation state (mock = multi-paper)
  const [currentPaperIdx, setCurrentPaperIdx] = useState(0)
  const papers = subjectInfo?.papers || []
  const currentPaper = papers[currentPaperIdx] || papers[0]

  // Questions state
  const [questions, setQuestions]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [current, setCurrent]         = useState(0)
  const [selected, setSelected]       = useState(null)
  const [answered, setAnswered]       = useState(false)
  const [score, setScore]             = useState(0)
  const [paperScores, setPaperScores] = useState({})
  // Track MCQ answers per question for auto-save recovery: { questionId: selectedIdx }
  const [mcqAnswers, setMcqAnswers]   = useState({})

  // Timer state (mock only)
  const [timeLeft, setTimeLeft]   = useState(0)
  const [phase, setPhase]         = useState('quiz') // quiz | essay | results
  const timerRef                  = useRef(null)
  const [warningShown, setWarningShown] = useState({ fifteen: false, five: false })

  // Essay state (Paper 2 / 3)
  const [essayQuestions, setEssayQuestions] = useState([])
  const [essayAnswers, setEssayAnswers]     = useState({})
  const [essayIdx, setEssayIdx]             = useState(0)
  const [marking, setMarking]               = useState(false)
  const [essayResults, setEssayResults]     = useState({})

  // Mock limit state
  const [mockBlocked, setMockBlocked]       = useState(false)
  const [nextAttemptTime, setNextAttemptTime] = useState(null)
  const [mockCheckDone, setMockCheckDone]   = useState(false)

  // Free user daily practice limit (10 questions/day)
  const [freeQuestionsUsedToday, setFreeQuestionsUsedToday] = useState(0)
  const [practiceBlocked, setPracticeBlocked] = useState(false)
  const FREE_DAILY_LIMIT = 10

  const startTime = useRef(Date.now())

  // Auto-save essay answers every 60 seconds in mock mode
  const autoSaveRef = useRef(null)
  useEffect(() => {
    if (mode !== 'mock' || phase !== 'essay' || !user) return
    clearInterval(autoSaveRef.current)
    autoSaveRef.current = setInterval(async () => {
      if (Object.keys(essayAnswers).length > 0) {
        await supabase.from('mock_essay_autosave').upsert({
          user_id: user.id,
          subject: subjectName,
          paper_number: currentPaper?.number,
          answers: essayAnswers,
          saved_at: new Date().toISOString(),
        }, { onConflict: 'user_id,subject,paper_number' })
      }
    }, 60000)
    return () => clearInterval(autoSaveRef.current)
  }, [mode, phase, essayAnswers, user, subjectName, currentPaper])

  // Auto-save MCQ progress every 60 seconds in mock mode (spec 3.6)
  // Saves: current question index, time left, answers so far, and score
  const mcqAutoSaveRef = useRef(null)
  useEffect(() => {
    if (mode !== 'mock' || phase !== 'quiz' || !user || questions.length === 0) return
    clearInterval(mcqAutoSaveRef.current)
    mcqAutoSaveRef.current = setInterval(async () => {
      await supabase.from('mock_mcq_autosave').upsert({
        user_id: user.id,
        subject: subjectName,
        paper_number: currentPaper?.number,
        current_index: current,
        time_left: timeLeft,
        answers: mcqAnswers,
        score_so_far: score,
        saved_at: new Date().toISOString(),
      }, { onConflict: 'user_id,subject,paper_number' })
    }, 60000)
    return () => clearInterval(mcqAutoSaveRef.current)
  }, [mode, phase, user, subjectName, currentPaper, current, timeLeft, mcqAnswers, score, questions.length])

  // Restore MCQ progress from auto-save on reconnect (spec 3.6: timer must resume)
  // Called inside loadPaper after questions are loaded
  async function restoreMCQSave(paper, loadedQuestions) {
    if (mode !== 'mock' || !user) return false
    const { data } = await supabase
      .from('mock_mcq_autosave')
      .select('*')
      .eq('user_id', user.id)
      .eq('subject', subjectName)
      .eq('paper_number', paper.number)
      .maybeSingle()

    if (!data) return false
    // Only restore if the save is recent (within this paper's full duration × 2 to be safe)
    const savedAt = new Date(data.saved_at)
    const ageMinutes = (Date.now() - savedAt) / 60000
    if (ageMinutes > (paper.duration || 120) * 2) return false

    // Restore position and timer
    setCurrent(data.current_index)
    setTimeLeft(data.time_left)
    setMcqAnswers(data.answers || {})
    setScore(data.score_so_far || 0)
    return true
  }

  // Check mock limit OR free user daily practice limit
  useEffect(() => {
    if (mode === 'mock' && user) {
      checkMockLimit()
    } else if (mode === 'practice' && user && !hasFullAccess) {
      checkFreePracticeLimit()
    } else {
      setMockCheckDone(true)
    }
  }, [mode, user, hasFullAccess])

  async function checkMockLimit() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('mock_exam_attempts')
      .select('started_at')
      .eq('user_id', user.id)
      .eq('subject', subjectName)
      .gte('started_at', today + 'T00:00:00.000Z')
      .is('reset_by_admin', null)
      .limit(1)

    if (data && data.length > 0) {
      setMockBlocked(true)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      setNextAttemptTime(tomorrow)
    } else if (mode === 'mock') {
      await supabase.from('mock_exam_attempts').insert({
        user_id: user.id,
        subject: subjectName,
        status: 'in_progress',
      })
    }
    setMockCheckDone(true)
  }

  async function checkFreePracticeLimit() {
    const today = new Date().toISOString().split('T')[0]
    // Count how many practice questions answered today across all sessions
    const { data } = await supabase
      .from('quiz_sessions')
      .select('total_questions')
      .eq('user_id', user.id)
      .eq('mode', 'practice')
      .gte('created_at', today + 'T00:00:00.000Z')

    const usedToday = (data || []).reduce((sum, s) => sum + (s.total_questions || 0), 0)
    setFreeQuestionsUsedToday(usedToday)
    if (usedToday >= FREE_DAILY_LIMIT) {
      setPracticeBlocked(true)
    }
    setMockCheckDone(true)
  }

  // Fetch MCQ questions for current paper
  useEffect(() => {
    if (!mockCheckDone || mockBlocked) return
    loadPaper(currentPaperIdx)
  }, [mockCheckDone, mockBlocked, currentPaperIdx])

  async function loadPaper(paperIdx) {
    setLoading(true)
    setCurrent(0)
    setSelected(null)
    setAnswered(false)
    setScore(0)

    const paper = papers[paperIdx]
    if (!paper) { setLoading(false); return }

    if (paper.type === 'mcq') {
      // Mock exam: always use full question count per spec
      // Practice mode: paid/trial users get full set (50); free users get remaining daily allowance (max 10/day)
      const fullCount = paper.questions || 50
      let limit
      if (mode === 'mock') {
        limit = fullCount
      } else if (hasFullAccess) {
        limit = fullCount
      } else {
        // Free user: serve remaining questions up to daily limit
        const remaining = Math.max(0, FREE_DAILY_LIMIT - freeQuestionsUsedToday)
        limit = remaining
        if (limit === 0) { setPracticeBlocked(true); setLoading(false); return }
      }

      // Try network first, fall back to offline cache
      let allQuestions = []
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('subject', subjectName)
          .eq('paper_number', paper.number)
          .eq('question_type', 'mcq')
          .eq('is_active', true)
          .limit(fullCount * 2)

        if (error) throw error
        allQuestions = data || []
        // Cache for offline use whenever we successfully fetch
        if (allQuestions.length > 0) {
          cacheQuestions(subjectName, paper.number, allQuestions)
        }
      } catch {
        // Network failed — load from IndexedDB cache
        allQuestions = await getCachedQuestions(subjectName, paper.number)
      }

      const shuffled = allQuestions.sort(() => Math.random() - 0.5).slice(0, limit)
      setQuestions(shuffled)
      setMcqAnswers({})

      if (mode === 'mock') {
        // Check if there's a saved progress to restore (spec 3.6: session recovery)
        const restored = await restoreMCQSave(paper, shuffled)
        if (!restored) {
          const duration = (paper.duration || 60) * 60
          setTimeLeft(duration)
          setWarningShown({ fifteen: false, five: false })
        }
      }
      setPhase('quiz')
    } else if (paper.type === 'essay' || paper.type === 'practical') {
      // Try network first, fall back to offline cache
      let essayData = []
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('subject', subjectName)
          .eq('paper_number', paper.number)
          .in('question_type', ['essay', 'structured', 'practical'])
          .eq('is_active', true)
          .limit(20)

        if (error) throw error
        essayData = data || []
        if (essayData.length > 0) {
          cacheQuestions(subjectName, paper.number, essayData)
        }
      } catch {
        essayData = await getCachedQuestions(subjectName, paper.number)
      }

      setEssayQuestions(essayData)
      setEssayAnswers({})
      setEssayIdx(0)
      if (mode === 'mock') {
        const duration = (paper.duration || 120) * 60
        setTimeLeft(duration)
        setWarningShown({ fifteen: false, five: false })
      }
      setPhase('essay')
    }
    setLoading(false)
  }

  // Mock timer
  useEffect(() => {
    if (mode !== 'mock' || loading || phase === 'results') return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handlePaperComplete()
          return 0
        }
        if (t === 900 && !warningShown.fifteen) {
          setWarningShown(w => ({ ...w, fifteen: true }))
          alert('⚠️ 15 minutes remaining for this paper!')
        }
        if (t === 300 && !warningShown.five) {
          setWarningShown(w => ({ ...w, five: true }))
          alert('⚠️ 5 minutes remaining for this paper!')
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [mode, loading, phase, currentPaperIdx])

  function selectAnswer(idx) {
    if (answered) return
    clearInterval(timerRef.current)
    setSelected(idx)
    setAnswered(true)
    const q = questions[current]
    if (idx === q?.correct_answer_index) {
      setScore(s => s + 1)
    }
    // Track answer for MCQ auto-save
    if (q?.id) {
      setMcqAnswers(prev => ({ ...prev, [q.id]: idx }))
    }
  }

  function nextMCQ() {
    if (current + 1 >= questions.length) {
      handlePaperComplete()
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setAnswered(false)
      if (mode === 'mock') {
        timerRef.current = setInterval(() => {
          setTimeLeft(t => {
            if (t <= 1) { clearInterval(timerRef.current); handlePaperComplete(); return 0 }
            return t - 1
          })
        }, 1000)
      }
    }
  }

  async function handlePaperComplete() {
    clearInterval(timerRef.current)
    clearInterval(mcqAutoSaveRef.current)
    const paper = papers[currentPaperIdx]
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
    setPaperScores(prev => ({ ...prev, [paper.number]: { score, total: questions.length, pct } }))
    // Delete auto-save for this paper now that it is complete (no stale restore on refresh)
    if (mode === 'mock' && user) {
      await supabase.from('mock_mcq_autosave')
        .delete()
        .eq('user_id', user.id)
        .eq('subject', subjectName)
        .eq('paper_number', paper.number)
    }

    const isLastPaper = currentPaperIdx >= papers.length - 1
    const nextPaperHasContent = !isLastPaper && papers[currentPaperIdx + 1]

    if (mode === 'practice' || !nextPaperHasContent || isLastPaper) {
      await finishExam(pct)
    } else {
      setCurrentPaperIdx(i => i + 1)
    }
  }

  async function submitEssayPaper() {
    clearInterval(timerRef.current)
    const paper = papers[currentPaperIdx]

    if (mode === 'mock' && Object.keys(essayAnswers).length > 0) {
      setMarking(true)
      const results = {}
      for (const [qId, answer] of Object.entries(essayAnswers)) {
        const q = essayQuestions.find(eq => eq.id === qId)
        if (!q || !answer?.trim()) continue
        try {
          const res = await fetch('/.netlify/functions/mark-essay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionText: q.question_text,
              markScheme: q.mark_scheme,
              modelAnswer: q.model_answer || null,
              studentAnswer: answer,
              maxMarks: q.marks || 20,
              subject: subjectName,
              paperNumber: paper.number,
            }),
          })
          const data = await res.json()
          results[qId] = data

          if (user) {
            await supabase.from('essay_answers').insert({
              user_id: user.id,
              question_id: qId,
              subject: subjectName,
              paper_number: paper.number,
              answer_text: answer,
              marks_awarded: data.marks_awarded,
              max_marks: data.max_marks,
              percentage: data.percentage,
              justification: data.justification,
              strengths: data.strengths,
              missing_points: data.missing_points,
              feedback: data.feedback,
              ai_status: data.ai_status,
            })
          }
        } catch (err) {
          results[qId] = { marks_awarded: 0, max_marks: q.marks || 20, ai_status: 'failed', feedback: 'Marking failed. Flagged for manual review.' }
        }
      }
      setEssayResults(prev => ({ ...prev, ...results }))
      setMarking(false)
    }

    setPaperScores(prev => ({ ...prev, [paper.number]: { essay: true, answers: Object.keys(essayAnswers).length } }))

    const isLastPaper = currentPaperIdx >= papers.length - 1
    if (isLastPaper) {
      await finishExam(0)
    } else {
      setCurrentPaperIdx(i => i + 1)
    }
  }

  async function finishExam(lastPct) {
    setPhase('results')
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000)
    if (user) {
      await saveSession({
        userId: user.id,
        subject: subjectName,
        mode,
        correctAnswers: score,
        totalQuestions: questions.length || 1,
        timeTakenSeconds: timeTaken,
      })
      if (mode === 'mock') {
        await supabase
          .from('mock_exam_attempts')
          .update({ status: 'completed' })
          .eq('user_id', user.id)
          .eq('subject', subjectName)
          .eq('status', 'in_progress')
      }
    }
  }

  function formatTime(s) {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  // Mock blocked screen
  if (mockBlocked) {
    const resetStr = nextAttemptTime?.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) || 'midnight tonight'
    return (
      <div className="page-wrapper"><Navbar />
        <div className="quiz-layout" style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>⏳</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: 'var(--blue)', marginBottom: 12 }}>Already attempted today</h2>
          <p style={{ color: 'var(--gray-600)', maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.6 }}>
            You have already sat the <strong>{subjectName}</strong> mock exam today. Your next attempt is available after <strong>{resetStr}</strong>.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-quiz btn-quiz-primary" onClick={() => navigate(`/quiz/${subjectId}?mode=practice`)}>Practice Instead (Unlimited)</button>
            <button className="btn-quiz btn-quiz-outline" onClick={() => navigate('/subjects')}>← Back to Subjects</button>
          </div>
        </div>
      </div>
    )
  }

  // Practice limit reached screen (free users)
  if (practiceBlocked) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const resetStr = tomorrow.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    return (
      <div className="page-wrapper"><Navbar />
        <div className="quiz-layout" style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>📚</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: 'var(--blue)', marginBottom: 12 }}>Daily Limit Reached</h2>
          <p style={{ color: 'var(--gray-600)', maxWidth: 440, margin: '0 auto 8px', lineHeight: 1.6 }}>
            You have used your <strong>{FREE_DAILY_LIMIT} free practice questions</strong> for today. Your limit resets at <strong>{resetStr}</strong>.
          </p>
          <p style={{ color: 'var(--gray-400)', maxWidth: 440, margin: '0 auto 24px', fontSize: 14, lineHeight: 1.6 }}>
            Upgrade to <strong>$5/month</strong> for unlimited practice questions, full explanations, mock exams, and performance analytics.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-quiz btn-quiz-primary" onClick={() => navigate('/payment')}>🔓 Upgrade for $5/month</button>
            <button className="btn-quiz btn-quiz-outline" onClick={() => navigate('/subjects')}>← Back to Subjects</button>
          </div>
        </div>
      </div>
    )
  }

  if (!mockCheckDone || loading) return (
    <div className="page-wrapper"><Navbar />
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
        Loading {currentPaper?.name || 'questions'}...
      </div>
    </div>
  )

  // Empty state — no questions found in the database for this subject/paper
  if (phase === 'quiz' && questions.length === 0) {
    return (
      <div className="page-wrapper"><Navbar />
        <div className="quiz-layout" style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏗️</div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: 'var(--blue)', marginBottom: 12 }}>
            Questions Coming Soon
          </h2>
          <p style={{ color: 'var(--gray-600)', maxWidth: 440, margin: '0 auto 8px', lineHeight: 1.7 }}>
            We're still building the question bank for <strong>{subjectName}</strong>{' '}
            {currentPaper ? `Paper ${currentPaper.number}` : ''}. Check back soon — our content team is adding new questions every week.
          </p>
          <p style={{ color: 'var(--gray-400)', maxWidth: 420, margin: '0 auto 24px', fontSize: 13, lineHeight: 1.6 }}>
            In the meantime, try a different subject or ask the AI Tutor for help on this topic.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-quiz btn-quiz-outline" onClick={() => navigate('/subjects')}>← Other Subjects</button>
            <button className="btn-quiz btn-quiz-primary" onClick={() => navigate('/tutor')}>🤖 Ask AI Tutor</button>
          </div>
        </div>
      </div>
    )
  }

  // Results screen
  if (phase === 'results') {
    const mcqEntries = Object.entries(paperScores).filter(([,v]) => !v.essay)
    const overallPct = mcqEntries.length > 0
      ? Math.round(mcqEntries.reduce((sum, [,v]) => sum + v.pct, 0) / mcqEntries.length)
      : 0
    const grade = getGrade(overallPct)

    return (
      <div className="page-wrapper"><Navbar />
        <div className="quiz-layout">
          <div style={{ background: 'white', borderRadius: 20, padding: 36, border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 60, marginBottom: 12 }}>{overallPct >= 75 ? '🏆' : overallPct >= 60 ? '🎉' : '📚'}</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, color: grade.color, lineHeight: 1 }}>{overallPct}%</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: grade.color, marginBottom: 4 }}>Grade {grade.grade} — {grade.label}</div>
              <div style={{ fontSize: 14, color: 'var(--gray-400)' }}>{subjectName} {mode === 'mock' ? 'Mock Exam' : 'Practice'} Complete</div>
            </div>

            {papers.map(p => {
              const ps = paperScores[p.number]
              if (!ps) return null
              if (ps.essay) return (
                <div key={p.number} style={{ background: 'var(--blue-light)', borderRadius: 12, padding: '14px 18px', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, color: 'var(--blue)', marginBottom: 4 }}>Paper {p.number}: {p.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--blue)' }}>
                    {ps.answers} answer(s) submitted.
                    {mode === 'mock' ? ' AI marking complete — see detailed feedback below.' : ' Practice mode: no AI marking.'}
                  </div>
                </div>
              )
              return (
                <div key={p.number} style={{ background: 'var(--off-white)', borderRadius: 12, padding: '14px 18px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--blue)' }}>Paper {p.number}: {p.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>{ps.score}/{ps.total} correct</div>
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: getGrade(ps.pct).color }}>{ps.pct}%</div>
                </div>
              )
            })}

            {Object.entries(essayResults).length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 16, marginBottom: 12 }}>AI Marking Feedback</div>
                {Object.entries(essayResults).map(([qId, result]) => {
                  const q = essayQuestions.find(eq => eq.id === qId)
                  const studentAns = essayAnswers[qId] || ''
                  return (
                    <div key={qId} style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid var(--gray-200)', marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', marginBottom: 8 }}>{q?.question_text?.slice(0, 80)}...</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: getGrade(result.percentage || 0).color }}>
                          {result.marks_awarded}/{result.max_marks}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{result.justification}</div>
                      </div>
                      {result.strengths?.length > 0 && (
                        <div style={{ fontSize: 13, color: 'var(--green)', marginBottom: 4 }}>
                          ✅ <strong>Strengths:</strong> {result.strengths.join('; ')}
                        </div>
                      )}
                      {result.missing_points?.length > 0 && (
                        <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 4 }}>
                          ❌ <strong>Missing:</strong> {result.missing_points.join('; ')}
                        </div>
                      )}
                      {result.feedback && (
                        <div style={{ fontSize: 13, color: 'var(--blue)', background: 'var(--blue-light)', padding: '8px 12px', borderRadius: 8, marginTop: 6 }}>
                          💡 {result.feedback}
                        </div>
                      )}
                      {/* Side-by-side: student answer vs model answer (spec 3.3.2 Option B) */}
                      {(studentAns || q?.model_answer) && (
                        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                          {studentAns && (
                            <div style={{ flex: 1, minWidth: 200, background: 'var(--off-white)', borderRadius: 8, padding: 12 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Your Answer</div>
                              <div style={{ fontSize: 13, color: 'var(--gray-800)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{studentAns}</div>
                            </div>
                          )}
                          {q?.model_answer && (
                            <div style={{ flex: 1, minWidth: 200, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 12 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Model Answer</div>
                              <div style={{ fontSize: 13, color: 'var(--gray-800)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{q.model_answer}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
              {mode === 'practice' && (
                <button className="btn-quiz btn-quiz-primary" onClick={() => window.location.reload()}>Try Again</button>
              )}
              <button className="btn-quiz btn-quiz-outline" onClick={() => navigate('/subjects')}>Other Subject</button>
              <button className="btn-quiz btn-quiz-outline" onClick={() => navigate('/tutor')}>Ask AI Tutor</button>
              <button className="btn-quiz btn-quiz-outline" onClick={() => navigate('/progress')}>View Progress</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const paper = currentPaper
  const isMockWarning = mode === 'mock' && timeLeft <= 300

  return (
    <div className="page-wrapper"><Navbar />
      <div className="quiz-layout">

        {/* Header */}
        <div className="quiz-header">
          <div className="quiz-subject-tag">{subjectName}</div>
          <div style={{ fontSize: 12, padding: '4px 10px', background: mode === 'mock' ? 'var(--red-light)' : 'var(--blue-light)', color: mode === 'mock' ? 'var(--red)' : 'var(--blue)', borderRadius: 100, fontWeight: 700 }}>
            {mode === 'mock' ? `⏱ Mock — Paper ${paper?.number}` : '📝 Practice'}
          </div>
          <div className="quiz-progress-wrap">
            <div className="quiz-progress-label">
              {phase === 'essay'
                ? `Essay Paper ${paper?.number}: ${paper?.name}`
                : mode === 'mock'
                  // Spec 3.6: show "X of Y answered" count in mock mode
                  ? `${Object.keys(mcqAnswers).length} of ${questions.length} answered`
                  : `Question ${current + 1} of ${questions.length}`}
            </div>
            {phase === 'quiz' && (
              <div className="quiz-progress-bar">
                <div className="quiz-progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
              </div>
            )}
          </div>
          {mode === 'mock' && (
            <div className={`quiz-timer${isMockWarning ? ' warning' : ''}`}>{formatTime(timeLeft)}</div>
          )}
          {mode === 'practice' && !hasFullAccess && user && (
            <div style={{ fontSize: 11, padding: '4px 10px', background: 'var(--off-white)', color: 'var(--gray-600)', borderRadius: 100, fontWeight: 600 }}>
              {FREE_DAILY_LIMIT - freeQuestionsUsedToday} free Qs left today
            </div>
          )}
        </div>

        {/* Paper navigation (mock multi-paper) */}
        {mode === 'mock' && papers.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {papers.map((p, i) => (
              <div key={p.number} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: i === currentPaperIdx ? 'var(--blue)' : paperScores[p.number] ? 'var(--green-light)' : 'var(--gray-100)',
                color: i === currentPaperIdx ? 'white' : paperScores[p.number] ? 'var(--green)' : 'var(--gray-400)',
              }}>
                {paperScores[p.number] ? '✓ ' : ''}Paper {p.number}
              </div>
            ))}
          </div>
        )}

        {/* MCQ Quiz Phase */}
        {phase === 'quiz' && questions.length > 0 && (() => {
          const q = questions[current]
          return (
            <>
              <div className="question-card">
                <div className="question-num">Question {current + 1} of {questions.length}</div>
                {q.topic && <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{q.topic}</div>}
                <div className="question-text">{q.question_text}</div>
                <div className="options-grid">
                  {q.options?.map((opt, i) => {
                    let cls = 'option-btn'
                    if (answered) {
                      if (i === q.correct_answer_index) cls += ' correct'
                      else if (i === selected) cls += ' wrong'
                    } else if (i === selected) cls += ' selected'
                    return (
                      <button key={i} className={cls} onClick={() => selectAnswer(i)} disabled={answered}>
                        <span className="option-letter">{LETTERS[i]}</span>{opt}
                      </button>
                    )
                  })}
                </div>
                {answered && (
                  <div className="explanation-box show">
                    <strong>{selected === q.correct_answer_index ? '✅ Correct!' : '❌ Incorrect.'}</strong>{' '}
                    {hasFullAccess
                      ? q.explanation
                      : (
                        <span style={{ color: 'var(--gray-400)' }}>
                          🔒 Explanation locked.{' '}
                          <button
                            onClick={() => navigate('/upgrade')}
                            style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: 0 }}
                          >
                            Upgrade to unlock
                          </button>
                        </span>
                      )
                    }
                  </div>
                )}
              </div>
              <div className="quiz-actions">
                <button className="btn-quiz btn-quiz-outline" onClick={() => {
                  if (window.confirm('Exit? Progress will not be saved.')) { clearInterval(timerRef.current); navigate('/subjects') }
                }}>← Exit</button>
                <button className="btn-quiz btn-quiz-primary" onClick={nextMCQ} disabled={!answered}>
                  {current + 1 >= questions.length ? (mode === 'mock' && currentPaperIdx < papers.length - 1 ? 'Next Paper →' : 'See Results') : 'Next Question →'}
                </button>
              </div>
            </>
          )
        })()}

        {/* No MCQ questions available */}
        {phase === 'quiz' && !loading && questions.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 16, border: '1px solid var(--gray-200)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
            <p style={{ color: 'var(--gray-600)', marginBottom: 20 }}>No questions available for {subjectName} Paper {paper?.number} yet.</p>
            <button className="btn-quiz btn-quiz-outline" onClick={() => navigate('/subjects')}>← Back to Subjects</button>
          </div>
        )}

        {/* Essay Phase */}
        {phase === 'essay' && (
          <div>
            <div style={{ background: 'var(--blue-light)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, fontSize: 13, color: 'var(--blue)' }}>
              <strong>Paper {paper?.number}: {paper?.name}</strong> — {paper?.duration} minutes, {paper?.totalMarks} marks
              {mode === 'practice' && <span> (Practice mode — answers not marked)</span>}
              {mode === 'mock' && <span> (Mock mode — answers will be AI-marked after submission)</span>}
            </div>

            {paper?.sections?.map(section => {
              const sectionQuestions = essayQuestions.filter(q => q.section === section.id)
              // Skip sections that have no questions loaded (e.g. Literature Paper 3 Section D
              // is a "choose one more from A/B/C" instruction — no standalone questions needed)
              if (sectionQuestions.length === 0 && section.questions === 0) return null
              return (
              <div key={section.id} style={{ marginBottom: 24 }}>
                <div style={{ background: 'var(--blue)', color: 'white', padding: '10px 16px', borderRadius: '10px 10px 0 0', fontWeight: 700, fontSize: 14 }}>
                  Section {section.id}: {section.title}
                </div>
                <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: 16 }}>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16, fontStyle: 'italic' }}>{section.instruction}</div>
                  {sectionQuestions.map((q, i) => (
                    <div key={q.id} style={{ marginBottom: 20, padding: 16, background: 'var(--off-white)', borderRadius: 10 }}>
                      <div style={{ fontSize: 13, color: 'var(--red)', fontWeight: 700, marginBottom: 6 }}>
                        Question {i + 1} [{q.marks || 20} marks]
                      </div>
                      <div style={{ fontSize: 15, color: 'var(--gray-800)', lineHeight: 1.7, marginBottom: 12, whiteSpace: 'pre-wrap' }}>{q.question_text}</div>
                      <textarea
                        style={{
                          width: '100%', minHeight: 160, padding: '12px 14px',
                          border: essayAnswers[q.id] ? '1.5px solid var(--green)' : '1.5px solid var(--gray-200)',
                          borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                          outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7,
                        }}
                        placeholder="Write your answer here..."
                        value={essayAnswers[q.id] || ''}
                        onChange={e => setEssayAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      />
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                        {(essayAnswers[q.id] || '').split(/\s+/).filter(Boolean).length} words
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

            {/* Fallback if no sections/questions yet */}
            {essayQuestions.length === 0 && (
              <div style={{ background: 'white', borderRadius: 12, padding: 32, border: '1px solid var(--gray-200)', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✍️</div>
                <div style={{ fontWeight: 700, color: 'var(--blue)', marginBottom: 8 }}>Essay questions coming soon</div>
                <div style={{ fontSize: 14, color: 'var(--gray-400)', marginBottom: 20 }}>The admin is still uploading Paper {paper?.number} theory questions for {subjectName}.</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              {marking ? (
                <div style={{ flex: 1, padding: 14, background: 'var(--blue-light)', borderRadius: 10, textAlign: 'center', color: 'var(--blue)', fontWeight: 600, fontSize: 14 }}>
                  🤖 AI is marking your answers... please wait...
                </div>
              ) : (
                <button className="btn-quiz btn-quiz-primary" style={{ flex: 1, padding: 14, fontSize: 15 }} onClick={submitEssayPaper}>
                  {currentPaperIdx < papers.length - 1 ? `Submit Paper ${paper?.number} & Continue →` : 'Submit & See Results'}
                </button>
              )}
              <button className="btn-quiz btn-quiz-outline" onClick={() => { if (window.confirm('Exit?')) { clearInterval(timerRef.current); navigate('/subjects') } }}>← Exit</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
