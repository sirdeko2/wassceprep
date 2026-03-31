import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

const PLAN_PRICE    = 5
const POLL_INTERVAL = 4000   // check every 4 seconds
const POLL_TIMEOUT  = 180000 // give up after 3 minutes

export default function PaymentPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [phone,      setPhone]      = useState('')
  const [step,       setStep]       = useState('form')   // form | waiting | success | failed | already_paid
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [refId,      setRefId]      = useState(null)
  const [paidUntil,  setPaidUntil]  = useState(null)
  const [subLoading, setSubLoading] = useState(true)
  const [timeLeft,   setTimeLeft]   = useState(POLL_TIMEOUT / 1000)

  const pollRef    = useRef(null)
  const timerRef   = useRef(null)
  const startedRef = useRef(false)

  // ── Load existing subscription ──────────────────────────────────────
  useEffect(() => {
    if (!user) return
    supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        setSubLoading(false)
        if (data?.plan === 'paid' && data?.status === 'active') {
          setPaidUntil(data.paid_until)
          setStep('already_paid')
        }
      })
  }, [user])

  // ── Cleanup polling on unmount ──────────────────────────────────────
  useEffect(() => () => {
    clearInterval(pollRef.current)
    clearInterval(timerRef.current)
  }, [])

  // ── Start polling once referenceId is set ──────────────────────────
  useEffect(() => {
    if (!refId || startedRef.current) return
    startedRef.current = true
    const deadline = Date.now() + POLL_TIMEOUT

    // Countdown timer display
    timerRef.current = setInterval(() => {
      const secs = Math.max(0, Math.round((deadline - Date.now()) / 1000))
      setTimeLeft(secs)
    }, 1000)

    // Payment status polling
    pollRef.current = setInterval(async () => {
      if (Date.now() > deadline) {
        clearInterval(pollRef.current)
        clearInterval(timerRef.current)
        setStep('failed')
        setError('Payment request timed out. Please try again.')
        return
      }
      try {
        const res  = await fetch('/.netlify/functions/payment', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ action: 'status', userId: user.id, referenceId: refId }),
        })
        const data = await res.json()
        if (data.status === 'SUCCESSFUL') {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          setPaidUntil(data.paidUntil)
          setStep('success')
        } else if (data.status === 'FAILED') {
          clearInterval(pollRef.current)
          clearInterval(timerRef.current)
          setStep('failed')
          setError('Payment was declined or failed. Please try again.')
        }
        // PENDING → keep polling
      } catch (err) {
        console.error('Poll error:', err)
      }
    }, POLL_INTERVAL)
  }, [refId])

  // ── Initiate payment ────────────────────────────────────────────────
  async function initiatePayment(e) {
    e.preventDefault()
    const cleanPhone = phone.trim()
    if (!cleanPhone) { setError('Please enter your Lonestar MTN mobile money number'); return }

    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/.netlify/functions/payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'initiate', userId: user.id, phoneNumber: cleanPhone }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to send payment request')
      setRefId(data.referenceId)
      setStep('waiting')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────
  const s = {
    page:       { minHeight: '100vh', background: 'var(--off-white)' },
    layout:     { maxWidth: 560, margin: '0 auto', padding: '48px 24px' },
    card:       { background: 'white', borderRadius: 20, padding: 36, border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-md)' },
    title:      { fontFamily: "'DM Serif Display', serif", fontSize: 28, color: 'var(--blue)', marginBottom: 8 },
    sub:        { fontSize: 14, color: 'var(--gray-400)', marginBottom: 28 },
    label:      { fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, display: 'block' },
    input:      { width: '100%', padding: '12px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 10, fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: 'var(--off-white)', boxSizing: 'border-box', marginBottom: 4 },
    btn:        { width: '100%', padding: 14, background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' },
    btnOutline: { width: '100%', marginTop: 10, padding: 12, background: 'transparent', border: '1.5px solid var(--gray-200)', borderRadius: 10, fontSize: 14, cursor: 'pointer', color: 'var(--gray-600)', fontFamily: "'DM Sans', sans-serif" },
    error:      { background: '#fff0f0', color: '#c0392b', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, borderLeft: '3px solid #c0392b' },
    planBox:    { background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-mid) 100%)', borderRadius: 14, padding: 24, marginBottom: 24, color: 'white' },
    featureRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 14, color: 'var(--gray-700)' },
  }

  if (!user || subLoading) return (
    <div style={s.page}><Navbar />
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>Loading...</div>
    </div>
  )

  // ── Already subscribed ──────────────────────────────────────────────
  if (step === 'already_paid') return (
    <div style={s.page}><Navbar />
      <div style={s.layout}>
        <div style={s.card}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
            <div style={{ ...s.title, textAlign: 'center' }}>You're on the Full Plan</div>
            {paidUntil && (
              <div style={{ color: 'var(--gray-400)', marginBottom: 12 }}>
                Active until {new Date(paidUntil).toLocaleDateString('en-LR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
            <div style={{ display: 'inline-block', background: 'var(--gold)', color: 'var(--blue)', padding: '6px 18px', borderRadius: 100, fontWeight: 700, fontSize: 13, marginBottom: 24 }}>
              ⭐ PAID MEMBER
            </div>
            <div>
              <button style={{ ...s.btn, maxWidth: 200, margin: '0 auto', display: 'block' }} onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // ── Waiting for phone approval ──────────────────────────────────────
  if (step === 'waiting') return (
    <div style={s.page}><Navbar />
      <div style={s.layout}>
        <div style={{ ...s.card, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📱</div>
          <div style={{ ...s.title, textAlign: 'center' }}>Check your phone</div>
          <p style={{ color: 'var(--gray-600)', fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
            A payment request for <strong>${PLAN_PRICE}</strong> has been sent to your Lonestar MTN number.
            <br /><strong>Open the prompt on your phone and approve it to continue.</strong>
          </p>

          {/* Animated pulse to signal waiting */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%', background: 'var(--blue)',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
          <style>{`@keyframes pulse { 0%,80%,100%{opacity:.2;transform:scale(0.8)} 40%{opacity:1;transform:scale(1.2)} }`}</style>

          <div style={{ background: '#f0f4ff', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--blue)', marginBottom: 24 }}>
            ⏳ Waiting for approval — {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')} remaining
          </div>

          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 16 }}>
            If you don't see the prompt, dial <strong>*165#</strong> on your MTN phone to find pending approvals.
          </div>

          <button style={s.btnOutline} onClick={() => { clearInterval(pollRef.current); clearInterval(timerRef.current); startedRef.current = false; setRefId(null); setStep('form') }}>
            ← Cancel and go back
          </button>
        </div>
      </div>
    </div>
  )

  // ── Success ─────────────────────────────────────────────────────────
  if (step === 'success') return (
    <div style={s.page}><Navbar />
      <div style={s.layout}>
        <div style={s.card}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ ...s.title, textAlign: 'center' }}>Payment Confirmed!</h2>
            <p style={{ fontSize: 15, color: 'var(--gray-600)', marginBottom: 8, lineHeight: 1.6 }}>
              Your account now has <strong>Full Access</strong> for 31 days — unlimited practice,
              mock exams, AI marking, and more.
            </p>
            {paidUntil && (
              <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 28 }}>
                Access expires: {new Date(paidUntil).toLocaleDateString('en-LR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            <button style={{ ...s.btn, maxWidth: 240, margin: '0 auto', display: 'block' }} onClick={() => navigate('/dashboard')}>
              Start Studying →
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── Failed ──────────────────────────────────────────────────────────
  if (step === 'failed') return (
    <div style={s.page}><Navbar />
      <div style={s.layout}>
        <div style={{ ...s.card, textAlign: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>❌</div>
          <div style={{ ...s.title, textAlign: 'center' }}>Payment Not Completed</div>
          <p style={{ color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            {error || 'The payment was not approved. Please make sure your MTN Mobile Money account has sufficient balance and try again.'}
          </p>
          <button style={s.btn} onClick={() => { setStep('form'); setError(''); startedRef.current = false; setRefId(null) }}>
            Try Again
          </button>
          <button style={s.btnOutline} onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )

  // ── Payment form ────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.layout}>
        <div style={s.card}>

          <div style={s.planBox}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>Full Access Plan</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: 'white', lineHeight: 1 }}>
              ${PLAN_PRICE}<span style={{ fontSize: 20, fontWeight: 400 }}>/month</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 8 }}>
              Pay via <strong>Lonestar MTN Mobile Money</strong> — no card needed
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            {[
              ['✅', 'All 8 subjects — unlimited practice questions'],
              ['✅', 'Full mock exams (Paper 1, 2 & 3) with timed conditions'],
              ['✅', 'AI-marked essays with detailed feedback'],
              ['✅', 'Explanations for every question'],
              ['✅', 'Full performance analytics & progress tracking'],
              ['✅', 'AI Tutor — ask questions on any topic, anytime'],
              ['✅', 'Offline mode — study without internet'],
            ].map(([icon, text]) => (
              <div key={text} style={s.featureRow}><span>{icon}</span> {text}</div>
            ))}
          </div>

          {error && <div style={s.error}>{error}</div>}

          <form onSubmit={initiatePayment}>
            <label style={s.label}>Lonestar MTN Mobile Money Number</label>
            <input
              style={s.input}
              type="tel"
              placeholder="e.g. 0881234567 or +231881234567"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 20, lineHeight: 1.5 }}>
              Enter your MTN number. You will receive a payment prompt directly on your phone to approve the ${PLAN_PRICE} charge — no redirect needed.
            </div>
            <button type="submit" style={s.btn} disabled={loading}>
              {loading ? 'Sending payment request...' : `Pay $${PLAN_PRICE} via Lonestar MTN →`}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--gray-400)' }}>
            🔒 Powered by MTN MoMo Collections API · Cancel anytime
          </div>
        </div>
      </div>
    </div>
  )
}
