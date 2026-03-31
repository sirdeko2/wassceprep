import { useState, useRef, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/context/AuthContext'
import { SUBJECTS } from '@/data/subjects'
import { supabase } from '@/lib/supabase'

const SUBJECT_NAMES = SUBJECTS.map(s => s.name)
const RATE_LIMIT = 10
const WINDOW_HOURS = 8

const SUGGESTIONS = [
  'Explain photosynthesis step by step',
  'What is opportunity cost?',
  'How do I solve a quadratic equation?',
  'What causes rainfall in West Africa?',
  "Explain Newton's three laws of motion",
  'What is the difference between a simile and a metaphor?',
]

export default function TutorPage() {
  const { user, profile } = useAuth()
  const [subject, setSubject]   = useState('Mathematics')
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Hello! I am your Legacy Tutor. I can help you understand any WASSCE topic across all 8 subjects.\n\nSelect your subject above and ask me anything — whether it is a concept you find confusing, a past question explained, or a topic you need to revise. What would you like to learn today?'
  }])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [usage, setUsage]       = useState({ count: 0, resetAt: null })
  const chatRef = useRef(null)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (user) checkUsage()
  }, [user])

  async function checkUsage() {
    const windowStart = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('ai_tutor_usage')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', windowStart)
      .order('created_at', { ascending: true })

    if (!data) return
    const count = data.length
    const resetAt = count > 0
      ? new Date(new Date(data[0].created_at).getTime() + WINDOW_HOURS * 60 * 60 * 1000)
      : null
    setUsage({ count, resetAt })
  }

  function formatResetTime(date) {
    if (!date) return ''
    const diff = date - Date.now()
    if (diff <= 0) return 'now'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const isLimited = usage.count >= RATE_LIMIT

  async function sendMessage(text) {
    const msg = text || input.trim()
    if (!msg || loading || isLimited) return
    setInput('')

    if (user) {
      const windowStart = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('ai_tutor_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', windowStart)

      if (count >= RATE_LIMIT) {
        await checkUsage()
        return
      }
      // Usage logging is handled server-side in chat.js after a successful API call
    }

    const userMsg = { role: 'user', content: msg }
    const history = [...messages, userMsg]
    setMessages(history)
    setLoading(true)

    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          userId: user?.id || null,
          messages: history.filter(m => m.role !== 'system'),
        })
      })
      const data = await res.json()
      // Handle server-side rate limit response
      if (res.status === 429) {
        await checkUsage()
        setMessages([...history, { role: 'assistant', content: data.message || 'Rate limit reached. Please try again later.' }])
        setLoading(false)
        return
      }
      const reply = data.content || 'I could not process that. Please try again.'
      setMessages([...history, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages([...history, { role: 'assistant', content: 'Network error: ' + err.message }])
    }

    setLoading(false)
    if (user) checkUsage()
  }

  const initial = (profile?.full_name || user?.email || 'S')[0].toUpperCase()
  const remaining = Math.max(0, RATE_LIMIT - usage.count)

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="tutor-layout">
        <div style={{ marginBottom: 8 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: 'var(--blue)', marginBottom: 4 }}>
            AI Tutor
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-400)' }}>
            Ask any WASSCE question and get a clear explanation instantly.
          </p>
        </div>

        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: isLimited ? 'var(--red-light)' : 'var(--blue-light)',
            border: `1px solid ${isLimited ? 'var(--red)' : 'var(--blue-mid)'}`,
            borderRadius: 10, padding: '10px 16px', marginBottom: 12, flexWrap: 'wrap', gap: 8
          }}>
            <span style={{ fontSize: 13, color: isLimited ? 'var(--red)' : 'var(--blue)', fontWeight: 600 }}>
              {isLimited
                ? `⛔ Limit reached — ${RATE_LIMIT} questions used. Resets in ${formatResetTime(usage.resetAt)}`
                : `💬 ${remaining} of ${RATE_LIMIT} questions remaining${usage.resetAt ? ` — resets in ${formatResetTime(usage.resetAt)}` : ''}`}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: RATE_LIMIT }).map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: i < usage.count ? (isLimited ? 'var(--red)' : 'var(--blue)') : 'var(--gray-200)'
                }} />
              ))}
            </div>
          </div>
        )}

        <div className="tutor-header">
          <div className="tutor-avatar">🎓</div>
          <div>
            <div className="tutor-name">Legacy Tutor</div>
            <div className="tutor-status">Powered by AI • Ready to help</div>
          </div>
          <div className="tutor-subject-select" style={{ marginLeft: 'auto' }}>
            <select value={subject} onChange={e => setSubject(e.target.value)}>
              {SUBJECT_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="chat-window" ref={chatRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role === 'user' ? 'user' : 'bot'}`}>
              <div className={`chat-msg-avatar ${m.role === 'user' ? 'user-avatar-chat' : 'bot-avatar'}`}>
                {m.role === 'user' ? initial : '🎓'}
              </div>
              <div className="chat-bubble">
                {m.content.split('\n').map((line, j) => (
                  <span key={j}>{line}{j < m.content.split('\n').length - 1 && <br />}</span>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-msg bot">
              <div className="chat-msg-avatar bot-avatar">🎓</div>
              <div className="chat-bubble">
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder={isLimited ? 'Daily limit reached. Come back later.' : 'Ask a question about any WASSCE topic...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={loading || isLimited}
          />
          <button className="chat-send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim() || isLimited}>
            ➤
          </button>
        </div>

        {!isLimited && (
          <div className="tutor-suggestions">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
