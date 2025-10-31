import { Router } from 'express';
import { runTxnModel } from '../services/mlService.js';
import { store } from '../services/store.js';

const router = Router();

// use shared store

router.post('/', async (req, res) => {
  try {
    const { user_id = 'anon', transactions = [] } = req.body || {};
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ message: 'transactions[] required' });
    }
    const result = await runTxnModel({ user_id, transactions });
    const payload = { user_id, ...result };
    store.txn.set(user_id, payload);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: 'transaction analysis failed', error: String(err?.message || err) });
  }
});

export default router;
