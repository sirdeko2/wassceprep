import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { SUBJECTS } from '@/data/subjects'

const ADMIN_EMAIL = 'sirdeko2@gmail.com'

const EMPTY_FORM = {
  subject: 'Mathematics',
  topic: '',
  year: new Date().getFullYear(),
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer_index: 0,
  explanation: '',
  difficulty: 'medium',
}

// Empty form for essay/structured/practical questions
const EMPTY_ESSAY_FORM = {
  subject: 'Mathematics',
  paper_number: 2,
  question_type: 'essay',
  section: 'A',
  topic: '',
  year: new Date().getFullYear(),
  question_text: '',
  marks: 20,
  mark_scheme: '',
  model_answer: '',
  keywords: '',   // comma-separated required keywords for rubric scoring
  difficulty: 'medium',
}

const EMPTY_PAPER = {
  subject: 'Mathematics',
  year: new Date().getFullYear(),
  paper_number: 1,
  title: '',
  description: '',
  file_url: '',
  mark_scheme_url: '',
  visibility: 'draft',
  region_tag: 'Liberia',
}

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab]               = useState('questions')
  const [questions, setQuestions]   = useState([])
  const [papers, setPapers]         = useState([])
  const [stats, setStats]           = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [essayForm, setEssayForm]   = useState(EMPTY_ESSAY_FORM)
  const [editingEssayId, setEditingEssayId] = useState(null)
  const [paperForm, setPaperForm]   = useState(EMPTY_PAPER)
  const [editingId, setEditingId]   = useState(null)
  const [editingPaperId, setEditingPaperId] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState('')
  const [search, setSearch]         = useState('')
  const [filterSubj, setFilterSubj] = useState('All')
  const [deleteId, setDeleteId]     = useState(null)

  // Student management state
  const [students, setStudents]           = useState([])
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentMockAttempts, setStudentMockAttempts] = useState([])
  const [studentAIUsage, setStudentAIUsage] = useState([])
  const [resetReason, setResetReason]     = useState('')
  const [resetLoading, setResetLoading]   = useState(false)

  // Manual essay marking state
  const [pendingEssays, setPendingEssays] = useState([])
  const [markingEssay, setMarkingEssay]   = useState(null)
  const [manualMarks, setManualMarks]     = useState('')
  const [manualFeedback, setManualFeedback] = useState('')
  const [markSaving, setMarkSaving]       = useState(false)

  useEffect(() => {
    if (!user) return
    if (user.email !== ADMIN_EMAIL) { navigate('/dashboard'); return }
    fetchQuestions()
    fetchPapers()
    fetchStats()
  }, [user])

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (tab === 'students') fetchStudents()
    if (tab === 'marking') fetchPendingEssays()
  }, [tab])

  async function fetchQuestions() {
    setLoading(true)
    const { data } = await supabase
      .from('questions')
      .select('*')
      .order('subject', { ascending: true })
      .order('created_at', { ascending: false })
    setQuestions(data || [])
    setLoading(false)
  }

  async function fetchPapers() {
    const { data } = await supabase
      .from('past_papers')
      .select('*')
      .order('year', { ascending: false })
    setPapers(data || [])
  }

  async function fetchStats() {
    const { data: qData } = await supabase.from('questions').select('subject')
    const { data: uData } = await supabase.from('profiles').select('id, full_name, county, created_at')
    const { data: sData } = await supabase.from('quiz_sessions').select('subject, score_pct, created_at')
    if (qData) {
      const bySubject = {}
      qData.forEach(q => { bySubject[q.subject] = (bySubject[q.subject] || 0) + 1 })
      setStats({
        totalQuestions: qData.length,
        bySubject,
        totalUsers: uData?.length || 0,
        totalSessions: sData?.length || 0,
        avgScore: sData?.length
          ? Math.round(sData.reduce((s, r) => s + r.score_pct, 0) / sData.length)
          : 0,
        recentUsers: uData?.slice(-5).reverse() || [],
      })
    }
  }

  async function fetchStudents() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, county, created_at, email')
      .order('created_at', { ascending: false })
    setStudents(data || [])
  }

  async function fetchStudentDetails(studentId) {
    const [{ data: attempts }, { data: aiUsage }] = await Promise.all([
      supabase.from('mock_exam_attempts').select('*').eq('user_id', studentId).order('started_at', { ascending: false }).limit(20),
      supabase.from('ai_tutor_usage').select('*').eq('user_id', studentId).order('created_at', { ascending: false }).limit(20),
    ])
    setStudentMockAttempts(attempts || [])
    setStudentAIUsage(aiUsage || [])
  }

  async function resetMockAttempt(attemptId) {
    if (!resetReason.trim()) { showToast('Please enter a reason for the reset'); return }
    setResetLoading(true)
    await supabase.from('mock_exam_attempts')
      .update({ reset_by_admin: user.id, reset_reason: resetReason, reset_at: new Date().toISOString() })
      .eq('id', attemptId)
    // Audit log
    await supabase.from('admin_reset_log').insert({
      admin_email: user.email,
      action: 'mock_attempt_reset',
      target_user_id: selectedStudent?.id || null,
      target_id: attemptId,
      reason: resetReason,
    })
    showToast('Mock attempt reset successfully')
    setResetReason('')
    if (selectedStudent) fetchStudentDetails(selectedStudent.id)
    setResetLoading(false)
  }

  async function resetAITutorLimit(studentId) {
    if (!resetReason.trim()) { showToast('Please enter a reason for the reset'); return }
    setResetLoading(true)
    // Delete all AI tutor usage records for this student in the current 8-hour window
    const windowStart = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
    await supabase.from('ai_tutor_usage')
      .delete()
      .eq('user_id', studentId)
      .gte('created_at', windowStart)
    // Log the admin reset
    await supabase.from('admin_reset_log').insert({
      admin_email: user.email,
      action: 'ai_tutor_reset',
      target_user_id: studentId,
      reason: resetReason,
    })
    showToast('AI Tutor limit reset for student')
    setResetReason('')
    if (selectedStudent) fetchStudentDetails(selectedStudent.id)
    setResetLoading(false)
  }

  async function fetchPendingEssays() {
    const { data } = await supabase
      .from('essay_answers')
      .select('*, profiles(full_name)')
      .in('ai_status', ['failed', 'manual_review', 'pending'])
      .order('created_at', { ascending: false })
      .limit(50)
    setPendingEssays(data || [])
  }

  async function saveManualMark() {
    if (!markingEssay || !manualMarks) { showToast('Please enter marks'); return }
    const marks = parseInt(manualMarks)
    if (isNaN(marks) || marks < 0 || marks > markingEssay.max_marks) {
      showToast(`Marks must be 0 to ${markingEssay.max_marks}`)
      return
    }
    setMarkSaving(true)
    await supabase.from('essay_answers').update({
      marks_awarded: marks,
      percentage: Math.round((marks / markingEssay.max_marks) * 100 * 10) / 10,
      feedback: manualFeedback || 'Marked manually by teacher.',
      ai_status: 'manual_review',
      manually_marked_by: user.email,
      manually_marked_at: new Date().toISOString(),
    }).eq('id', markingEssay.id)
    setMarkSaving(false)
    setMarkingEssay(null)
    setManualMarks('')
    setManualFeedback('')
    showToast('Mark saved successfully')
    fetchPendingEssays()
  }

  async function saveEssayQuestion(e) {
    e.preventDefault()
    if (!essayForm.question_text || !essayForm.mark_scheme) {
      showToast('Question text and mark scheme are required')
      return
    }
    setSaving(true)
    const keywords = essayForm.keywords
      ? essayForm.keywords.split(',').map(k => k.trim()).filter(Boolean)
      : []
    const payload = {
      subject: essayForm.subject,
      paper_number: parseInt(essayForm.paper_number),
      question_type: essayForm.question_type,
      section: essayForm.section,
      topic: essayForm.topic,
      year: parseInt(essayForm.year),
      question_text: essayForm.question_text,
      marks: parseInt(essayForm.marks),
      mark_scheme: essayForm.mark_scheme,
      model_answer: essayForm.model_answer,
      keywords: keywords.length ? JSON.stringify(keywords) : null,
      difficulty: essayForm.difficulty,
      is_active: true,
    }
    const { error } = editingEssayId
      ? await supabase.from('questions').update(payload).eq('id', editingEssayId)
      : await supabase.from('questions').insert(payload)
    setSaving(false)
    if (error) { showToast('Error: ' + error.message); return }
    showToast(editingEssayId ? 'Essay question updated!' : 'Essay question added!')
    setEssayForm(EMPTY_ESSAY_FORM)
    setEditingEssayId(null)
    setTab('questions')
    fetchQuestions()
  }

  async function saveQuestion(e) {
    e.preventDefault()
    if (!form.question_text || !form.option_a || !form.option_b || !form.option_c || !form.option_d || !form.explanation) {
      showToast('Please fill in all required fields')
      return
    }
    setSaving(true)
    const payload = {
      subject: form.subject,
      topic: form.topic,
      year: parseInt(form.year),
      question_text: form.question_text,
      options: [form.option_a, form.option_b, form.option_c, form.option_d],
      correct_answer_index: parseInt(form.correct_answer_index),
      explanation: form.explanation,
      difficulty: form.difficulty,
      is_active: true,
    }
    const { error } = editingId
      ? await supabase.from('questions').update(payload).eq('id', editingId)
      : await supabase.from('questions').insert(payload)
    setSaving(false)
    if (error) { showToast('Error: ' + error.message); return }
    showToast(editingId ? 'Question updated!' : 'Question added!')
    setForm(EMPTY_FORM)
    setEditingId(null)
    setTab('questions')
    fetchQuestions()
    fetchStats()
  }

  async function savePaper(e) {
    e.preventDefault()
    if (!paperForm.subject || !paperForm.year || !paperForm.paper_number) {
      showToast('Please fill in all required fields')
      return
    }
    setSaving(true)
    const payload = {
      subject: paperForm.subject,
      year: parseInt(paperForm.year),
      paper_number: parseInt(paperForm.paper_number),
      title: paperForm.title || `${paperForm.subject} ${paperForm.year} — Paper ${paperForm.paper_number}`,
      description: paperForm.description,
      file_url: paperForm.file_url,
      mark_scheme_url: paperForm.mark_scheme_url,
      visibility: paperForm.visibility,
      region_tag: paperForm.region_tag,
    }
    const { error } = editingPaperId
      ? await supabase.from('past_papers').update(payload).eq('id', editingPaperId)
      : await supabase.from('past_papers').insert(payload)
    setSaving(false)
    if (error) { showToast('Error: ' + error.message); return }
    showToast(editingPaperId ? 'Paper updated!' : 'Paper added!')
    setPaperForm(EMPTY_PAPER)
    setEditingPaperId(null)
    setTab('past-papers')
    fetchPapers()
  }

  function editQuestion(q) {
    setForm({
      subject: q.subject,
      topic: q.topic || '',
      year: q.year || new Date().getFullYear(),
      question_text: q.question_text,
      option_a: q.options[0] || '',
      option_b: q.options[1] || '',
      option_c: q.options[2] || '',
      option_d: q.options[3] || '',
      correct_answer_index: q.correct_answer_index,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
    })
    setEditingId(q.id)
    setTab('add-question')
    window.scrollTo(0, 0)
  }

  async function deleteQuestion(id) {
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) { showToast('Error deleting: ' + error.message); return }
    showToast('Question deleted')
    setDeleteId(null)
    fetchQuestions()
    fetchStats()
  }

  async function toggleActive(id, current) {
    await supabase.from('questions').update({ is_active: !current }).eq('id', id)
    fetchQuestions()
  }

  async function togglePaperVisibility(id, current) {
    const visibility = current === 'published' ? 'draft' : 'published'
    await supabase.from('past_papers').update({ visibility }).eq('id', id)
    fetchPapers()
    showToast(`Paper ${visibility === 'published' ? 'published' : 'set to draft'}`)
  }

  async function deletePaper(id) {
    await supabase.from('past_papers').update({ visibility: 'deleted' }).eq('id', id)
    fetchPapers()
    showToast('Paper removed')
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const filtered = questions.filter(q => {
    const matchSubject = filterSubj === 'All' || q.subject === filterSubj
    const matchSearch = !search ||
      q.question_text.toLowerCase().includes(search.toLowerCase()) ||
      q.topic?.toLowerCase().includes(search.toLowerCase())
    return matchSubject && matchSearch
  })

  const LETTERS = ['A', 'B', 'C', 'D']

  const s = {
    page: { minHeight: '100vh', background: '#f1f3f7', fontFamily: "'DM Sans', sans-serif" },
    header: { background: '#002868', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' },
    headerLogo: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'white', letterSpacing: 2 },
    adminBadge: { background: '#BF0A30', color: 'white', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' },
    backBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif" },
    body: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
    tabs: { display: 'flex', gap: 4, background: 'white', padding: 6, borderRadius: 12, marginBottom: 28, border: '1px solid #e2e6ee', flexWrap: 'wrap' },
    tab: { padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' },
    tabActive: { background: '#002868', color: 'white' },
    tabInactive: { background: 'transparent', color: '#4a5568' },
    card: { background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e6ee', marginBottom: 20 },
    label: { fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6, display: 'block' },
    input: { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e6ee', borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#f8f9fc', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e6ee', borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#f8f9fc', minHeight: 80, resize: 'vertical', boxSizing: 'border-box' },
    select: { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e6ee', borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#f8f9fc', cursor: 'pointer' },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
    formGroup: { marginBottom: 16 },
    btnPrimary: { background: '#002868', color: 'white', padding: '11px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    btnRed: { background: '#BF0A30', color: 'white', padding: '11px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    btnOutline: { background: 'white', color: '#4a5568', padding: '11px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: '2px solid #e2e6ee', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
    statCard: { background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e2e6ee', textAlign: 'center' },
    statVal: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, lineHeight: 1, marginBottom: 4 },
    statLbl: { fontSize: 11, color: '#8892a4', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 },
    qRow: { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', borderBottom: '1px solid #f1f3f7', transition: 'background 0.15s' },
    qNum: { width: 28, height: 28, borderRadius: 8, background: '#e6eaf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#002868', flexShrink: 0, marginTop: 2 },
    qText: { flex: 1 },
    qTitle: { fontSize: 14, fontWeight: 600, color: '#1a202c', marginBottom: 4, lineHeight: 1.4 },
    qMeta: { fontSize: 12, color: '#8892a4', display: 'flex', gap: 10, flexWrap: 'wrap' },
    qActions: { display: 'flex', gap: 8, flexShrink: 0 },
    editBtn: { background: '#e6eaf5', color: '#002868', border: 'none', padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    delBtn: { background: '#f5e6ea', color: '#BF0A30', border: 'none', padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    toggleBtn: { border: 'none', padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    sectionTitle: { fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#002868', marginBottom: 6 },
    sectionSub: { fontSize: 14, color: '#8892a4', marginBottom: 24 },
    toast: { position: 'fixed', bottom: 24, right: 24, background: '#1a202c', color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
    modalBox: { background: 'white', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', textAlign: 'center' },
  }

  if (!user) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
  if (user.email !== ADMIN_EMAIL) return null

  const TABS = [
    { id: 'questions', label: '📋 All Questions' },
    { id: 'add-question', label: editingId ? '✏️ Edit MCQ' : '➕ Add MCQ' },
    { id: 'add-essay-question', label: editingEssayId ? '✏️ Edit Essay Q' : '✍️ Add Essay Q' },
    { id: 'past-papers', label: '📄 Past Papers' },
    { id: 'add-paper', label: editingPaperId ? '✏️ Edit Paper' : '➕ Upload Paper' },
    { id: 'marking', label: '🖊️ Manual Marking' },
    { id: 'students', label: '👥 Students' },
    { id: 'stats', label: '📊 Stats' },
  ]

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      {deleteId && (
        <div style={s.modal}>
          <div style={s.modalBox}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a202c', marginBottom: 8 }}>Delete Question?</div>
            <div style={{ fontSize: 14, color: '#4a5568', marginBottom: 24 }}>This cannot be undone.</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button style={s.btnOutline} onClick={() => setDeleteId(null)}>Cancel</button>
              <button style={s.btnRed} onClick={() => deleteQuestion(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: '#BF0A30', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'white' }}>LT</div>
          <div style={s.headerLogo}>WASSCEPrep Admin</div>
          <div style={s.adminBadge}>Admin Panel</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{user.email}</span>
          <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Back to App</button>
        </div>
      </div>

      <div style={s.body}>
        <div style={s.tabs}>
          {TABS.map(t => (
            <button
              key={t.id}
              style={{ ...s.tab, ...(tab === t.id ? s.tabActive : s.tabInactive) }}
              onClick={() => {
                setTab(t.id)
                if (t.id !== 'add-question') { setEditingId(null); setForm(EMPTY_FORM) }
                if (t.id !== 'add-essay-question') { setEditingEssayId(null); setEssayForm(EMPTY_ESSAY_FORM) }
                if (t.id !== 'add-paper') { setEditingPaperId(null); setPaperForm(EMPTY_PAPER) }
                if (t.id === 'students') { setSelectedStudent(null); setStudentMockAttempts([]); setStudentAIUsage([]) }
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'questions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={s.sectionTitle}>Question Bank</div>
                <div style={s.sectionSub}>{questions.length} total questions across all subjects</div>
              </div>
              <button style={s.btnPrimary} onClick={() => { setTab('add-question'); setEditingId(null); setForm(EMPTY_FORM) }}>
                + Add New Question
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <input style={{ ...s.input, maxWidth: 280 }} placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ ...s.select, maxWidth: 200 }} value={filterSubj} onChange={e => setFilterSubj(e.target.value)}>
                <option value="All">All Subjects</option>
                {SUBJECTS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e6ee', overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#8892a4' }}>Loading questions...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#8892a4' }}>No questions found</div>
              ) : (
                filtered.map((q, i) => (
                  <div key={q.id} style={{ ...s.qRow, background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                    <div style={s.qNum}>{i + 1}</div>
                    <div style={s.qText}>
                      <div style={s.qTitle}>{q.question_text}</div>
                      <div style={s.qMeta}>
                        <span style={{ background: '#e6eaf5', color: '#002868', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>{q.subject}</span>
                        {q.topic && <span>📌 {q.topic}</span>}
                        {q.year && <span>📅 {q.year}</span>}
                        <span style={{ background: q.difficulty === 'easy' ? '#e8f5e9' : q.difficulty === 'hard' ? '#f5e6ea' : '#fff3e0', color: q.difficulty === 'easy' ? '#2E7D32' : q.difficulty === 'hard' ? '#BF0A30' : '#E65100', padding: '2px 8px', borderRadius: 100, fontWeight: 600, textTransform: 'capitalize' }}>{q.difficulty}</span>
                        <span style={{ color: '#2E7D32', fontWeight: 600 }}>✓ {LETTERS[q.correct_answer_index]}: {q.options[q.correct_answer_index]}</span>
                      </div>
                    </div>
                    <div style={s.qActions}>
                      <button
                        style={{ ...s.toggleBtn, background: q.is_active ? '#e8f5e9' : '#f1f3f7', color: q.is_active ? '#2E7D32' : '#8892a4' }}
                        onClick={() => toggleActive(q.id, q.is_active)}
                      >
                        {q.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button style={s.editBtn} onClick={() => editQuestion(q)}>Edit</button>
                      <button style={s.delBtn} onClick={() => setDeleteId(q.id)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'add-question' && (
          <div>
            <div style={s.sectionTitle}>{editingId ? 'Edit Question' : 'Add New Question'}</div>
            <div style={s.sectionSub}>{editingId ? 'Update the question details below' : 'Fill in all fields to add a question to the bank'}</div>

            <form onSubmit={saveQuestion}>
              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#002868', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Question Details</div>
                <div style={s.row}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Subject *</label>
                    <select style={s.select} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                      {SUBJECTS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Topic</label>
                    <input style={s.input} placeholder="e.g. Algebra, Photosynthesis..." value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
                  </div>
                </div>
                <div style={s.row}>
                  <div style={s.formGroup}>
                    <label style={s.label}>WAEC Year</label>
                    <input style={s.input} type="number" min="2000" max="2030" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Difficulty</label>
                    <select style={s.select} value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#002868', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Question</div>
                <div style={s.formGroup}>
                  <label style={s.label}>Question Text *</label>
                  <textarea style={s.textarea} placeholder="Type the full question here..." value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} />
                </div>
              </div>

              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#002868', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Answer Options</div>
                <div style={s.row}>
                  {['a', 'b', 'c', 'd'].map((letter, i) => (
                    <div key={letter} style={s.formGroup}>
                      <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: parseInt(form.correct_answer_index) === i ? '#002868' : '#e6eaf5', color: parseInt(form.correct_answer_index) === i ? 'white' : '#002868', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {letter.toUpperCase()}
                        </span>
                        Option {letter.toUpperCase()} {parseInt(form.correct_answer_index) === i && <span style={{ color: '#2E7D32', fontSize: 11 }}>✓ Correct</span>}
                      </label>
                      <input
                        style={{ ...s.input, borderColor: parseInt(form.correct_answer_index) === i ? '#2E7D32' : '#e2e6ee' }}
                        placeholder={`Option ${letter.toUpperCase()}...`}
                        value={form[`option_${letter}`]}
                        onChange={e => setForm({ ...form, [`option_${letter}`]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Correct Answer *</label>
                  <select style={s.select} value={form.correct_answer_index} onChange={e => setForm({ ...form, correct_answer_index: e.target.value })}>
                    <option value={0}>A — {form.option_a || 'Option A'}</option>
                    <option value={1}>B — {form.option_b || 'Option B'}</option>
                    <option value={2}>C — {form.option_c || 'Option C'}</option>
                    <option value={3}>D — {form.option_d || 'Option D'}</option>
                  </select>
                </div>
              </div>

              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#002868', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Explanation</div>
                <div style={s.formGroup}>
                  <label style={s.label}>Why is this the correct answer? *</label>
                  <textarea style={{ ...s.textarea, minHeight: 100 }} placeholder="Explain why the correct answer is right. Students will see this after answering." value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" style={s.btnPrimary} disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Question' : 'Add Question'}
                </button>
                <button type="button" style={s.btnOutline} onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setTab('questions') }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === 'past-papers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={s.sectionTitle}>Past Papers</div>
                <div style={s.sectionSub}>{papers.length} papers in the archive</div>
              </div>
              <button style={s.btnPrimary} onClick={() => { setTab('add-paper'); setEditingPaperId(null); setPaperForm(EMPTY_PAPER) }}>
                + Upload Paper
              </button>
            </div>

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e6ee', overflow: 'hidden' }}>
              {papers.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#8892a4' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
                  <div>No past papers uploaded yet. Click "Upload Paper" to add the first one.</div>
                </div>
              ) : (
                papers.map((p, i) => (
                  <div key={p.id} style={{ ...s.qRow, background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                    <div style={{ fontSize: 22, flexShrink: 0 }}>📄</div>
                    <div style={s.qText}>
                      <div style={s.qTitle}>{p.title || `${p.subject} ${p.year} — Paper ${p.paper_number}`}</div>
                      <div style={s.qMeta}>
                        <span style={{ background: '#e6eaf5', color: '#002868', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>{p.subject}</span>
                        <span>📅 {p.year}</span>
                        <span>Paper {p.paper_number}</span>
                        {p.region_tag && <span>🌍 {p.region_tag}</span>}
                      </div>
                    </div>
                    <div style={s.qActions}>
                      <button
                        style={{ ...s.toggleBtn, background: p.visibility === 'published' ? '#e8f5e9' : '#f1f3f7', color: p.visibility === 'published' ? '#2E7D32' : '#8892a4' }}
                        onClick={() => togglePaperVisibility(p.id, p.visibility)}
                      >
                        {p.visibility === 'published' ? 'Published' : 'Draft'}
                      </button>
                      <button style={s.editBtn} onClick={() => {
                        setPaperForm({ ...p, file_url: p.file_url || '', mark_scheme_url: p.mark_scheme_url || '' })
                        setEditingPaperId(p.id)
                        setTab('add-paper')
                      }}>Edit</button>
                      <button style={s.delBtn} onClick={() => deletePaper(p.id)}>Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'add-paper' && (
          <div>
            <div style={s.sectionTitle}>{editingPaperId ? 'Edit Past Paper' : 'Upload Past Paper'}</div>
            <div style={s.sectionSub}>Add a past WASSCE paper to the archive for students to download</div>

            <form onSubmit={savePaper}>
              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#002868', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Paper Details</div>
                <div style={s.row}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Subject *</label>
                    <select style={s.select} value={paperForm.subject} onChange={e => setPaperForm({ ...paperForm, subject: e.target.value })}>
                      {SUBJECTS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Year *</label>
                    <select style={s.select} value={paperForm.year} onChange={e => setPaperForm({ ...paperForm, year: e.target.value })}>
                      {Array.from({ length: 15 }, (_, i) => 2024 - i).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div style={s.row}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Paper Number *</label>
                    <select style={s.select} value={paperForm.paper_number} onChange={e => setPaperForm({ ...paperForm, paper_number: e.target.value })}>
                      <option value={1}>Paper 1 — Objective (MCQ)</option>
                      <option value={2}>Paper 2 — Theory/Essay</option>
                      <option value={3}>Paper 3 — Practical</option>
                    </select>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Region/Country Tag</label>
                    <select style={s.select} value={paperForm.region_tag} onChange={e => setPaperForm({ ...paperForm, region_tag: e.target.value })}>
                      <option>Liberia</option>
                      <option>Ghana</option>
                      <option>Nigeria</option>
                      <option>Sierra Leone</option>
                      <option>General WAEC</option>
                    </select>
                  </div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Title / Description (optional — auto-generated if blank)</label>
                  <input style={s.input} placeholder={`e.g. WASSCE ${paperForm.year} ${paperForm.subject} Paper ${paperForm.paper_number} — Liberia`} value={paperForm.title} onChange={e => setPaperForm({ ...paperForm, title: e.target.value })} />
                </div>
              </div>

              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#002868', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>File Links</div>
                <div style={s.formGroup}>
                  <label style={s.label}>PDF File URL *</label>
                  <input style={s.input} placeholder="https://storage.supabase.co/... or cloud storage URL" value={paperForm.file_url} onChange={e => setPaperForm({ ...paperForm, file_url: e.target.value })} />
                  <div style={{ fontSize: 12, color: '#8892a4', marginTop: 4 }}>Upload the PDF to Supabase Storage or cloud storage and paste the URL here</div>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Mark Scheme URL (optional)</label>
                  <input style={s.input} placeholder="URL to mark scheme PDF..." value={paperForm.mark_scheme_url} onChange={e => setPaperForm({ ...paperForm, mark_scheme_url: e.target.value })} />
                </div>
              </div>

              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#002868', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Visibility</div>
                <div style={s.formGroup}>
                  <label style={s.label}>Status</label>
                  <select style={s.select} value={paperForm.visibility} onChange={e => setPaperForm({ ...paperForm, visibility: e.target.value })}>
                    <option value="draft">Draft — Admin only, hidden from students</option>
                    <option value="published">Published — Visible to all students</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" style={s.btnPrimary} disabled={saving}>
                  {saving ? 'Saving...' : editingPaperId ? 'Update Paper' : 'Upload Paper'}
                </button>
                <button type="button" style={s.btnOutline} onClick={() => { setPaperForm(EMPTY_PAPER); setEditingPaperId(null); setTab('past-papers') }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── ADD ESSAY QUESTION TAB ── */}
        {tab === 'add-essay-question' && (
          <div>
            <div style={s.sectionTitle}>{editingEssayId ? 'Edit Essay/Structured Question' : 'Add Essay / Structured / Practical Question'}</div>
            <div style={s.sectionSub}>These questions appear in Paper 2 (Theory/Essay) and Paper 3 (Practical). AI will mark student answers in mock mode.</div>

            <form onSubmit={saveEssayQuestion}>
              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#002868', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Question Details</div>
                <div style={s.row}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Subject *</label>
                    <select style={s.select} value={essayForm.subject} onChange={e => setEssayForm({ ...essayForm, subject: e.target.value })}>
                      {SUBJECTS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Paper Number *</label>
                    <select style={s.select} value={essayForm.paper_number} onChange={e => setEssayForm({ ...essayForm, paper_number: e.target.value })}>
                      <option value={2}>Paper 2 — Theory/Essay</option>
                      <option value={3}>Paper 3 — Practical</option>
                    </select>
                  </div>
                </div>
                <div style={s.row}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Question Type *</label>
                    <select style={s.select} value={essayForm.question_type} onChange={e => setEssayForm({ ...essayForm, question_type: e.target.value })}>
                      <option value="essay">Essay (long answer, 200–400 words)</option>
                      <option value="structured">Structured (short answer, 1–3 sentences)</option>
                      <option value="practical">Practical (lab/map/specimen analysis)</option>
                    </select>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Section (A, B, C...)</label>
                    <input style={s.input} placeholder="e.g. A, B, C" value={essayForm.section} onChange={e => setEssayForm({ ...essayForm, section: e.target.value })} />
                  </div>
                </div>
                <div style={s.row}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Topic</label>
                    <input style={s.input} placeholder="e.g. Osmosis, Linear Programming..." value={essayForm.topic} onChange={e => setEssayForm({ ...essayForm, topic: e.target.value })} />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>WAEC Year</label>
                    <input style={s.input} type="number" min="2000" max="2030" value={essayForm.year} onChange={e => setEssayForm({ ...essayForm, year: e.target.value })} />
                  </div>
                </div>
                <div style={s.row}>
                  <div style={s.formGroup}>
                    <label style={s.label}>Marks Available *</label>
                    <input style={s.input} type="number" min="1" max="50" value={essayForm.marks} onChange={e => setEssayForm({ ...essayForm, marks: e.target.value })} />
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Difficulty</label>
                    <select style={s.select} value={essayForm.difficulty} onChange={e => setEssayForm({ ...essayForm, difficulty: e.target.value })}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#002868', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Question Text</div>
                <div style={s.formGroup}>
                  <label style={s.label}>Full Question Text *</label>
                  <textarea style={{ ...s.textarea, minHeight: 120 }} placeholder="Write the complete exam question here, exactly as it would appear on the paper..." value={essayForm.question_text} onChange={e => setEssayForm({ ...essayForm, question_text: e.target.value })} />
                </div>
              </div>

              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#002868', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Mark Scheme *</div>
                <div style={{ fontSize: 12, color: '#8892a4', marginBottom: 12 }}>
                  This is the official marking criteria sent to Claude AI when marking student answers. Include: expected key points, acceptable alternatives, subject-specific rules (e.g. "must include units for Physics answers").
                </div>
                <div style={s.formGroup}>
                  <textarea style={{ ...s.textarea, minHeight: 160 }} placeholder="Award 1 mark for each of the following points (max 5 marks):\n1. ...\n2. ...\nNotes: Accept alternative wording. For Physics: MUST include correct unit for final answer." value={essayForm.mark_scheme} onChange={e => setEssayForm({ ...essayForm, mark_scheme: e.target.value })} />
                </div>
              </div>

              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#002868', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Model Answer (Optional)</div>
                <div style={{ fontSize: 12, color: '#8892a4', marginBottom: 12 }}>
                  A fully correct sample response. Shown side-by-side with the student's answer on the results screen, and provided to Claude AI to improve marking accuracy.
                </div>
                <div style={s.formGroup}>
                  <textarea style={{ ...s.textarea, minHeight: 120 }} placeholder="A model answer students can compare against their own response after the exam..." value={essayForm.model_answer} onChange={e => setEssayForm({ ...essayForm, model_answer: e.target.value })} />
                </div>
              </div>

              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#002868', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Keyword Auto-Scoring (Optional)</div>
                <div style={{ fontSize: 12, color: '#8892a4', marginBottom: 12 }}>
                  For structured short-answer questions (1–3 marks): enter required keywords/phrases separated by commas. The system checks these automatically before calling AI, providing instant feedback. Example: <em>osmosis, semi-permeable, concentration gradient</em>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Required Keywords (comma-separated)</label>
                  <input style={s.input} placeholder="e.g. osmosis, concentration gradient, semi-permeable membrane" value={essayForm.keywords} onChange={e => setEssayForm({ ...essayForm, keywords: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" style={s.btnPrimary} disabled={saving}>
                  {saving ? 'Saving...' : editingEssayId ? 'Update Question' : 'Add Essay Question'}
                </button>
                <button type="button" style={s.btnOutline} onClick={() => { setEssayForm(EMPTY_ESSAY_FORM); setEditingEssayId(null); setTab('questions') }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── MANUAL MARKING TAB ── */}
        {tab === 'marking' && (
          <div>
            <div style={s.sectionTitle}>Manual Essay Marking</div>
            <div style={s.sectionSub}>
              Review and mark essay answers where AI marking failed, is pending, or requires teacher review.
              Teachers can override or confirm AI marks here.
            </div>

            {markingEssay && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ fontWeight: 700, color: '#002868', fontSize: 16, marginBottom: 8 }}>Manual Marking</div>
                  <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 4 }}>
                    <strong>Subject:</strong> {markingEssay.subject} | <strong>Paper:</strong> {markingEssay.paper_number} | <strong>Max marks:</strong> {markingEssay.max_marks}
                  </div>
                  <div style={{ background: '#e6eaf5', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#002868' }}>
                    <strong>Question:</strong> {markingEssay.question_id || 'N/A'}
                  </div>
                  <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    <strong>Student Answer:</strong><br />{markingEssay.answer_text}
                  </div>
                  {markingEssay.feedback && (
                    <div style={{ background: '#fff3cd', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#856404' }}>
                      <strong>AI Feedback (if any):</strong> {markingEssay.feedback}
                    </div>
                  )}
                  <div style={s.row}>
                    <div style={s.formGroup}>
                      <label style={s.label}>Marks Awarded (0 to {markingEssay.max_marks}) *</label>
                      <input style={s.input} type="number" min="0" max={markingEssay.max_marks} value={manualMarks} onChange={e => setManualMarks(e.target.value)} />
                    </div>
                  </div>
                  <div style={s.formGroup}>
                    <label style={s.label}>Feedback for Student</label>
                    <textarea style={{ ...s.textarea, minHeight: 80 }} placeholder="Constructive feedback for the student..." value={manualFeedback} onChange={e => setManualFeedback(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <button style={s.btnPrimary} onClick={saveManualMark} disabled={markSaving}>{markSaving ? 'Saving...' : 'Save Mark'}</button>
                    <button style={s.btnOutline} onClick={() => { setMarkingEssay(null); setManualMarks(''); setManualFeedback('') }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {pendingEssays.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#8892a4' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div>No essays pending manual review at this time.</div>
              </div>
            ) : (
              pendingEssays.map((essay, i) => (
                <div key={essay.id} style={{ ...s.card, marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ background: '#e6eaf5', color: '#002868', padding: '2px 8px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>{essay.subject}</span>
                      <span style={{ background: '#fff3cd', color: '#856404', padding: '2px 8px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>Paper {essay.paper_number}</span>
                      <span style={{ background: essay.ai_status === 'failed' ? '#f5e6ea' : '#e8f5e9', color: essay.ai_status === 'failed' ? '#BF0A30' : '#2E7D32', padding: '2px 8px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>
                        {essay.ai_status === 'failed' ? '⚠️ AI Failed' : essay.ai_status === 'manual_review' ? '🖊️ Needs Review' : '⏳ Pending'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 4 }}>
                      <strong>Student:</strong> {essay.profiles?.full_name || essay.user_id?.slice(0,8) + '...'} • <strong>Submitted:</strong> {new Date(essay.created_at).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 13, color: '#1a202c', lineHeight: 1.5, maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {essay.answer_text?.slice(0, 200)}...
                    </div>
                    {essay.marks_awarded != null && (
                      <div style={{ fontSize: 13, color: '#002868', fontWeight: 600, marginTop: 4 }}>
                        Current marks: {essay.marks_awarded}/{essay.max_marks}
                      </div>
                    )}
                  </div>
                  <button style={s.btnPrimary} onClick={() => { setMarkingEssay(essay); setManualMarks(essay.marks_awarded ?? ''); setManualFeedback(essay.feedback || '') }}>
                    {essay.marks_awarded != null ? 'Review / Override' : 'Mark'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── STUDENT MANAGEMENT TAB ── */}
        {tab === 'students' && (
          <div>
            <div style={s.sectionTitle}>Student Management</div>
            <div style={s.sectionSub}>
              Search for students to view their progress, reset mock exam attempts, or reset AI Tutor limits.
              All resets are logged with your name and reason for auditability.
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <input style={{ ...s.input, flex: 1 }} placeholder="Search by name..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
            </div>

            {!selectedStudent ? (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e6ee', overflow: 'hidden' }}>
                {students.filter(st => !studentSearch || (st.full_name || '').toLowerCase().includes(studentSearch.toLowerCase())).slice(0, 30).map((st, i) => (
                  <div key={st.id} style={{ ...s.qRow, background: i % 2 === 0 ? 'white' : '#fafbfc', cursor: 'pointer' }} onClick={() => { setSelectedStudent(st); fetchStudentDetails(st.id) }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#002868', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {(st.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div style={s.qText}>
                      <div style={s.qTitle}>{st.full_name || '(No name)'}</div>
                      <div style={s.qMeta}>
                        <span>{st.county || 'Unknown county'}</span>
                        <span>Joined {new Date(st.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ color: '#002868', fontSize: 13 }}>View →</div>
                  </div>
                ))}
                {students.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#8892a4' }}>No students registered yet.</div>}
              </div>
            ) : (
              <div>
                <button style={{ ...s.btnOutline, marginBottom: 16 }} onClick={() => { setSelectedStudent(null); setStudentMockAttempts([]); setStudentAIUsage([]) }}>← Back to Student List</button>

                <div style={{ ...s.card, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#002868', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                      {(selectedStudent.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1a202c', fontSize: 16 }}>{selectedStudent.full_name || '(No name)'}</div>
                      <div style={{ fontSize: 13, color: '#8892a4' }}>{selectedStudent.county} • ID: {selectedStudent.id?.slice(0,8)}...</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={s.label}>Reason for Reset (required for all reset actions)</label>
                    <input style={s.input} placeholder="e.g. Technical error during exam, student lost connection..." value={resetReason} onChange={e => setResetReason(e.target.value)} />
                  </div>
                </div>

                <div style={s.card}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#002868', marginBottom: 12 }}>Mock Exam Attempts Today</div>
                  {studentMockAttempts.length === 0 ? (
                    <div style={{ color: '#8892a4', fontSize: 14 }}>No mock exam attempts found.</div>
                  ) : (
                    studentMockAttempts.filter(a => {
                      const today = new Date().toISOString().split('T')[0]
                      return a.started_at?.startsWith(today) && !a.reset_by_admin
                    }).map(attempt => (
                      <div key={attempt.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f3f7' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#1a202c' }}>{attempt.subject}</div>
                          <div style={{ fontSize: 12, color: '#8892a4' }}>
                            Started: {new Date(attempt.started_at).toLocaleTimeString()} • Status: {attempt.status}
                          </div>
                        </div>
                        <button
                          style={{ ...s.btnRed, padding: '6px 12px', fontSize: 12 }}
                          onClick={() => resetMockAttempt(attempt.id)}
                          disabled={resetLoading || !resetReason.trim()}
                        >
                          Reset Attempt
                        </button>
                      </div>
                    ))
                  )}
                  {studentMockAttempts.filter(a => {
                    const today = new Date().toISOString().split('T')[0]
                    return a.started_at?.startsWith(today) && !a.reset_by_admin
                  }).length === 0 && (
                    <div style={{ color: '#8892a4', fontSize: 14 }}>No active mock attempts for today to reset.</div>
                  )}
                </div>

                <div style={{ ...s.card, marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#002868' }}>
                      AI Tutor Usage (last 8 hours: {studentAIUsage.filter(u => new Date(u.created_at) > new Date(Date.now() - 8 * 60 * 60 * 1000)).length}/10)
                    </div>
                    <button
                      style={{ ...s.btnRed, padding: '6px 12px', fontSize: 12 }}
                      onClick={() => resetAITutorLimit(selectedStudent.id)}
                      disabled={resetLoading || !resetReason.trim()}
                    >
                      Reset AI Tutor Limit
                    </button>
                  </div>
                  {studentAIUsage.slice(0, 10).map((u, i) => (
                    <div key={u.id} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < 9 ? '1px solid #f1f3f7' : 'none', fontSize: 13 }}>
                      <span style={{ color: '#8892a4', flexShrink: 0 }}>{new Date(u.created_at).toLocaleTimeString()}</span>
                      <span style={{ background: '#e6eaf5', color: '#002868', padding: '1px 6px', borderRadius: 100, fontSize: 11, fontWeight: 600 }}>{u.subject}</span>
                      <span style={{ color: '#4a5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.question_text?.slice(0, 80)}</span>
                    </div>
                  ))}
                  {studentAIUsage.length === 0 && <div style={{ color: '#8892a4', fontSize: 14 }}>No AI Tutor usage recorded.</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'stats' && stats && (
          <div>
            <div style={s.sectionTitle}>Platform Stats</div>
            <div style={s.sectionSub}>Overview of your WASSCEPrep platform</div>

            <div style={s.statGrid}>
              <div style={s.statCard}>
                <div style={{ ...s.statVal, color: '#002868' }}>{stats.totalQuestions}</div>
                <div style={s.statLbl}>Total Questions</div>
              </div>
              <div style={s.statCard}>
                <div style={{ ...s.statVal, color: '#BF0A30' }}>{stats.totalUsers}</div>
                <div style={s.statLbl}>Registered Users</div>
              </div>
              <div style={s.statCard}>
                <div style={{ ...s.statVal, color: '#2E7D32' }}>{stats.totalSessions}</div>
                <div style={s.statLbl}>Quiz Sessions</div>
              </div>
              <div style={s.statCard}>
                <div style={{ ...s.statVal, color: '#C9A84C' }}>{stats.avgScore}%</div>
                <div style={s.statLbl}>Avg Score</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={s.card}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#002868', marginBottom: 16 }}>Questions by Subject</div>
                {SUBJECTS.map(subj => {
                  const count = stats.bySubject[subj.name] || 0
                  const max = Math.max(...Object.values(stats.bySubject), 1)
                  return (
                    <div key={subj.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                        <span style={{ color: '#4a5568' }}>{subj.icon} {subj.name}</span>
                        <span style={{ fontWeight: 700, color: '#002868' }}>{count}</span>
                      </div>
                      <div style={{ height: 6, background: '#e2e6ee', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: subj.color, borderRadius: 100, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={s.card}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#002868', marginBottom: 16 }}>Recent Registrations</div>
                {stats.recentUsers.length === 0 ? (
                  <div style={{ color: '#8892a4', fontSize: 14 }}>No users yet</div>
                ) : (
                  stats.recentUsers.map((u, i) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < stats.recentUsers.length - 1 ? '1px solid #f1f3f7' : 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#002868', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {(u.full_name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a202c' }}>{u.full_name || 'Unknown'}</div>
                        <div style={{ fontSize: 12, color: '#8892a4' }}>{u.county} • {new Date(u.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
