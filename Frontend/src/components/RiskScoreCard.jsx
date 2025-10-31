import React from 'react';
export default function RiskScoreCard({ riskScore='Low' }){
  return (
    <div className="card" style={{flex:1}}>
      <div style={{fontSize:12, opacity:0.8}}>Risk Score</div>
      <div style={{fontSize:28, fontWeight:800}}>{riskScore}</div>
      <div className="muted">Verified Safe</div>
    </div>
  );
}
