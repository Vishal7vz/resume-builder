// Simple AI integration supporting OpenAI or OpenRouter.
// Env options:
// - VITE_OPENAI_API_KEY (OpenAI directly)
// - VITE_OPENROUTER_API_KEY (OpenRouter; recommended for user-provided sk-or-* keys)
// Falls back to local processing if no key is set.

const OPENAI_KEY = import.meta?.env?.VITE_OPENAI_API_KEY
const OPENROUTER_KEY = import.meta?.env?.VITE_OPENROUTER_API_KEY

function buildPrompt(form) {
  return `You are an expert ATS resume writer. Improve the following candidate data and return STRICT JSON only. Do not include markdown.

Return JSON with keys: summary (string), skills (string[]), experience (array of {org, role, dates, bullets: string[]}), education (same shape), projects (same shape).

Candidate Data:
Name: ${form.name}
Title: ${form.title}
Email: ${form.email}
Phone: ${form.phone}
Location: ${form.location}
Links: ${form.links}
Summary: ${form.summary}
Skills: ${form.skills}
Experience:\n${form.experience}
Projects:\n${form.projects}
Education:\n${form.education}`
}

function parseJsonSafe(text) {
  try {
    const cleaned = text.trim().replace(/^```json\n?|```$/g, '')
    return JSON.parse(cleaned)
  } catch (e) {
    return null
  }
}

export async function enhanceResume(form) {
  // 1) Try secure serverless first (Vercel /api/enhance)
  try {
    const base = (import.meta?.env?.VITE_SERVER_URL || '').trim()
    const url = base ? `${base.replace(/\/$/, '')}/api/enhance` : '/api/enhance'
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form }),
    })
    if (r.ok) {
      const j = await r.json()
      if (j?.data) return j.data
    }
  } catch (_) {
    // ignore; fallback to client-side providers below
  }

  // Prefer OpenAI if OPENAI_KEY present and not an OpenRouter key
  const isOpenRouterKey = (k) => typeof k === 'string' && k.startsWith('sk-or-')

  const useOpenAI = OPENAI_KEY && !isOpenRouterKey(OPENAI_KEY)
  const useOpenRouter = OPENROUTER_KEY || isOpenRouterKey(OPENAI_KEY)

  if (!useOpenAI && !useOpenRouter) {
    return null // signal to fallback
  }

  const messages = [
    { role: 'system', content: 'You rewrite resumes for ATS with quantified, action-driven bullet points.' },
    { role: 'user', content: buildPrompt(form) },
  ]

  if (useOpenAI) {
    const body = { model: 'gpt-4o-mini', messages, temperature: 0.3 }
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error('OpenAI API error')
    const json = await res.json()
    const content = json?.choices?.[0]?.message?.content || ''
    const data = parseJsonSafe(content)
    if (!data) throw new Error('Failed to parse AI response')
    return data
  }

  // OpenRouter path (supports sk-or-* keys)
  const key = OPENROUTER_KEY || OPENAI_KEY // allow passing sk-or-* via OPENAI var too
  const body = { model: 'openai/gpt-4o-mini', messages, temperature: 0.3 }
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': window?.location?.origin || 'http://localhost',
      'X-Title': 'AI Resume Builder',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('OpenRouter API error')
  const json = await res.json()
  const content = json?.choices?.[0]?.message?.content || ''
  const data = parseJsonSafe(content)
  if (!data) throw new Error('Failed to parse AI response')
  return data
}
