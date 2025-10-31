import { Router } from 'express';
import { store } from '../services/store.js';

const router = Router();

router.get('/:user_id', async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const kyc = store.kyc.get(user_id) || null;
    const txn = store.txn.get(user_id) || null;

    // Behavioral heuristic: deviation multiplier from last txn
    let behavior_alerts = [];
    let behavior_score = 0; // 0..1
    if (txn?.stats) {
      const { avg = 0, last = 0 } = txn.stats;
      if (avg > 0 && last > 3 * avg) {
        behavior_alerts.push('Spending deviation > 3x average');
        behavior_score = 0.7;
      }
    }

    const transaction_risk_score = txn?.transaction_risk_score ?? 0;
    const kyc_fraud_score = kyc?.kyc_fraud_score ?? 0;

    const total_risk_score = Math.max(0, Math.min(1, 0.5 * transaction_risk_score + 0.4 * kyc_fraud_score + 0.1 * behavior_score));

    const alerts = [];
    if (kyc?.alerts) alerts.push(...kyc.alerts);
    if (txn?.alerts) alerts.push(...txn.alerts);
    if (behavior_alerts.length) alerts.push(...behavior_alerts);

    res.json({ user_id, total_risk_score, alerts, kyc, transactions: txn });
  } catch (err) {
    res.status(500).json({ message: 'risk summary failed', error: String(err?.message || err) });
  }
});

export default router;
