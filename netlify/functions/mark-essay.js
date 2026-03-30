const Anthropic = require('@anthropic-ai/sdk')

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  try {
    const { questionText, markScheme, studentAnswer, maxMarks, subject, paperNumber } = JSON.parse(event.body)

    if (!studentAnswer || studentAnswer.trim().length < 20) {
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          marks_awarded: 0,
          max_marks: maxMarks,
          percentage: 0,
          justification: 'Answer too short to mark.',
          strengths: [],
          missing_points: ['A substantive answer is required.'],
          feedback: 'Please write a full answer before submitting.',
          ai_status: 'marked',
        }),
      }
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `You are an experienced WASSCE examiner for ${subject} Paper ${paperNumber}.

QUESTION (${maxMarks} marks):
${questionText}

OFFICIAL MARK SCHEME:
${markScheme || 'Award marks based on accuracy, completeness, and clarity of the answer.'}

STUDENT'S ANSWER:
${studentAnswer}

WASSCE marking rules to apply:
- Award marks strictly according to the mark scheme
- For calculations: award process marks even if the final answer is wrong, as long as working is shown
- For essays: reward clear structure, relevant content, and supporting evidence
- For science subjects: units MUST be included for full marks on numerical answers
- Do NOT penalise for minor spelling errors unless they change the meaning
- "Own figure rule" (OFR): if a student uses an incorrect value from part (a) correctly in part (b), award the method marks

Respond ONLY with a valid JSON object in this exact format — no other text:
{
  "marks_awarded": <integer 0 to ${maxMarks}>,
  "max_marks": ${maxMarks},
  "percentage": <float>,
  "justification": "<2-3 sentence explanation of marks awarded>",
  "strengths": ["<what student did well>", "..."],
  "missing_points": ["<key point missing from mark scheme>", "..."],
  "feedback": "<1-2 sentences of constructive advice for improvement>"
}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].text.trim()
    const clean = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ ...result, ai_status: 'marked' }),
    }
  } catch (error) {
    console.error('Mark-essay error:', error)
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({
        marks_awarded: 0,
        max_marks: 0,
        percentage: 0,
        justification: 'AI marking failed. This question has been flagged for manual review.',
        strengths: [],
        missing_points: [],
        feedback: 'Please contact your teacher for feedback on this answer.',
        ai_status: 'failed',
        error: error.message,
      }),
    }
  }
}
