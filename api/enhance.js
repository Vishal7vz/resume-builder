export default async function handler(req, res) {
  // CORS for local dev and Vercel preview
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'Server not configured: missing OPENROUTER_API_KEY' })
  }

  try {
    const { form } = req.body || {}
    if (!form) return res.status(400).json({ error: 'Missing form data' })

    const prompt = `You are an expert ATS resume writer. Improve the following candidate data and return STRICT JSON only. Do not include markdown.

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

    const body = {
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You rewrite resumes for ATS with quantified, action-driven bullet points.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    }

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost',
        'X-Title': 'AI Resume Builder',
      },
      body: JSON.stringify(body),
    })

    if (!r.ok) {
      const t = await r.text()
      return res.status(500).json({ error: 'OpenRouter API error', info: t })
    }

    const json = await r.json()
    const content = json?.choices?.[0]?.message?.content || ''

    const cleaned = content.trim().replace(/^```json\n?|```$/g, '')
    let parsed
    try { parsed = JSON.parse(cleaned) } catch (e) {
      return res.status(500).json({ error: 'Failed to parse AI response', content })
    }

    return res.status(200).json({ data: parsed })
  } catch (err) {
    return res.status(500).json({ error: 'Server error', message: err?.message })
  }
}
