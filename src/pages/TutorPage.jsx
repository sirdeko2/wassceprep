import { useState, useRef, useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/context/AuthContext'
import { SUBJECT_NAMES } from '@/data/subjects'

const SUGGESTIONS = [
  'Explain photosynthesis step by step',
  'What is opportunity cost?',
  'How do I solve a quadratic equation?',
  'Types of rocks in geography',
  'Explain Newton\'s three laws of motion',
  'What is the difference between a simile and a metaphor?',
]

export default function TutorPage() {
  const { user, profile } = useAuth()
  const [subject,  setSubject]  = useState('Mathematics')
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Hello! I am your Legacy Tutor. I can help you understand any WASSCE topic across all 8 subjects.\n\nSelect your subject above and ask me anything — whether it is a concept you find confusing, a past question explained, or a topic you need to revise. What would you like to learn today?'
  }])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  async function sendMessage(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

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
          messages: history.filter(m => m.role !== 'system'),
        })
      })

      const data = await res.json()
      const reply = data.content || 'I am sorry, I could not process that. Please try again.'
      setMessages([...history, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...history, { role: 'assistant', content: 'I am having trouble connecting right now. Please check your internet and try again.' }])
    }

    setLoading(false)
  }

  const initial = (profile?.full_name || user?.email || 'S')[0].toUpperCase()

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

        {/* Chat container */}
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
            placeholder="Ask a question about any WASSCE topic..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={loading}
          />
          <button className="chat-send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
            ➤
          </button>
        </div>

        <div className="tutor-suggestions">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className="suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

