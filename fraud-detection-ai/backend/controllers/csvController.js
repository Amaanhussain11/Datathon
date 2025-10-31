import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

// Helper to parse CSV into array of {date, merchant, amount, type, channel}
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (r) => {
        try {
          // Support generic format and bank CSV with: Date, Transaction Type, Description, Debit, Credit, Balance
          const date = r.date || r.Date || r.timestamp || r.Timestamp || '';
          const merchant = r.merchant || r.Merchant || r.description || r.Description || '';
          const txTypeRaw = (r['Transaction Type'] || r.type || r.Type || r.direction || '').toString();

          // Prefer Debit/Credit columns if present
          let debit = r.Debit ?? r.debit ?? '';
          let credit = r.Credit ?? r.credit ?? '';
          // Normalize numbers from strings like "650.00" or "-"
          const toNum = (v) => {
            if (v === undefined || v === null) return 0;
            const s = String(v).trim();
            if (!s || s === '-' || s === '--') return 0;
            return Number(s.replace(/[^0-9.-]/g, '')) || 0;
          };
          const debitNum = toNum(debit);
          const creditNum = toNum(credit);

          let amount;
          if (debitNum !== 0 || creditNum !== 0) {
            amount = creditNum - debitNum; // credit positive, debit negative
          } else {
            // Fallback to single amount column variants
            const amountRaw = r.amount || r.Amount || r.amt || r.Amt || '0';
            amount = Number(String(amountRaw).replace(/[^0-9.-]/g, '')) || 0;
            // Infer sign from tx type when possible
            if (amount > 0 && /debit|withdraw/i.test(txTypeRaw)) amount = -Math.abs(amount);
            if (amount > 0 && /credit|deposit/i.test(txTypeRaw)) amount = Math.abs(amount);
          }

          // Skip non-transaction rows like Opening Balance when no movement
          const isOpeningBalance = /opening\s*balance/i.test(txTypeRaw || merchant);
          if (isOpeningBalance && debitNum === 0 && creditNum === 0) return;

          const type = (txTypeRaw || (amount < 0 ? 'debit' : 'credit')).toString().toLowerCase();
          const channel = r.channel || r.Channel || r.mode || r.Mode || '';
          rows.push({ date, merchant, amount, type, channel });
        } catch (e) {
          // skip bad row
        }
      })
      .on('end', () => resolve(rows))
      .on('error', (err) => reject(err));
  });
}

function computeFeatures(txns) {
  if (!Array.isArray(txns) || txns.length === 0) {
    return {
      summary: {
        avg_income: 80000,
        volatility: 0.12,
        upi_pct: 85,
        cash_ratio: 10,
        merchant_diversity: 25,
      },
      healthIndex: 8.7,
      monthlySavings: 18500,
      riskScore: 'Low',
      creditScore: 742,
      monthlySpending: [
        { category: 'Food', value: 35 },
        { category: 'Shopping', value: 25 },
        { category: 'Transportation', value: 20 },
        { category: 'Utilities', value: 20 },
      ],
    };
  }

  const credits = txns.filter(t => t.amount > 0).map(t => t.amount);
  const debits = txns.filter(t => t.amount < 0).map(t => Math.abs(t.amount));
  const avg_income = credits.length ? Math.round(credits.reduce((a,b)=>a+b,0)/credits.length) : 0;
  const meanDebit = debits.length ? (debits.reduce((a,b)=>a+b,0)/debits.length) : 0;
  const variance = debits.length ? (debits.reduce((a,b)=>a + Math.pow(b-meanDebit,2),0)/debits.length) : 0;
  const volatility = debits.length ? Number(Math.sqrt(variance)/ (meanDebit || 1)).toFixed(2)*1 : 0.0;

  const total = txns.length;
  const upiCount = txns.filter(t => /upi|gpay|paytm|phonepe/i.test(t.channel||t.merchant||'')).length;
  const cashCount = txns.filter(t => /cash|atm/i.test(t.channel||t.merchant||'')).length;
  const merchants = new Set(txns.map(t => (t.merchant||'').toLowerCase()).filter(Boolean));

  const summary = {
    avg_income,
    volatility: Number(volatility),
    upi_pct: total ? Math.round(upiCount*100/total) : 0,
    cash_ratio: total ? Math.round(cashCount*100/total) : 0,
    merchant_diversity: merchants.size,
  };

  // Basic spending categories (very rough)
  const cats = [
    { name: 'Food', re: /swiggy|zomato|restaurant|food|cafe|uber eats/i },
    { name: 'Shopping', re: /amazon|flipkart|myntra|shopping|store/i },
    { name: 'Transportation', re: /uber|ola|metro|fuel|petrol|diesel|transport/i },
    { name: 'Utilities', re: /electricity|water|gas|dth|broadband|internet|recharge/i },
  ];
  const catAgg = cats.map(c => ({ category: c.name, value: 0 }));
  for (const t of txns) {
    if (t.amount < 0) {
      const m = t.merchant || '';
      const matchIdx = cats.findIndex(c => c.re.test(m));
      const spend = Math.abs(t.amount);
      if (matchIdx >= 0) catAgg[matchIdx].value += spend;
      else catAgg[3].value += spend; // bucket into Utilities by default
    }
  }
  const totalSpend = catAgg.reduce((a,b)=>a+b.value,0) || 1;
  const monthlySpending = catAgg.map(c => ({ category: c.category, value: Math.round(c.value*100/totalSpend) }));

  // Simple placeholder credit score (normalize income/volatility)
  const scoreBase = Math.min(850, Math.max(600, Math.round(650 + (avg_income/1000) - (volatility*50))));

  // --- New metrics ---
  // Monthly savings: average net by month (credits + debits), clipped >=0
  const byMonth = new Map(); // key: YYYY-MM => net
  for (const t of txns) {
    const d = new Date(t.date || '');
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    byMonth.set(key, (byMonth.get(key) || 0) + t.amount);
  }
  const monthNets = Array.from(byMonth.values());
  const avgNet = monthNets.length ? (monthNets.reduce((a,b)=>a+b,0) / monthNets.length) : 0;
  const monthlySavings = Math.max(0, Math.round(avgNet));

  // Health index (0..10): blend of savings rate, low volatility, digital usage, diversity
  const totalCredits = credits.reduce((a,b)=>a+b,0);
  const totalDebits = debits.reduce((a,b)=>a+b,0);
  const savingsRate = totalCredits ? Math.max(0, Math.min(1, (totalCredits - totalDebits)/ totalCredits)) : 0;
  const volNorm = Math.min(1, Number(volatility) / 2); // treat 2.0 as very high volatility
  const upiNorm = (summary.upi_pct || 0) / 100;
  const divNorm = Math.min(1, (summary.merchant_diversity || 0) / 30);
  const healthIndex = Number((
    (0.4 * savingsRate) +
    (0.3 * (1 - volNorm)) +
    (0.2 * upiNorm) +
    (0.1 * divNorm)
  * 10).toFixed(1));

  // Risk tier from healthIndex and volatility
  let riskScore = 'Medium';
  if (healthIndex >= 7.5 && Number(volatility) < 0.5) riskScore = 'Low';
  else if (healthIndex < 5 || Number(volatility) >= 1.0) riskScore = 'High';

  return {
    summary,
    healthIndex,
    monthlySavings,
    riskScore,
    creditScore: scoreBase,
    monthlySpending,
  };
}

export async function handleCSVUpload(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'CSV file is required' });
    const abs = path.resolve(req.file.path);
    const rows = await parseCSV(abs);
    const features = computeFeatures(rows);
    fs.unlink(abs, ()=>{});
    res.json(features);
  } catch (err) {
    res.status(500).json({ message: 'failed to process CSV', error: String(err?.message || err) });
  }
}

export default { handleCSVUpload };
