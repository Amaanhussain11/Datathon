import React from 'react';
export default function SecuritySection({
  style,
  riskTier = 'Low',
  volatility = 0,
  cashRatio = 0,
  upiPct = 0,
  alertsCount = 0,
}){
  const items = [
    { label: 'Account Security', status: riskTier === 'High' ? 'Warning' : 'Secure' },
    { label: 'Biometric Auth', status: 'Active' },
    { label: 'Unusual Activity', status: `${alertsCount} ${alertsCount===1?'Alert':'Alerts'}` },
  ];
  return (
    <div className="card" style={{ color:'#111', ...style }}>
      <div style={{fontWeight:700, marginBottom:8}}>Security & Fraud Detection</div>
      <div style={{display:'grid', gap:8}}>
        {items.map((it,i)=> (
          <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'#f7f7fb', borderRadius:8, color:'#111'}}>
            <span>{it.label}</span>
            <span style={{fontWeight:700}}>{it.status}</span>
          </div>
        ))}
      </div>
      <div className="muted" style={{marginTop:8, color:'#4b5563'}}>
        View Security Report · Risk: <b>{riskTier}</b> · Volatility: <b>{volatility}</b> · Cash Ratio: <b>{cashRatio}%</b> · UPI: <b>{upiPct}%</b>
      </div>
    </div>
  );
}
