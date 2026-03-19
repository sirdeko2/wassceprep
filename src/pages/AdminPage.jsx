import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { SUBJECTS } from '@/data/subjects'

// ── Your admin email — only this email can access the panel ──
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

export default function AdminPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [tab,         setTab]         = useState('questions') // questions | add | stats
  const [questions,   setQuestions]   = useState([])
  const [stats,       setStats]       = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [editingId,   setEditingId]   = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [toast,       setToast]       = useState('')
  const [search,      setSearch]      = useState('')
  const [filterSubj,  setFilterSubj]  = useState('All')
  const [deleteId,    setDeleteId]    = useState(null)

  // ── Auth guard ──
  useEffect(() => {
    if (!user) return
    if (user.email !== ADMIN_EMAIL) { navigate('/dashboard'); return }
    fetchQuestions()
    fetchStats()
  }, [user])

  // ── Fetch all questions ──
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

  // ── Fetch stats ──
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

  // ── Save question (add or edit) ──
  async function saveQuestion(e) {
    e.preventDefault()
    if (!form.question_text || !form.option_a || !form.option_b || !form.option_c || !form.option_d || !form.explanation) {
      showToast('Please fill in all fields')
      return
    }
    setSaving(true)
    const payload = {
      subject:              form.subject,
      topic:                form.topic,
      year:                 parseInt(form.year),
      question_text:        form.question_text,
      options:              [form.option_a, form.option_b, form.option_c, form.option_d],
      correct_answer_index: parseInt(form.correct_answer_index),
      explanation:          form.explanation,
      difficulty:           form.difficulty,
      is_active:            true,
    }

    let error
    if (editingId) {
      const res = await supabase.from('questions').update(payload).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('questions').insert(payload)
      error = res.error
    }

    setSaving(false)
    if (error) { showToast('Error: ' + error.message); return }
    showToast(editingId ? 'Question updated!' : 'Question added!')
    setForm(EMPTY_FORM)
    setEditingId(null)
    setTab('questions')
    fetchQuestions()
    fetchStats()
  }

  // ── Edit question ──
  function editQuestion(q) {
    setForm({
      subject:              q.subject,
      topic:                q.topic || '',
      year:                 q.year || new Date().getFullYear(),
      question_text:        q.question_text,
      option_a:             q.options[0] || '',
      option_b:             q.options[1] || '',
      option_c:             q.options[2] || '',
      option_d:             q.options[3] || '',
      correct_answer_index: q.correct_answer_index,
      explanation:          q.explanation || '',
      difficulty:           q.difficulty || 'medium',
    })
    setEditingId(q.id)
    setTab('add')
    window.scrollTo(0, 0)
  }

  // ── Delete question ──
  async function deleteQuestion(id) {
    const { error } = await supabase.from('questions').delete().eq('id', id)
    if (error) { showToast('Error deleting: ' + error.message); return }
    showToast('Question deleted')
    setDeleteId(null)
    fetchQuestions()
    fetchStats()
  }

  // ── Toggle active/inactive ──
  async function toggleActive(id, current) {
    await supabase.from('questions').update({ is_active: !current }).eq('id', id)
    fetchQuestions()
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── Filtered questions ──
  const filtered = questions.filter(q => {
    const matchSubject = filterSubj === 'All' || q.subject === filterSubj
    const matchSearch  = !search ||
      q.question_text.toLowerCase().includes(search.toLowerCase()) ||
      q.topic?.toLowerCase().includes(search.toLowerCase())
    return matchSubject && matchSearch
  })

  const LETTERS = ['A', 'B', 'C', 'D']

  // ── Styles ──
  const s = {
    page:       { minHeight: '100vh', background: '#f1f3f7', fontFamily: "'DM Sans', sans-serif" },
    header:     { background: '#002868', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' },
    headerLogo: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: 'white', letterSpacing: 2 },
    headerRight:{ display: 'flex', alignItems: 'center', gap: 12 },
    adminBadge: { background: '#BF0A30', color: 'white', padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' },
    backBtn:    { background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif" },
    body:       { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' },
    tabs:       { display: 'flex', gap: 4, background: 'white', padding: 6, borderRadius: 12, marginBottom: 28, border: '1px solid #e2e6ee', width: 'fit-content' },
    tab:        { padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' },
    tabActive:  { background: '#002868', color: 'white' },
    tabInactive:{ background: 'transparent', color: '#4a5568' },
    card:       { background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e6ee', marginBottom: 20 },
    label:      { fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6, display: 'block' },
    input:      { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e6ee', borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#f8f9fc', boxSizing: 'border-box' },
    textarea:   { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e6ee', borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#f8f9fc', minHeight: 80, resize: 'vertical', boxSizing: 'border-box' },
    select:     { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e6ee', borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: '#f8f9fc', cursor: 'pointer' },
    row:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
    row3:       { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 },
    formGroup:  { marginBottom: 16 },
    btnPrimary: { background: '#002868', color: 'white', padding: '11px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif' " },
    btnRed:     { background: '#BF0A30', color: 'white', padding: '11px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif'" },
    btnOutline: { background: 'white', color: '#4a5568', padding: '11px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, border: '2px solid #e2e6ee', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif'" },
    statGrid:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
    statCard:   { background: 'white', borderRadius: 12, padding: 20, border: '1px solid #e2e6ee', textAlign: 'center' },
    statVal:    { fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, lineHeight: 1, marginBottom: 4 },
    statLbl:    { fontSize: 11, color: '#8892a4', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 },
    qRow:       { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', borderBottom: '1px solid #f1f3f7', transition: 'background 0.15s' },
    qNum:       { width: 28, height: 28, borderRadius: 8, background: '#e6eaf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#002868', flexShrink: 0, marginTop: 2 },
    qText:      { flex: 1 },
    qTitle:     { fontSize: 14, fontWeight: 600, color: '#1a202c', marginBottom: 4, lineHeight: 1.4 },
    qMeta:      { fontSize: 12, color: '#8892a4', display: 'flex', gap: 12, flexWrap: 'wrap' },
    qActions:   { display: 'flex', gap: 8, flexShrink: 0 },
    editBtn:    { background: '#e6eaf5', color: '#002868', border: 'none', padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    delBtn:     { background: '#f5e6ea', color: '#BF0A30', border: 'none', padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    toggleBtn:  { border: 'none', padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    sectionTitle:{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: '#002868', marginBottom: 6 },
    sectionSub: { fontSize: 14, color: '#8892a4', marginBottom: 24 },
    toast:      { position: 'fixed', bottom: 24, right: 24, background: '#1a202c', color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
    modal:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
    modalBox:   { background: 'white', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%', textAlign: 'center' },
  }

  if (!user) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
  if (user.email !== ADMIN_EMAIL) return null

  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Delete confirm modal */}
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

      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: '#BF0A30', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: 'white' }}>LT</div>
          <div style={s.headerLogo}>WASSCEPrep Admin</div>
          <div style={s.adminBadge}>Admin Panel</div>
        </div>
        <div style={s.headerRight}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{user.email}</span>
          <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Back to App</button>
        </div>
      </div>

      <div style={s.body}>
        {/* Tabs */}
        <div style={s.tabs}>
          {[
            { id: 'questions', label: '📋 All Questions' },
            { id: 'add',       label: editingId ? '✏️ Edit Question' : '➕ Add Question' },
            { id: 'stats',     label: '📊 Stats' },
          ].map(t => (
            <button
              key={t.id}
              style={{ ...s.tab, ...(tab === t.id ? s.tabActive : s.tabInactive) }}
              onClick={() => { setTab(t.id); if (t.id !== 'add') { setEditingId(null); setForm(EMPTY_FORM) } }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: ALL QUESTIONS ── */}
        {tab === 'questions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={s.sectionTitle}>Question Bank</div>
                <div style={s.sectionSub}>{questions.length} total questions across all subjects</div>
              </div>
              <button style={s.btnPrimary} onClick={() => { setTab('add'); setEditingId(null); setForm(EMPTY_FORM) }}>
                + Add New Question
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <input
                style={{ ...s.input, maxWidth: 280 }}
                placeholder="Search questions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select style={{ ...s.select, maxWidth: 200 }} value={filterSubj} onChange={e => setFilterSubj(e.target.value)}>
                <option value="All">All Subjects</option>
                {SUBJECTS.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            {/* Questions list */}
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
                        title={q.is_active ? 'Click to deactivate' : 'Click to activate'}
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

        {/* ── TAB: ADD / EDIT QUESTION ── */}
        {tab === 'add' && (
          <div>
            <div style={s.sectionTitle}>{editingId ? 'Edit Question' : 'Add New Question'}</div>
            <div style={s.sectionSub}>{editingId ? 'Update the question details below' : 'Fill in all fields to add a new question to the bank'}</div>

            <form onSubmit={saveQuestion}>
              {/* Subject, Topic, Year, Difficulty */}
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

              {/* Question text */}
              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#002868', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Question</div>
                <div style={s.formGroup}>
                  <label style={s.label}>Question Text *</label>
                  <textarea style={s.textarea} placeholder="Type the full question here..." value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} />
                </div>
              </div>

              {/* Options */}
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

              {/* Explanation */}
              <div style={s.card}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#002868', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Explanation</div>
                <div style={s.formGroup}>
                  <label style={s.label}>Why is this the correct answer? *</label>
                  <textarea style={{ ...s.textarea, minHeight: 100 }} placeholder="Explain clearly why the correct answer is right. Students will see this after answering." value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} />
                </div>
              </div>

              {/* Actions */}
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

        {/* ── TAB: STATS ── */}
        {tab === 'stats' && (
          <div>
            <div style={s.sectionTitle}>Platform Stats</div>
            <div style={s.sectionSub}>Overview of your WASSCEPrep platform</div>

            {stats && (
              <>
                {/* Top stats */}
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

                {/* Questions by subject */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={s.card}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#002868', marginBottom: 16 }}>Questions by Subject</div>
                    {SUBJECTS.map(subj => {
                      const count = stats.bySubject[subj.name] || 0
                      const max   = Math.max(...Object.values(stats.bySubject), 1)
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

                  {/* Recent users */}
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
