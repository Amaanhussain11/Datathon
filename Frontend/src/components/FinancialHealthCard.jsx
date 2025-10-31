import React from 'react';
export default function FinancialHealthCard({ healthIndex=8.7 }){
  return (
    <div className="card" style={{flex:1}}>
      <div style={{fontSize:12, opacity:0.8}}>Financial Health Index</div>
      <div style={{fontSize:28, fontWeight:800}}>{healthIndex}</div>
      <div className="muted">+0.3 this month</div>
    </div>
  );
}
