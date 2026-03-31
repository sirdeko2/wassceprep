const Anthropic = require('@anthropic-ai/sdk')
const { createClient } = require('@supabase/supabase-js')

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const RATE_LIMIT    = 10
const WINDOW_HOURS  = 8

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  try {
    const { messages, subject, userId } = JSON.parse(event.body)

    // ── Server-side rate limit check ───────────────────────────────────
    // The spec requires server-side enforcement BEFORE calling the Claude API.
    // Rolling 8-hour window: max 10 questions per user.
    if (userId) {
      const windowStart = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString()
      const { count, error: countError } = await supabase
        .from('ai_tutor_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', windowStart)

      if (!countError && count >= RATE_LIMIT) {
        // Calculate when the window will reset (oldest request + 8 hours)
        const { data: oldest } = await supabase
          .from('ai_tutor_usage')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', windowStart)
          .order('created_at', { ascending: true })
          .limit(1)

        const resetAt = oldest?.[0]?.created_at
          ? new Date(new Date(oldest[0].created_at).getTime() + WINDOW_HOURS * 60 * 60 * 1000).toISOString()
          : null

        return {
          statusCode: 429,
          headers: CORS,
          body: JSON.stringify({
            error: 'rate_limit_exceeded',
            message: `You have reached your limit of ${RATE_LIMIT} AI Tutor questions for this 8-hour period.`,
            reset_at: resetAt,
          }),
        }
      }
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are Legacy Tutor, an expert WASSCE exam tutor for Liberian students preparing for the West African Senior School Certificate Examination (WASSCE). You are currently focused on: ${subject}.

Your role:
- Give clear, concise explanations suitable for secondary school students
- Reference the WAEC syllabus and past paper question styles
- Where relevant, use Liberian and West African examples
- For Mathematics and Sciences, always show step-by-step working
- For English, correct grammar gently and explain rules clearly
- Keep responses under 400 words unless a topic genuinely requires more detail
- Always end with an encouraging note or a follow-up question to check understanding`,
      messages: messages.filter(m => m.role === 'user' || m.role === 'assistant'),
    })

    // ── Log usage AFTER successful API call (server-side, authoritative) ──
    if (userId) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
      await supabase.from('ai_tutor_usage').insert({
        user_id: userId,
        question_text: lastUserMsg?.content || '',
        subject: subject || 'General',
      })
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ content: response.content[0].text }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: error.message }),
    }
  }
}
