import React from 'react';
export default function CreditScoreCard({ score=742 }){
  return (
    <div className="card" style={{flex:1}}>
      <div style={{fontSize:12, opacity:0.8}}>Credit Score</div>
      <div style={{fontSize:32, fontWeight:800}}>{score}</div>
      <div className="muted">Excellent · +23 this month</div>
    </div>
  );
}
