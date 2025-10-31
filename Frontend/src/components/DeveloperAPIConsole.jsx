import React from 'react';
export default function DeveloperAPIConsole(){
  const rows = [
    { path: '/credit-score/api', status: 'Active' },
    { path: '/risk-insight/api', status: 'Active' },
    { path: '/financial-health/api', status: 'Beta' },
  ];
  return (
    <div className="card">
      <div style={{fontWeight:700, marginBottom:8}}>Developer API Console</div>
      <div style={{display:'grid', gap:8}}>
        {rows.map((r,i)=> (
          <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'#f7f7fb', borderRadius:8}}>
            <span><code>{r.path}</code></span>
            <span>{r.status}</span>
          </div>
        ))}
      </div>
      <div className="muted" style={{marginTop:8}}>View Documentation</div>
    </div>
  );
}
