import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { useQuestions, saveSession } from '@/hooks/useData'
import { useAuth } from '@/context/AuthContext'
import { getSubject, getGrade } from '@/data/subjects'

export default function QuizPage() {
  const { subject: subjectId } = useParams()
  const [searchParams]         = useSearchParams()
  const mode                   = searchParams.get('mode') || 'practice'
  const navigate               = useNavigate()
  const { user }               = useAuth()
  const subjectInfo            = getSubject(subjectId)
  const subjectName            = subjectInfo?.name || subjectId

  const { questions, loading, error } = useQuestions(subjectName, 10)

  const [current,     setCurrent]     = useState(0)
  const [selected,    setSelected]    = useState(null)
  const [answered,    setAnswered]    = useState(false)
  const [score,       setScore]       = useState(0)
  const [timeLeft,    setTimeLeft]    = useState(mode === 'mock' ? 60 : 90)
  const [showResult,  setShowResult]  = useState(false)
  const [startTime]                   = useState(Date.now())
  const timerRef                      = useRef(null)

  const LETTERS = ['A', 'B', 'C', 'D']

  // Timer
  const handleTimeUp = useCallback(() => {
    if (!answered) {
      setAnswered(true)
    }
  }, [answered])

  useEffect(() => {
    if (loading || showResult || answered) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleTimeUp(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [current, loading, showResult, answered, handleTimeUp])

  function selectAnswer(idx) {
    if (answered) return
    clearInterval(timerRef.current)
    setSelected(idx)
    setAnswered(true)
    if (idx === questions[current].correct_answer_index) {
      setScore(s => s + 1)
    }
  }

  function nextQuestion() {
    if (current + 1 >= questions.length) {
      finishQuiz()
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setAnswered(false)
      setTimeLeft(mode === 'mock' ? 60 : 90)
    }
  }

  async function finishQuiz() {
    clearInterval(timerRef.current)
    setShowResult(true)
    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    if (user) {
      await saveSession({
        userId:          user.id,
        subject:         subjectName,
        mode,
        correctAnswers:  score,
        totalQuestions:  questions.length,
        timeTakenSeconds: timeTaken,
      })
    }
  }

  function formatTime(s) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  if (loading) return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ padding: 60, textAlign: 'center' }}>Loading questions...</div>
    </div>
  )

  if (error || !questions.length) return (
    <div className="page-wrapper">
      <Navbar />
      <div style={{ padding: 60, textAlign: 'center' }}>
        <p>No questions available for {subjectName} yet. Check back soon!</p>
        <button onClick={() => navigate('/subjects')}>← Back to Subjects</button>
      </div>
    </div>
  )

  const q    = questions[current]
  const pct  = Math.round((score / questions.length) * 100)
  const grade = getGrade(pct)
  const elapsed = Math.round((Date.now() - startTime) / 1000)

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="quiz-layout">

        {/* Progress header */}
        <div className="quiz-header">
          <div className="quiz-subject-tag">{subjectName}</div>
          <div className="quiz-progress-wrap">
            <div className="quiz-progress-label">Question {current + 1} of {questions.length}</div>
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{ width: `${(current / questions.length) * 100}%` }} />
            </div>
          </div>
          <div className={`quiz-timer ${timeLeft <= 10 ? 'warning' : ''}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question or Result */}
        {!showResult ? (
          <>
            <div className="question-card">
              <div className="question-num">Question {current + 1} of {questions.length}</div>
              <div className="question-text">{q.question_text}</div>
              <div className="options-grid">
                {q.options.map((opt, i) => {
                  let cls = 'option-btn'
                  if (answered) {
                    if (i === q.correct_answer_index) cls += ' correct'
                    else if (i === selected)          cls += ' wrong'
                  } else if (i === selected) cls += ' selected'
                  return (
                    <button key={i} className={cls} onClick={() => selectAnswer(i)} disabled={answered}>
                      <span className="option-letter">{LETTERS[i]}</span>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {answered && (
                <div className="explanation-box show">
                  <strong>{selected === q.correct_answer_index ? '✅ Correct!' : '❌ Incorrect.'}</strong>{' '}
                  {q.explanation}
                </div>
              )}
            </div>

            <div className="quiz-actions">
              <button className="btn-quiz btn-quiz-outline" onClick={() => {
                if (window.confirm('Quit this quiz? Your progress will not be saved.')) {
                  clearInterval(timerRef.current)
                  navigate('/subjects')
                }
              }}>← Exit</button>
              <button className="btn-quiz btn-quiz-primary" onClick={nextQuestion} disabled={!answered}>
                {current + 1 >= questions.length ? 'See Results' : 'Next Question →'}
              </button>
            </div>
          </>
        ) : (
          <div className="result-card">
            <div className="result-icon">{pct >= 75 ? '🏆' : pct >= 60 ? '🎉' : pct >= 50 ? '📚' : '💪'}</div>
            <div className="result-score" style={{ color: grade.color }}>{pct}%</div>
            <div className="result-grade" style={{ color: grade.color }}>
              Grade: {grade.grade} — {grade.label}
            </div>
            <div className="result-desc">
              {pct >= 75 ? 'Outstanding! You are well prepared. Keep maintaining this standard.' :
               pct >= 60 ? 'Great work! A little more practice and you will be fully ready.' :
               pct >= 50 ? 'A passing grade, but there is room to improve. Review the questions you got wrong.' :
               'Do not give up! Review the explanations and try again. Consistency is key.'}
            </div>
            <div className="result-breakdown">
              <div className="result-stat">
                <div className="result-stat-val stat-green">{score}</div>
                <div className="result-stat-lbl">Correct</div>
              </div>
              <div className="result-stat">
                <div className="result-stat-val stat-red">{questions.length - score}</div>
                <div className="result-stat-lbl">Wrong</div>
              </div>
              <div className="result-stat">
                <div className="result-stat-val stat-blue">{formatTime(elapsed)}</div>
                <div className="result-stat-lbl">Time Used</div>
              </div>
            </div>
            <div className="result-actions">
              <button className="btn-quiz btn-quiz-primary"
                onClick={() => navigate(`/quiz/${subjectId}?mode=${mode}`)}>
                Try Again
              </button>
              <button className="btn-quiz btn-quiz-outline" onClick={() => navigate('/subjects')}>
                Other Subject
              </button>
              <button className="btn-quiz btn-quiz-outline" onClick={() => navigate('/tutor')}>
                Ask AI Tutor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
