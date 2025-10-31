import React, { useState } from 'react';
import { analyzeTransactions, getRiskSummary } from '../api.js';
import AlertsList from './AlertsList.jsx';

const SAMPLE = [
  { ts: '2024-01-05T10:00:00Z', amount: 1200, merchant: 'Zomato', category: 'Food' },
  { ts: '2024-01-10T12:00:00Z', amount: 1600, merchant: 'Amazon', category: 'Shopping' },
  { ts: '2024-01-15T20:00:00Z', amount: 5400, merchant: 'CryptoExchange', category: 'Crypto' }
];

export default function RiskDashboard(){
  const [userId, setUserId] = useState('u123');
  const [txText, setTxText] = useState(JSON.stringify(SAMPLE, null, 2));
  const [result, setResult] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try{
      const transactions = JSON.parse(txText);
      const r = await analyzeTransactions(userId, transactions);
      setResult(r);
      const s = await getRiskSummary(userId);
      setSummary(s);
    }catch(e){
      alert('Invalid JSON or server error');
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{marginTop:0}}>Risk Dashboard</h3>
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
        <div>
          <div style={{display:'flex', gap:8, marginBottom:8}}>
            <input className="input" value={userId} onChange={e=>setUserId(e.target.value)} placeholder="User ID" />
            <button className="button" onClick={analyze} disabled={loading}>{loading?'Analyzing...':'Analyze Risk'}</button>
          </div>
          <textarea className="textarea" rows={12} value={txText} onChange={e=>setTxText(e.target.value)} />
          <div className="muted" style={{marginTop:6}}>Tip: Paste a JSON array of transactions. Use the sample to start.</div>
        </div>
        <div>
          {result && (
            <div className="card" style={{marginBottom:12}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div><b>Transaction risk</b></div>
                <span className="badge">score: {result.transaction_risk_score?.toFixed?.(2) ?? result.transaction_risk_score}</span>
              </div>
              {result.stats && (
                <div className="muted" style={{marginTop:6}}>avg: {result.stats.avg?.toFixed?.(2)} · last: {result.stats.last?.toFixed?.(2)}</div>
              )}
              <AlertsList alerts={result.alerts||[]} />
            </div>
          )}
          {summary && (
            <div className="card">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div><b>Total risk</b></div>
                <span className="badge">score: {summary.total_risk_score?.toFixed?.(2) ?? summary.total_risk_score}</span>
              </div>
              <AlertsList alerts={summary.alerts||[]} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

