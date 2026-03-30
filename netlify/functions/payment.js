/**
 * WASSCEPrep — Flutterwave Mobile Money Payment Handler
 *
 * Actions:
 *   initiate — create a Flutterwave payment link → return link for redirect
 *   verify   — verify a completed transaction by transaction_id
 *
 * Env vars required (set in Netlify dashboard → Site settings → Environment):
 *   FLUTTERWAVE_SECRET_KEY   — your Flutterwave secret key (starts with FLWSECK_)
 *   VITE_SUPABASE_URL        — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key (server-side only)
 *   APP_URL                  — your deployed app URL e.g. https://wassceprep.netlify.app
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const FLW_BASE = 'https://api.flutterwave.com/v3'
const PLAN_AMOUNT = 5
const PLAN_CURRENCY = 'USD'

// ── Initiate a Flutterwave payment link ──────────────────────────────────────
async function initiatePayment({ userId, phoneNumber, userEmail, userName }) {
  const txRef = `WP-${userId.slice(0, 8)}-${Date.now()}`

  const payload = {
    tx_ref: txRef,
    amount: PLAN_AMOUNT,
    currency: PLAN_CURRENCY,
    redirect_url: `${process.env.APP_URL}/upgrade`,   // Flutterwave appends ?transaction_id=&tx_ref=&status=
    payment_options: 'mobilemoneyliberia',      // Lonestar MTN Liberia
    customer: {
      email: userEmail || 'student@wassceprep.app',
      phonenumber: phoneNumber,
      name: userName || 'WASSCEPrep Student',
    },
    customizations: {
      title: 'WASSCEPrep Full Access',
      description: 'Monthly subscription — unlimited exam prep',
      logo: `${process.env.APP_URL}/logo.png`,
    },
    meta: { user_id: userId },
  }

  const res = await fetch(`${FLW_BASE}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (data.status !== 'success') throw new Error(data.message || 'Failed to create payment link')

  // Record the pending payment in Supabase
  await supabase.from('payments').insert({
    user_id: userId,
    tx_ref: txRef,
    amount: PLAN_AMOUNT,
    currency: PLAN_CURRENCY,
    phone_number: phoneNumber,
    status: 'pending',
  })

  // Also mark subscription as pending
  await supabase.from('subscriptions').upsert({
    user_id: userId,
    plan: 'free',
    status: 'pending',
    payment_ref: txRef,
    mobile_number: phoneNumber,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return { payment_link: data.data.link, tx_ref: txRef }
}

// ── Verify a completed Flutterwave transaction ───────────────────────────────
async function verifyPayment({ transactionId, txRef, userId }) {
  const res = await fetch(`${FLW_BASE}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
  })

  const data = await res.json()

  if (data.status !== 'success' || data.data.status !== 'successful') {
    return { verified: false, message: 'Payment not yet confirmed. Please try again in a moment.' }
  }

  // Guard: confirm amount and currency match to prevent fraud
  if (data.data.amount < PLAN_AMOUNT || data.data.currency !== PLAN_CURRENCY) {
    console.error('Payment amount mismatch', data.data)
    return { verified: false, message: 'Payment amount mismatch. Please contact support.' }
  }

  // Guard: confirm tx_ref matches (anti-tampering)
  if (txRef && data.data.tx_ref !== txRef) {
    console.error('tx_ref mismatch', data.data.tx_ref, txRef)
    return { verified: false, message: 'Payment reference mismatch. Please contact support.' }
  }

  // Activate subscription — 31 days from now
  const paidUntil = new Date()
  paidUntil.setDate(paidUntil.getDate() + 31)

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    plan: 'paid',
    status: 'active',
    paid_until: paidUntil.toISOString(),
    payment_ref: data.data.tx_ref,
    flw_transaction_id: String(transactionId),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  // Update payment record
  await supabase.from('payments')
    .update({
      status: 'successful',
      flw_transaction_id: String(transactionId),
      paid_at: new Date().toISOString(),
    })
    .eq('tx_ref', data.data.tx_ref)

  return {
    verified: true,
    plan: 'paid',
    paid_until: paidUntil.toISOString(),
    message: 'Payment confirmed! Your account now has full access.',
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const body = JSON.parse(event.body)
    const { action } = body

    if (action === 'initiate') {
      const { userId, phoneNumber, userEmail, userName } = body
      if (!userId || !phoneNumber) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'userId and phoneNumber are required' }) }
      }
      const result = await initiatePayment({ userId, phoneNumber, userEmail, userName })
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, ...result }) }
    }

    if (action === 'verify') {
      const { transactionId, txRef, userId } = body
      if (!transactionId || !userId) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'transactionId and userId are required' }) }
      }
      const result = await verifyPayment({ transactionId, txRef, userId })
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, ...result }) }
    }

    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Unknown action' }) }

  } catch (err) {
    console.error('Payment function error:', err)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
