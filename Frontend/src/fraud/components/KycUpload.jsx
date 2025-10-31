import React, { useState } from 'react';
import { uploadKyc } from '../api.js';

export default function KycUpload(){
  const [userId, setUserId] = useState('u123');
  const [name, setName] = useState('Aman Kumar');
  const [file, setFile] = useState(null);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if(!file) return;
    setLoading(true);
    try{
      const out = await uploadKyc(userId, file, name);
      setRes(out);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{marginTop:0}}>KYC Verification</h3>
      <form onSubmit={onSubmit}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, margin:'8px 0'}}>
          <input className="input" value={userId} onChange={e=>setUserId(e.target.value)} placeholder="User ID" />
          <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Full Name (optional)" />
        </div>
        <div style={{display:'flex', gap:8, margin:'8px 0', alignItems:'center'}}>
          <input className="file" type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} />
          <button className="button" disabled={!file || loading} type="submit">{loading?'Checking...':'Upload & Verify'}</button>
        </div>
      </form>
      {res && (
        <div className="card" style={{marginTop:8}}>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
            <span className="badge">fraud: {res.kyc_fraud_score}</span>
            <span className="badge">status: {res.kyc_verified? 'Verified':'Suspicious'}</span>
            <span className="badge">PAN: {String(res.panValid)}</span>
          </div>
          <div className="muted" style={{marginTop:6}}>hash: <code>{(res.hash||'').slice(0,16)}{res.hash? '…':''}</code></div>
          {res.alerts?.length>0 && (
            <div style={{marginTop:8}}>
              <div style={{fontWeight:600, marginBottom:6}}>Alerts</div>
              <ul style={{margin:0, paddingLeft:18}}>
                {res.alerts.map((a,i)=>(<li key={i}>{a}</li>))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
