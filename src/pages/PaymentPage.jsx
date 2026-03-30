import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

const PLAN_PRICE = 5
const PLAN_CURRENCY = 'USD'

export default function PaymentPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [phone, setPhone]           = useState('')
  const [step, setStep]             = useState('form')   // form | redirecting | verifying | success | already_paid
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [subscription, setSub]      = useState(null)
  const [subLoading, setSubLoading] = useState(true)

  // ── Check if returning from Flutterwave redirect ─────────────────
  // Flutterwave appends ?transaction_id=xxx&tx_ref=yyy&status=successful
  // We detect the return by the presence of transaction_id in the URL.
  useEffect(() => {
    const transactionId = searchParams.get('transaction_id')
    const txRef         = searchParams.get('tx_ref')
    const flwStatus     = searchParams.get('status')

    if (transactionId && user) {
      if (flwStatus === 'cancelled' || flwStatus === 'failed') {
        setError('Payment was cancelled or failed. Please try again.')
        setStep('form')
      } else {
        setStep('verifying')
        verifyPayment(transactionId, txRef)
      }
    }
  }, [searchParams, user])

  // ── Load existing subscription ────────────────────────────────────
  useEffect(() => {
    if (!user) return
    supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        setSub(data)
        setSubLoading(false)
        if (data?.plan === 'paid' && data?.status === 'active') setStep('already_paid')
      })
  }, [user])

  // ── Initiate payment: call backend → get Flutterwave link → redirect ──
  async function initiatePayment(e) {
    e.preventDefault()
    const cleanPhone = phone.trim().replace(/\s/g, '')
    if (!cleanPhone) { setError('Please enter your Lonestar MTN mobile money number'); return }

    setError('')
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate',
          userId: user.id,
          phoneNumber: cleanPhone,
          userEmail: user.email,
          userName: profile?.full_name || '',
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to start payment')

      // Redirect to Flutterwave hosted payment page
      setStep('redirecting')
      window.location.href = data.payment_link
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  // ── Verify after returning from Flutterwave ───────────────────────
  async function verifyPayment(transactionId, txRef) {
    setError('')
    try {
      const res = await fetch('/.netlify/functions/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          userId: user.id,
          transactionId,
          txRef,
        }),
      })
      const data = await res.json()
      if (data.verified) {
        setStep('success')
        setSub({ plan: 'paid', status: 'active', paid_until: data.paid_until })
      } else {
        setError(data.message || 'Payment could not be confirmed. If you paid, it will be activated within 1 minute.')
        setStep('form')
      }
    } catch (err) {
      setError('Could not verify payment. If you paid, your account will be activated automatically within 1 minute.')
      setStep('form')
    }
  }

  const s = {
    page:       { minHeight: '100vh', background: 'var(--off-white)' },
    layout:     { maxWidth: 560, margin: '0 auto', padding: '48px 24px' },
    card:       { background: 'white', borderRadius: 20, padding: 36, border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-md)' },
    title:      { fontFamily: "'DM Serif Display', serif", fontSize: 28, color: 'var(--blue)', marginBottom: 8 },
    sub:        { fontSize: 14, color: 'var(--gray-400)', marginBottom: 28 },
    label:      { fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, display: 'block' },
    input:      { width: '100%', padding: '12px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 10, fontSize: 15, fontFamily: "'DM Sans', sans-serif", outline: 'none', background: 'var(--off-white)', boxSizing: 'border-box', marginBottom: 4 },
    btn:        { width: '100%', padding: 14, background: 'var(--blue)', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' },
    btnGold:    { width: '100%', padding: 14, background: 'var(--gold)', color: 'var(--blue)', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    btnOutline: { width: '100%', marginTop: 10, padding: 12, background: 'transparent', border: '1.5px solid var(--gray-200)', borderRadius: 10, fontSize: 14, cursor: 'pointer', color: 'var(--gray-600)', fontFamily: "'DM Sans', sans-serif" },
    error:      { background: 'var(--red-light)', color: 'var(--red)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14, borderLeft: '3px solid var(--red)' },
    info:       { background: 'var(--blue-light)', color: 'var(--blue)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 },
    planBox:    { background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-mid) 100%)', borderRadius: 14, padding: 24, marginBottom: 24, color: 'white' },
    featureRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 14, color: 'var(--gray-700)' },
  }

  if (!user || subLoading) return (
    <div style={s.page}><Navbar />
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>Loading...</div>
    </div>
  )

  // ── Already paid ─────────────────────────────────────────────────
  if (step === 'already_paid') return (
    <div style={s.page}><Navbar />
      <div style={s.layout}>
        <div style={s.card}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
            <div style={{ ...s.title, textAlign: 'center' }}>You're on the Full Plan</div>
            <div style={{ color: 'var(--gray-400)', marginBottom: 12 }}>
              Active until {new Date(subscription.paid_until).toLocaleDateString('en-LR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
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

  // ── Redirecting to Flutterwave ────────────────────────────────────
  if (step === 'redirecting') return (
    <div style={s.page}><Navbar />
      <div style={s.layout}>
        <div style={{ ...s.card, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div>
          <div style={s.title}>Redirecting to payment...</div>
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>
            You are being redirected to the secure Flutterwave payment page. Please do not close this tab.
          </p>
        </div>
      </div>
    </div>
  )

  // ── Verifying after returning from Flutterwave ────────────────────
  if (step === 'verifying') return (
    <div style={s.page}><Navbar />
      <div style={s.layout}>
        <div style={{ ...s.card, textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔄</div>
          <div style={s.title}>Verifying your payment...</div>
          <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>
            Please wait — we're confirming your payment with Lonestar MTN. This usually takes a few seconds.
          </p>
        </div>
      </div>
    </div>
  )

  // ── Success ───────────────────────────────────────────────────────
  if (step === 'success') return (
    <div style={s.page}><Navbar />
      <div style={s.layout}>
        <div style={s.card}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ ...s.title, textAlign: 'center' }}>Payment Confirmed!</h2>
            <p style={{ fontSize: 15, color: 'var(--gray-600)', marginBottom: 24, lineHeight: 1.6 }}>
              Your account now has <strong>Full Access</strong> for 31 days — unlimited practice, mock exams, AI marking, and more.
            </p>
            <button style={{ ...s.btn, maxWidth: 240, margin: '0 auto', display: 'block' }} onClick={() => navigate('/dashboard')}>
              Start Studying →
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── Payment form ──────────────────────────────────────────────────
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
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8 }}>
              Pay via <strong>Lonestar MTN Mobile Money</strong> — no card needed
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            {[
              ['✅', 'Unlimited practice questions across all 8 subjects'],
              ['✅', 'Full mock exams (Paper 1, 2 & 3) with AI-marked essays'],
              ['✅', 'Detailed explanations for every question'],
              ['✅', 'Full performance analytics & progress tracking'],
              ['✅', 'AI Tutor — ask questions on any topic, anytime'],
              ['✅', 'Download all past papers'],
              ['✅', 'Offline mode — study even without internet'],
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
              placeholder="+231 77 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 20 }}>
              Enter your Lonestar MTN number. You will be taken to a secure payment page to approve the ${PLAN_PRICE} charge.
            </div>
            <button type="submit" style={s.btn} disabled={loading}>
              {loading ? 'Preparing payment...' : `Pay $${PLAN_PRICE} via Lonestar MTN →`}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--gray-400)' }}>
            🔒 Secured by Flutterwave • Cancel anytime
          </div>
        </div>
      </div>
    </div>
  )
}
