/**
 * WASSCEPrep — MTN MoMo Collections payment function
 *
 * Actions:
 *   initiate  →  Request payment from student's MTN wallet
 *   status    →  Poll payment result; activate subscription on success
 */
const { createClient } = require('@supabase/supabase-js')

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// ── Config from environment variables ────────────────────────────────────────
const IS_SANDBOX    = (process.env.MTN_TARGET_ENVIRONMENT || 'sandbox') === 'sandbox'
const MTN_BASE_URL  = IS_SANDBOX
  ? 'https://sandbox.momodeveloper.mtn.com'
  : 'https://proxy.momoapi.mtn.com'
const TARGET_ENV    = process.env.MTN_TARGET_ENVIRONMENT || 'sandbox'
const SUB_KEY       = process.env.MTN_SUBSCRIPTION_KEY
const API_USER_ID   = process.env.MTN_API_USER_ID
const API_KEY       = process.env.MTN_API_KEY
const PLAN_AMOUNT   = process.env.MTN_PLAN_AMOUNT   || '1'    // 1 EUR sandbox / LRD in prod
const PLAN_CURRENCY = process.env.MTN_PLAN_CURRENCY || 'EUR'  // EUR sandbox / LRD in prod
const PLAN_DAYS     = 31

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── Get MTN access token ──────────────────────────────────────────────────────
async function getMtnToken() {
  const credentials = Buffer.from(`${API_USER_ID}:${API_KEY}`).toString('base64')
  const res = await fetch(`${MTN_BASE_URL}/collection/token/`, {
    method: 'POST',
    headers: {
      'Authorization':             `Basic ${credentials}`,
      'Ocp-Apim-Subscription-Key': SUB_KEY,
      'X-Target-Environment':      TARGET_ENV,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`MTN token error ${res.status}: ${body}`)
  }
  const data = await res.json()
  return data.access_token
}

// ── Normalize phone to MSISDN (Liberia: 231xxxxxxxx) ─────────────────────────
function normalizeMsisdn(raw) {
  let digits = raw.replace(/[^0-9]/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0') && digits.length >= 9) digits = '231' + digits.slice(1)
  if (!digits.startsWith('231')) digits = '231' + digits
  return digits
}

// ── Main handler ──────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }

  let body
  try { body = JSON.parse(event.body) } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { action, userId, phoneNumber, referenceId } = body

  // ── INITIATE: send payment request to student's MTN phone ────────────────
  if (action === 'initiate') {
    if (!userId || !phoneNumber) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing userId or phoneNumber' }) }
    }

    const msisdn = normalizeMsisdn(phoneNumber)
    if (msisdn.length < 11) {
      return {
        statusCode: 400, headers: CORS,
        body: JSON.stringify({ error: 'Invalid phone number. Enter your full Lonestar MTN number e.g. 0881234567' }),
      }
    }

    try {
      const token = await getMtnToken()
      const refId = crypto.randomUUID()

      const res = await fetch(`${MTN_BASE_URL}/collection/v1_0/requesttopay`, {
        method: 'POST',
        headers: {
          'Authorization':             `Bearer ${token}`,
          'X-Reference-Id':            refId,
          'X-Target-Environment':      TARGET_ENV,
          'Ocp-Apim-Subscription-Key': SUB_KEY,
          'Content-Type':              'application/json',
        },
        body: JSON.stringify({
          amount:       PLAN_AMOUNT,
          currency:     PLAN_CURRENCY,
          externalId:   userId,
          payer:        { partyIdType: 'MSISDN', partyId: msisdn },
          payerMessage: 'WASSCEPrep Full Access — 1 Month',
          payeeNote:    'WASSCEPrep Student Subscription',
        }),
      })

      if (res.status !== 202) {
        const errBody = await res.text()
        throw new Error(`MTN request error ${res.status}: ${errBody}`)
      }

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ success: true, referenceId: refId }),
      }
    } catch (err) {
      console.error('MTN initiate error:', err.message)
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ success: false, error: err.message }) }
    }
  }

  // ── STATUS: poll result and activate subscription when successful ─────────
  if (action === 'status') {
    if (!userId || !referenceId) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing userId or referenceId' }) }
    }

    try {
      const token = await getMtnToken()
      const res   = await fetch(`${MTN_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`, {
        headers: {
          'Authorization':             `Bearer ${token}`,
          'X-Target-Environment':      TARGET_ENV,
          'Ocp-Apim-Subscription-Key': SUB_KEY,
        },
      })

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`MTN status error ${res.status}: ${errBody}`)
      }

      const data   = await res.json()
      const status = data.status   // PENDING | SUCCESSFUL | FAILED

      if (status === 'SUCCESSFUL') {
        const paidUntil = new Date(Date.now() + PLAN_DAYS * 24 * 60 * 60 * 1000).toISOString()
        const { error: dbErr } = await supabase.from('subscriptions').upsert({
          user_id:          userId,
          plan:             'paid',
          status:           'active',
          paid_until:       paidUntil,
          payment_method:   'mtn_momo',
          mtn_reference_id: referenceId,
          updated_at:       new Date().toISOString(),
        }, { onConflict: 'user_id' })

        if (dbErr) console.error('Subscription upsert error:', dbErr.message)
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ status: 'SUCCESSFUL', paidUntil }) }
      }

      return { statusCode: 200, headers: CORS, body: JSON.stringify({ status }) }
    } catch (err) {
      console.error('MTN status error:', err.message)
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
    }
  }

  return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Unknown action' }) }
}
