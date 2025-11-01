import React, { useEffect, useState } from 'react';

export default function ApiConsole(){
  const [key, setKey] = useState('');

  useEffect(()=>{
    try{
      const k = localStorage.getItem('api_console_key');
      if (k) setKey(k);
      else generate();
    }catch{}
  },[]);

  const generate = ()=>{
    const k = `demo_${Math.random().toString(36).slice(2,8)}_${Date.now().toString(36)}`;
    setKey(k);
    try{ localStorage.setItem('api_console_key', k); }catch{}
  };

  const FRAUD = import.meta.env.VITE_FRAUD_API || 'http://localhost:4800';
  const MAIN = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  const curl = {
    credit: `curl -X POST ${MAIN}/api/predict \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: ${key}" \\\n  -d '{
    "userId": "demo",
    "transactions": [
      {"ts":"2025-10-01T12:00:00Z","amount":80000,"type":"credit"},
      {"ts":"2025-10-03T12:00:00Z","amount":2000,"type":"debit"}
    ]
  }'`,
    kyc: `curl -X POST ${FRAUD}/api/kyc \\\n  -H "X-API-Key: ${key}" \\\n  -F user_id=u123 \\\n  -F name='Rahul Sharma' \\\n  -F file=@/absolute/path/to/id_image.png`,
    txn: `curl -X POST ${FRAUD}/api/transactions \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: ${key}" \\\n  -d '{
    "user_id": "u123",
    "transactions": [
      {"ts":"2025-10-05T12:00:00Z","amount":120000,"merchant":"Crypto Exchange","category":"Crypto"}
    ]
  }'`,
    risk: `curl ${FRAUD}/api/risk-summary/u123 -H "X-API-Key: ${key}"`,
  };

  return (
    <div className="card" style={{marginTop:16}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h3 style={{margin:0}}>Open Banking & SaaS Layer</h3>
        <span className="badge">API Console</span>
      </div>
      <div className="muted" style={{marginTop:4}}>
        Use these public endpoints with your demo API key. For B2B integrations, provision per-client keys and rate limits server-side.
      </div>

      <div className="card" style={{marginTop:12}}>
        <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
          <div><b>API Key:</b></div>
          <code style={{padding:'4px 8px', background:'#f3f4f6', borderRadius:6}}>{key}</code>
          <button className="button" onClick={generate}>Generate New</button>
        </div>
        <div className="muted" style={{marginTop:6}}>Header: <code>X-API-Key: {key}</code> (demo-only; backend currently accepts requests without auth)</div>
      </div>

      <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12}}>
        <div className="card">
          <div style={{fontWeight:700}}>Alternate Credit Score</div>
          <div className="muted">POST {MAIN}/api/predict</div>
          <pre style={{whiteSpace:'pre-wrap'}}><code>{curl.credit}</code></pre>
        </div>
        <div className="card">
          <div style={{fontWeight:700}}>Fraud Insights: KYC</div>
          <div className="muted">POST {FRAUD}/api/kyc</div>
          <pre style={{whiteSpace:'pre-wrap'}}><code>{curl.kyc}</code></pre>
        </div>
        <div className="card">
          <div style={{fontWeight:700}}>Fraud Insights: Transactions</div>
          <div className="muted">POST {FRAUD}/api/transactions</div>
          <pre style={{whiteSpace:'pre-wrap'}}><code>{curl.txn}</code></pre>
        </div>
        <div className="card">
          <div style={{fontWeight:700}}>Risk Summary</div>
          <div className="muted">GET {FRAUD}/api/risk-summary/:user_id</div>
          <pre style={{whiteSpace:'pre-wrap'}}><code>{curl.risk}</code></pre>
        </div>
      </div>
    </div>
  );
}
