/**
 * Feature extractor for alternative credit scoring (Node)
 * Input: array of transactions { ts, amount, type: 'credit'|'debit', merchant, channel }
 * Output features:
 *  - monthly_avg_income (number)
 *  - income_volatility (number)
 *  - ontime_pct (0..1)
 *  - cash_ratio (0..1)
 *  - merchant_diversity (number)
 *  - night_txn_ratio (0..1)
 */

function monthKey(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function computeFeatures(transactions = []) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      monthly_avg_income: 0,
      income_volatility: 0,
      ontime_pct: 0,
      cash_ratio: 0,
      merchant_diversity: 0,
      night_txn_ratio: 0
    }
  }

  const parsed = []
  for (const t of transactions) {
    try {
      const d = new Date(t.ts)
      if (isNaN(d)) continue
      parsed.push({
        ts: d,
        amount: Number(t.amount) || 0,
        type: t.type === 'credit' ? 'credit' : 'debit',
        merchant: (t.merchant || '').trim(),
        channel: (t.channel || '').trim()
      })
    } catch {}
  }
  if (parsed.length === 0) return computeFeatures([])

  // Group by month
  const creditsByMonth = new Map()
  const merchantsByMonth = new Map()
  let cashDebitAmt = 0
  let totalDebitAmt = 0
  let nightCount = 0
  let totalCount = 0
  let daytimeCount = 0

  for (const t of parsed) {
    totalCount++
    const hour = t.ts.getUTCHours()
    const isNight = hour < 6 || hour >= 22
    if (isNight) nightCount++
    else daytimeCount++

    if (t.type === 'debit') {
      totalDebitAmt += Math.abs(t.amount)
      if ((t.channel || '').toLowerCase() === 'cash') cashDebitAmt += Math.abs(t.amount)
    } else if (t.type === 'credit') {
      const mk = monthKey(t.ts)
      creditsByMonth.set(mk, (creditsByMonth.get(mk) || 0) + Math.max(0, t.amount))
    }

    const mk2 = monthKey(t.ts)
    if (!merchantsByMonth.has(mk2)) merchantsByMonth.set(mk2, new Set())
    if (t.merchant) merchantsByMonth.get(mk2).add(t.merchant)
  }

  const creditMonths = [...creditsByMonth.values()]
  const monthly_avg_income = creditMonths.length
    ? creditMonths.reduce((a, b) => a + b, 0) / creditMonths.length
    : 0
  const mean = monthly_avg_income
  const variance = creditMonths.length
    ? creditMonths.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / creditMonths.length
    : 0
  const stddev = Math.sqrt(variance)
  const income_volatility = mean > 0 ? stddev / mean : 0

  const monthsCovered = merchantsByMonth.size || 1
  const totalUniqueMerchants = [...merchantsByMonth.values()].reduce((acc, s) => acc + s.size, 0)
  const merchant_diversity = monthsCovered ? totalUniqueMerchants / monthsCovered : 0

  const cash_ratio = totalDebitAmt > 0 ? cashDebitAmt / totalDebitAmt : 0
  const night_txn_ratio = totalCount > 0 ? nightCount / totalCount : 0

  // Ontime proxy: proportion of transactions during daytime hours
  const ontime_pct = totalCount > 0 ? daytimeCount / totalCount : 0

  return {
    monthly_avg_income: Number(monthly_avg_income.toFixed(2)),
    income_volatility: Number(income_volatility.toFixed(4)),
    ontime_pct: Number(ontime_pct.toFixed(4)),
    cash_ratio: Number(cash_ratio.toFixed(4)),
    merchant_diversity: Number(merchant_diversity.toFixed(2)),
    night_txn_ratio: Number(night_txn_ratio.toFixed(4))
  }
}
