/**
 * WASSCEPrep — Flutterwave Webhook Handler
 *
 * Flutterwave sends a POST to this endpoint whenever a payment completes,
 * fails, or is cancelled — even if the user closed the browser tab.
 * This ensures subscriptions are always activated, no matter what.
 *
 * Setup in Flutterwave dashboard:
 *   Settings → Webhooks → add URL:
 *   https://your-site.netlify.app/.netlify/functions/flutterwave-webhook
 *
 * Env vars required:
 *   FLUTTERWAVE_SECRET_HASH   — set this in Flutterwave dashboard → Webhooks → Secret Hash
 *   FLUTTERWAVE_SECRET_KEY    — to re-verify transactions
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const FLW_BASE = 'https://api.flutterwave.com/v3'

exports.handler = async (event) => {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  // ── Verify the webhook signature ──────────────────────────────────────────
  // Flutterwave sends a verif-hash header; compare against your secret hash
  const receivedHash = event.headers['verif-hash']
  if (!receivedHash || receivedHash !== process.env.FLUTTERWAVE_SECRET_HASH) {
    console.warn('Webhook signature mismatch — possible spoofing attempt')
    return { statusCode: 401, body: 'Unauthorized' }
  }

  try {
    const payload = JSON.parse(event.body)

    // We only care about successful charge completions
    if (payload.event !== 'charge.completed') {
      return { statusCode: 200, body: 'Event ignored' }
    }

    const { data } = payload
    if (data.status !== 'successful') {
      // Log failed/cancelled payments but don't error
      await supabase.from('payments')
        .update({ status: data.status })
        .eq('tx_ref', data.tx_ref)
      return { statusCode: 200, body: 'Status recorded' }
    }

    // ── Re-verify with Flutterwave API (never trust webhook data alone) ──────
    const verifyRes = await fetch(`${FLW_BASE}/transactions/${data.id}/verify`, {
      headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
    })
    const verified = await verifyRes.json()

    if (verified.status !== 'success' || verified.data.status !== 'successful') {
      console.error('Webhook re-verification failed', verified)
      return { statusCode: 200, body: 'Verification failed — ignoring' }
    }

    const txData = verified.data

    // Extract user_id from the meta field we set during initiation
    const userId = txData.meta?.user_id
    if (!userId) {
      console.error('No user_id in transaction meta', txData.tx_ref)
      return { statusCode: 200, body: 'No user_id — cannot activate subscription' }
    }

    // ── Activate subscription ─────────────────────────────────────────────
    const paidUntil = new Date()
    paidUntil.setDate(paidUntil.getDate() + 31)

    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan: 'paid',
      status: 'active',
      paid_until: paidUntil.toISOString(),
      payment_ref: txData.tx_ref,
      flw_transaction_id: String(txData.id),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    // ── Update payment record ─────────────────────────────────────────────
    await supabase.from('payments').upsert({
      user_id: userId,
      tx_ref: txData.tx_ref,
      flw_transaction_id: String(txData.id),
      amount: txData.amount,
      currency: txData.currency,
      phone_number: txData.customer?.phone_number || '',
      status: 'successful',
      paid_at: new Date().toISOString(),
    }, { onConflict: 'tx_ref' })

    console.log(`✅ Subscription activated for user ${userId} via webhook`)
    return { statusCode: 200, body: 'Subscription activated' }

  } catch (err) {
    console.error('Webhook handler error:', err)
    // Return 200 so Flutterwave doesn't keep retrying on our code errors
    return { statusCode: 200, body: 'Error processed' }
  }
}
