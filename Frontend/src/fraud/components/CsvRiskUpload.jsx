import React, { useState } from 'react';
import Papa from 'papaparse';
import { analyzeTransactions, getRiskSummary } from '../api.js';
import AlertsList from './AlertsList.jsx';

// Upload a bank CSV and run anomaly/risk detection using existing endpoints
export default function CsvRiskUpload(){
  const [userId, setUserId] = useState('u123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [localAlerts, setLocalAlerts] = useState([]);
  const [localRisk, setLocalRisk] = useState(null);

  const parseAmount = (row) => {
    // Support columns: Debit, Credit, Amount
    const toNum = (v) => {
      if (v === undefined || v === null) return 0;
      const s = String(v).trim();
      if (!s || s === '-' || s === '--') return 0;
      return Number(s.replace(/[^0-9.-]/g, '')) || 0;
    };
    const debit = toNum(row.Debit ?? row.debit);
    const credit = toNum(row.Credit ?? row.credit);
    if (debit || credit) return credit - debit; // signed, credit positive
    const amt = toNum(row.Amount ?? row.amount ?? row.Amt ?? row.amt);
    // If type indicates debit/credit
    const ty = String(row['Transaction Type'] || row.type || row.Type || row.direction || '').toLowerCase();
    let a = amt;
    if (amt > 0 && /debit|withdraw/.test(ty)) a = -Math.abs(amt);
    if (amt > 0 && /credit|deposit/.test(ty)) a = Math.abs(amt);
    return a;
  };

  const inferCategory = (desc = '') => {
    const d = String(desc).toLowerCase();
    if (/zoma|swiggy|food|restaurant|cafe/.test(d)) return 'Food';
    if (/uber|ola|metro|bus|fuel|petrol/.test(d)) return 'Transportation';
    if (/amazon|flipkart|shop|mall/.test(d)) return 'Shopping';
    if (/rent|electric|water|gas|internet|bill|utilit/.test(d)) return 'Utilities';
    if (/crypto|exchange|binance|coin/.test(d)) return 'Crypto';
    return 'Other';
  };

  const onFile = async (file) => {
    setError('');
    setLoading(true);
    setResult(null);
    setSummary(null);
    setLocalAlerts([]);
    setLocalRisk(null);
    try{
      const rows = await new Promise((resolve, reject) => {
        Papa.parse(file, { header: true, skipEmptyLines: true, complete: (res)=> resolve(res.data), error: reject });
      });
      // Map to expected shape for analyzeTransactions
      const txns = rows
        .map(r => {
          const amount = parseAmount(r);
          const date = r.date || r.Date || r.timestamp || r.Timestamp || r['Txn Date'] || r['Value Date'] || '';
          const desc = r.description || r.Description || r.Merchant || r.merchant || '';
          // Skip non-movement rows
          if (!date || amount === 0) return null;
          return {
            ts: new Date(date).toISOString(),
            amount: Math.abs(amount),
            merchant: String(desc).slice(0,80) || 'Unknown',
            category: inferCategory(desc),
            _rawDesc: desc
          };
        })
        .filter(Boolean);

      if (txns.length === 0) throw new Error('No valid transactions found in CSV');

      // Client-side anomaly detection: sudden crypto or unusually large amount
      const amounts = txns.map(t => t.amount);
      const mean = amounts.reduce((a,b)=>a+b,0)/amounts.length;
      const variance = amounts.reduce((a,b)=> a + Math.pow(b - mean, 2), 0) / amounts.length;
      const std = Math.sqrt(variance);
      const absThreshold = 50000; // domain heuristic for large transfers
      const zThreshold = mean + 3*std; // statistical outlier
      const bigThreshold = Math.max(absThreshold, zThreshold || 0);

      const local = [];
      let cryptoCount = 0;
      let largeCount = 0;
      let maxZ = 0;
      for (const t of txns) {
        if (t.category === 'Crypto') {
          local.push(`Sudden crypto transaction detected: ₹${t.amount.toLocaleString()} at ${t.merchant} on ${new Date(t.ts).toLocaleDateString()}`);
          cryptoCount++;
        }
        if (t.amount >= bigThreshold) {
          local.push(`Unusually large transfer: ₹${t.amount.toLocaleString()} on ${new Date(t.ts).toLocaleDateString()} (threshold ₹${Math.round(bigThreshold).toLocaleString()})`);
          largeCount++;
        }
        const z = std ? Math.abs((t.amount - mean)/std) : 0;
        if (z > maxZ) maxZ = z;
      }
      setLocalAlerts(local);

      // Client-side transaction risk score (0..1) from simple features
      // Components: normalized max Z-score, presence of crypto, count of large transfers
      const zComponent = Math.min(1, maxZ / 6); // cap at 6-sigma
      const cryptoComponent = Math.min(1, cryptoCount > 0 ? 0.4 : 0);
      const largeComponent = Math.min(1, Math.min(3, largeCount) * 0.2); // up to 0.6
      const score = Math.min(1, 0.5*zComponent + cryptoComponent + largeComponent);
      setLocalRisk({
        transaction_risk_score: score,
        stats: { avg: mean, last: amounts[amounts.length - 1] }
      });

      const r = await analyzeTransactions(userId, txns);
      setResult(r);
      const s = await getRiskSummary(userId);
      setSummary(s);
    } catch(e){
      setError(String(e?.message || e));
    } finally{
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{marginTop:0}}>CSV Risk & Anomaly Detection</h3>
      <div style={{display:'flex', gap:8, marginBottom:8}}>
        <input className="input" value={userId} onChange={e=>setUserId(e.target.value)} placeholder="User ID" />
        <label className="button" style={{cursor:'pointer'}}>
          {loading? 'Uploading...' : 'Upload CSV'}
          <input type="file" accept=".csv" style={{display:'none'}} onChange={e=>e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
      </div>
      {error && <div className="muted" style={{color:'#b91c1c', marginBottom:8}}>Error: {error}</div>}

      <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12}}>
        <div>
          {localRisk && localAlerts.length > 0 && (
            <div className="card" style={{marginBottom:12}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div><b>Local transaction risk</b></div>
                <span className="badge">score: {localRisk.transaction_risk_score.toFixed(2)}</span>
              </div>
              <div className="muted" style={{marginTop:6}}>avg: {localRisk.stats.avg.toFixed(2)} · last: {localRisk.stats.last.toFixed(2)}</div>
            </div>
          )}
          {localAlerts.length > 0 && (
            <div className="card" style={{marginBottom:12}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div><b>CSV anomalies (local)</b></div>
                <span className="badge">{localAlerts.length}</span>
              </div>
              <AlertsList alerts={localAlerts} />
            </div>
          )}
        </div>
        <div>
          {summary && (
            <div className="card">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div><b>Total risk</b></div>
                <span className="badge">score: {(() => {
                  const hasBackendAlerts = Array.isArray(summary.alerts) && summary.alerts.length > 0;
                  const hasLocalAlerts = localAlerts.length > 0;
                  if (!hasBackendAlerts && !hasLocalAlerts) return '—';
                  const kycPresent = !!summary.kyc;
                  const fallback = summary.total_risk_score?.toFixed?.(2) ?? summary.total_risk_score;
                  if (!kycPresent && localRisk) return localRisk.transaction_risk_score.toFixed(2);
                  return fallback;
                })()}</span>
              </div>
              <AlertsList alerts={summary.alerts||[]} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
