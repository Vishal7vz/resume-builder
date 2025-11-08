import 'dotenv/config'
import express from 'express'

import enhanceHandler from '../api/enhance.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json({ limit: '1mb' }))

app.options('/api/enhance', (req, res) => enhanceHandler(req, res))
app.post('/api/enhance', (req, res) => enhanceHandler(req, res))

app.get('/health', (_req, res) => res.status(200).json({ ok: true }))

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})
