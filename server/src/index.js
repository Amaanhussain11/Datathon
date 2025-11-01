/**
 * Express server entry for Alternative Credit Scoring Engine
 * - Exposes POST /api/predict
 * - Forwards to Python ML microservice by default
 * - Falls back to deterministic JS scorer if ML is unreachable or mode=="fallback"
 */
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import predictRouter from './routes/predict.js'
import extractRouter from './routes/extract.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors())
// Handle preflight for all routes (important for Vercel -> Render cross-origin requests)
app.options('*', cors())
app.use(bodyParser.json({ limit: '2mb' }))
app.use(bodyParser.urlencoded({ extended: true }))

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'server', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/predict', predictRouter)
app.use('/api/extract', extractRouter)

// Root
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Alt Credit Scoring Server' })
})

app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
