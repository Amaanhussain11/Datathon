/**
 * Scoring utilities
 * - weightedScore(features): deterministic linear scorer returning prob_good, score, tier, contributions
 * - probToScore(prob): map 0..1 -> 300..850
 * - scoreToTier(score): Gold/Silver/Bronze
 */

export function probToScore(prob) {
  const p = Math.max(0, Math.min(1, prob))
  return Math.round(300 + p * (850 - 300))
}

export function scoreToTier(score) {
  if (score >= 720) return 'Gold'
  if (score >= 640) return 'Silver'
  return 'Bronze'
}

// Apply temperature to probability to reduce extremity (temp > 1 flattens)
export function applyTemperature(prob, temp = 1.5) {
  const p = Math.max(1e-6, Math.min(1 - 1e-6, Number(prob) || 0))
  const t = Math.max(0.5, Number(temp) || 1.0)
  const logit = Math.log(p / (1 - p))
  const p2 = 1 / (1 + Math.exp(-logit / t))
  return p2
}

// We use normalized features (0..1 caps) to avoid saturation
// Caps chosen for typical consumer banking distributions
const WEIGHTS = [
  { key: 'income_scaled', w: 1.2, desc: 'Stable monthly income' },
  { key: 'vol_scaled', w: -1.0, desc: 'Income volatility' },
  { key: 'ontime_pct', w: 1.2, desc: 'Daytime transactions (on-time proxy)' },
  { key: 'cash_ratio', w: -1.0, desc: 'Cash spending ratio' },
  { key: 'merchant_diversity_scaled', w: 0.6, desc: 'Merchant diversity' },
  { key: 'night_txn_ratio', w: -0.8, desc: 'Night transaction ratio' }
]

function sigmoid(x) { return 1 / (1 + Math.exp(-x)) }

export function weightedScore(features) {
  // Build normalized feature vector
  const income = Number(features.monthly_avg_income || 0)
  const income_scaled = Math.max(0, Math.min(income, 100000)) / 100000 // cap at 100k

  const vol = Number(features.income_volatility || 0)
  const vol_capped = Math.min(Math.max(vol, 0), 1.5) // cap 0..1.5
  const vol_scaled = vol_capped / 1.5 // 0..1, higher=worse (negative weight)

  const ontime_pct = Math.max(0, Math.min(Number(features.ontime_pct || 0), 1))
  const cash_ratio = Math.max(0, Math.min(Number(features.cash_ratio || 0), 1))

  const md = Number(features.merchant_diversity || 0)
  const merchant_diversity_scaled = Math.max(0, Math.min(md, 12)) / 12 // cap at 12 per month

  const night_txn_ratio = Math.max(0, Math.min(Number(features.night_txn_ratio || 0), 1))

  const x = { income_scaled, vol_scaled, ontime_pct, cash_ratio, merchant_diversity_scaled, night_txn_ratio }

  // Linear sum -> sigmoid -> prob_good
  let z = 0
  const contributions = []
  for (const { key, w, desc } of WEIGHTS) {
    const v = Number(x[key] || 0)
    const contrib = w * v
    z += contrib
    // Convert to points for readability (align roughly with SHAP scale)
    const points = Math.round(contrib * 40)
    const featureName = key
      .replace('income_scaled', 'monthly_avg_income')
      .replace('vol_scaled', 'income_volatility')
      .replace('merchant_diversity_scaled', 'merchant_diversity')
    contributions.push({ feature: featureName, value: points, description: `${desc} ${points >= 0 ? '+' : ''}${points}` })
  }

  const prob_good = sigmoid(z)
  const score = probToScore(prob_good)
  return { prob_good: Number(prob_good.toFixed(4)), score, contributions }
}
