import React, { useState } from 'react';
import { uploadKyc } from '../api.js';

export default function KycUpload(){
  const [userId, setUserId] = useState('u123');
  const [name, setName] = useState('Aman Kumar');
  const [aliases, setAliases] = useState(''); // comma-separated optional aliases
  const [file, setFile] = useState(null);
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if(!file) return;
    setLoading(true);
    try{
      const aliasList = aliases
        .split(',')
        .map(s=>s.trim())
        .filter(Boolean);
      const out = await uploadKyc(userId, file, name, aliasList.length ? aliasList : null);
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
        <div style={{display:'grid', gridTemplateColumns:'1fr', gap:8, margin:'8px 0'}}>
          <input className="input" value={aliases} onChange={e=>setAliases(e.target.value)} placeholder="Aliases (optional, comma-separated)" />
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
            {typeof res.kyc_name_score === 'number' && typeof res.kyc_name_threshold === 'number' && (
              <span className="badge">
                name: {res.kyc_name_score >= res.kyc_name_threshold ? 'Matched' : 'Not matched'}
              </span>
            )}
          </div>
          <div className="muted" style={{marginTop:6}}>hash: <code>{(res.hash||'').slice(0,16)}{res.hash? '…':''}</code></div>
          {res.alerts?.length>0 && (
            <div style={{marginTop:8}}>
              <div style={{fontWeight:600, marginBottom:6}}>Alerts</div>
              <ul style={{margin:0, paddingLeft:18}}>
                {(res.alerts || [])
                  .filter(a => {
                    if (a !== 'Name mismatch') return true;
                    // suppress Name mismatch if backend score passes threshold
                    if (typeof res.kyc_name_score === 'number' && typeof res.kyc_name_threshold === 'number')
                      return !(res.kyc_name_score >= res.kyc_name_threshold);
                    return true;
                  })
                  .map((a,i)=>(<li key={i}>{a}</li>))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
