/**
 * Demo seed payloads for three archetypes: salaried, gig, risky
 * Prints JSON to stdout so it can be copied into the frontend textarea.
 */

function iso(y, m, d, h, min) {
  const dt = new Date(Date.UTC(y, m - 1, d, h, min || 0, 0))
  return dt.toISOString()
}

function makeSalaried() {
  const tx = []
  // Monthly salary credits
  for (let m = 7; m <= 10; m++) {
    tx.push({ ts: iso(2025, m, 1, 10), amount: 80000, type: 'credit', merchant: 'ACME Corp', channel: 'Bank' })
  }
  // Regular daytime card spending
  tx.push({ ts: iso(2025, 10, 2, 13), amount: 1200, type: 'debit', merchant: 'GroceryMart', channel: 'Card' })
  tx.push({ ts: iso(2025, 10, 5, 18), amount: 900, type: 'debit', merchant: 'CafeBrew', channel: 'UPI' })
  tx.push({ ts: iso(2025, 10, 9, 15), amount: 3000, type: 'debit', merchant: 'ElectroShop', channel: 'Card' })
  return { userId: 'demo_salaried', transactions: tx }
}

function makeGig() {
  const tx = []
  // Irregular credits
  for (let i = 0; i < 10; i++) {
    tx.push({ ts: iso(2025, 10, 1 + i, 12), amount: 6000 + (i % 3) * 1500, type: 'credit', merchant: 'GigPlatform', channel: 'UPI' })
  }
  // Mixed spends
  tx.push({ ts: iso(2025, 10, 3, 20), amount: 1000, type: 'debit', merchant: 'FoodApp', channel: 'UPI' })
  tx.push({ ts: iso(2025, 10, 6, 23), amount: 700, type: 'debit', merchant: 'LateBites', channel: 'Card' })
  tx.push({ ts: iso(2025, 10, 11, 14), amount: 2500, type: 'debit', merchant: 'FuelStation', channel: 'Card' })
  return { userId: 'demo_gig', transactions: tx }
}

function makeRisky() {
  const tx = []
  // Low income, high cash spending at night
  for (let m = 7; m <= 10; m++) {
    tx.push({ ts: iso(2025, m, 5, 2), amount: 15000, type: 'credit', merchant: 'OddJobs', channel: 'Cash' })
  }
  tx.push({ ts: iso(2025, 10, 4, 1), amount: 3000, type: 'debit', merchant: 'ClubNight', channel: 'Cash' })
  tx.push({ ts: iso(2025, 10, 7, 0), amount: 2000, type: 'debit', merchant: 'Bar', channel: 'Cash' })
  tx.push({ ts: iso(2025, 10, 8, 23), amount: 1500, type: 'debit', merchant: 'LateBites', channel: 'Cash' })
  return { userId: 'demo_risky', transactions: tx }
}

const payloads = { salaried: makeSalaried(), gig: makeGig(), risky: makeRisky() }

if (require.main === module) {
  console.log(JSON.stringify(payloads, null, 2))
}

export default payloads
