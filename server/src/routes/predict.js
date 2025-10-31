/**
 * /api/predict route
 * Accepts JSON { userId?, transactions?: [...], mode?: 'ml'|'fallback' }
 * Optionally accepts CSV in future (not required for MVP).
 * When mode == 'ml' (default), forward to ML microservice; on failure, fallback to deterministic scorer.
 */
import express from 'express'
import axios from 'axios'
import { computeFeatures } from '../utils/featureExtractor.js'
import { weightedScore, scoreToTier, probToScore, applyTemperature } from '../utils/scoreMapper.js'

const router = express.Router()

function validateTransactions(transactions) {
  if (!Array.isArray(transactions)) return 'transactions must be an array'
  for (const t of transactions) {
    if (!t) return 'transaction item is null'
    if (typeof t.ts !== 'string') return 'transaction.ts must be ISO string'
    if (typeof t.amount !== 'number') return 'transaction.amount must be number'
    if (!['credit', 'debit'].includes(t.type)) return 'transaction.type must be credit|debit'
  }
  return null
}

router.post('/', async (req, res) => {
  try {
    const { userId = 'demo', transactions = [], mode = 'ml', features: preFeatures } = req.body || {}

    const err = validateTransactions(transactions)
    if (err) return res.status(400).json({ message: `Invalid input: ${err}` })

    const feats = preFeatures || computeFeatures(transactions)

    if (mode !== 'fallback') {
      try {
        const url = `${process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000'}/predict`
        const { data } = await axios.post(url, { userId, transactions })
        // Temper probability to avoid extreme scores for demo realism
        const temp = Number(process.env.ML_TEMP || 1.5)
        const p2 = applyTemperature(data.prob_good ?? 0.5, temp)
        const score2 = probToScore(p2)
        const tier2 = scoreToTier(score2)
        return res.json({
          userId,
          score: score2,
          tier: tier2,
          prob_good: Number(p2.toFixed(4)),
          contributions: data.contributions || [],
          features: data.features,
          summary: data.summary
        })
      } catch (e) {
        console.warn('ML service unreachable, falling back. Error:', e?.message)
      }
    }

    // Fallback deterministic scoring
    const { prob_good, score, contributions } = weightedScore(feats)
    const tier = scoreToTier(score)

    return res.json({
      userId,
      score,
      tier,
      prob_good,
      contributions,
      features: feats,
      summary: contributions.map(c => `${c.value >= 0 ? '+' : ''}${c.value} ${c.description}`)
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error in /api/predict', error: err.message })
  }
})

export default router
