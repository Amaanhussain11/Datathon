// Rule/template engine for offline-first chat
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeEMI } from './utils/emi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KB_PATH = path.join(__dirname, 'kb', 'hindi_v1.json');
const KB = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));

// Basic maps for keyword → intent
const INTENTS = [
  { key: 'emi_explain', kw: ['emi', 'installment', 'monthly payment'] },
  { key: 'loan_explain', kw: ['loan', 'borrow', 'interest'] },
  { key: 'investment_basic', kw: ['invest', 'investment', 'sip', 'mutual fund'] },
  { key: 'credit_score_explain', kw: ['score', 'credit score', 'cibil'] },
  { key: 'score_simulate', kw: ['simulate', 'improve score', 'what if', 'features'] },
  { key: 'budgeting_tips', kw: ['budget', 'budgeting'] },
  { key: 'saving_tips', kw: ['save', 'saving', 'bachat'] }
];

export function detectIntent(text) {
  const t = (text || '').toLowerCase();
  for (const it of INTENTS) {
    if (it.kw.some(k => t.includes(k))) return it.key;
  }
  // Hindi hints
  if (/emi|क़िस्त|किस्त/.test(t)) return 'emi_explain';
  if (/loan|कर्ज/.test(t)) return 'loan_explain';
  if (/invest|निवेश|sip/.test(t)) return 'investment_basic';
  if (/score|स्कोर|cibil/.test(t)) return 'credit_score_explain';
  if (/budget|बजट/.test(t)) return 'budgeting_tips';
  if (/save|saving|बचत/.test(t)) return 'saving_tips';
  return 'fallback';
}

export function getTemplateResponse(intent, params = {}) {
  const tpl = KB.intents[intent] || KB.intents.fallback || '...';
  return tpl.replace(/\{(\w+)\}/g, (_, k) => {
    const v = params[k];
    return (v === undefined || v === null) ? `{${k}}` : String(v);
  });
}

// Deterministic scoring similar to server/ml
export function explainScore(features = {}) {
  const f = {
    monthly_avg_income: 0,
    income_volatility: 0,
    ontime_pct: 0,
    cash_ratio: 0,
    merchant_diversity: 0,
    night_txn_ratio: 0,
    ...features
  };
  let score = 0;
  const contrib = [];
  const push = (feature, points, text) => { contrib.push({ feature, points, text }); score += points; };

  push('monthly_avg_income', Math.min(1.0, f.monthly_avg_income / 60000), 'Income zyada → better');
  push('income_volatility', Math.max(0, 0.8 - f.income_volatility), 'Stable income accha hota hai');
  push('ontime_pct', f.ontime_pct, 'Time pe payment sabse important');
  push('cash_ratio', Math.max(0, 0.6 - f.cash_ratio), 'Cash kam aur digital zyada');
  push('merchant_diversity', Math.min(1.0, f.merchant_diversity / 8), 'Diverse merchants → balanced spend');
  push('night_txn_ratio', Math.max(0, 0.7 - f.night_txn_ratio), 'Raat me zyada spend avoid');

  const prob_good = Math.max(0, Math.min(1, score / 5.4));
  const creditScore = Math.round(300 + prob_good * 550);
  const tier = creditScore >= 750 ? 'Gold' : creditScore >= 650 ? 'Silver' : 'Bronze';
  return { prob_good, score: creditScore, tier, contributions: contrib };
}

export function handleIntent(intent, text, meta = {}) {
  if (intent === 'emi_explain') {
    const P = Number(meta.P ?? 50000);
    const r_percent = Number(meta.r ?? 10);
    const n_months = Number(meta.n ?? 12);
    const { emi } = computeEMI(P, r_percent, n_months);
    const answer = getTemplateResponse('emi_explain', { P, r_percent, n_months, emi });
    return { answer, intent, meta: { P, r_percent, n_months, emi } };
  }
  if (intent === 'credit_score_explain') {
    const answer = getTemplateResponse('credit_score_explain');
    return { answer, intent };
  }
  if (intent === 'score_simulate') {
    const res = explainScore(meta.features || {});
    const details = [`Score: ${res.score} (${res.tier})`, `Prob good: ${res.prob_good.toFixed(2)}`].join('\n');
    const answer = `${getTemplateResponse('score_simulate')}\n${details}`;
    return { answer, intent, meta: res };
  }
  // generic intents
  const answer = getTemplateResponse(intent);
  return { answer, intent };
}

export default { detectIntent, getTemplateResponse, explainScore, handleIntent };
