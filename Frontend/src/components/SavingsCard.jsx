import React from 'react';
export default function SavingsCard({ monthlySavings=18500, savingsGoal=20000 }){
  return (
    <div className="card" style={{flex:1}}>
      <div style={{fontSize:12, opacity:0.8}}>Monthly Savings</div>
      <div style={{fontSize:28, fontWeight:800}}>₹{monthlySavings.toLocaleString()}</div>
      <div className="muted">Goal: ₹{savingsGoal.toLocaleString()}</div>
    </div>
  );
}
