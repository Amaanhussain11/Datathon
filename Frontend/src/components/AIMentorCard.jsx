import React from 'react';
export default function AIMentorCard({ onChat }){
  return (
    <div className="card" style={{color:'#111'}}>
      <div style={{fontWeight:700, marginBottom:8}}>AI Mentor</div>
      <div className="muted" style={{marginBottom:8, color:'#4b5563'}}>
        "Based on your spending pattern, you can save an additional ₹2,200 this month by optimizing your food delivery expenses."
      </div>
      <div className="muted" style={{color:'#4b5563'}}>
        "You're eligible for a personal loan at 9.5% interest. This is 2% lower than market average."
      </div>
      <div style={{marginTop:12}}>
        <button className="button" onClick={()=>onChat && onChat()}>Chat with AI Mentor</button>
      </div>
    </div>
  );
}
