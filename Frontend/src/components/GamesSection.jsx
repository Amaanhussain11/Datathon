import React from 'react';
export default function GamesSection({ style, level=3, xp=200, tip='Learn budgeting basics' }){
  return (
    <div className="card" style={{ color:'#111', ...style }}>
      <div style={{fontWeight:700, marginBottom:8}}>Financial Literacy Games</div>
      <div style={{display:'grid', gap:8}}>
        <div style={{display:'flex', justifyContent:'space-between', padding:'10px 12px', background:'#f7f7fb', borderRadius:8, color:'#111'}}>
          <div>Budget Master</div>
          <div>Level {level} · +{xp} XP</div>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', padding:'10px 12px', background:'#f7f7fb', borderRadius:8, color:'#111'}}>
          <div>Investment Hero</div>
          <div><button className="button">Play</button></div>
        </div>
        <div style={{padding:'8px 12px', color:'#4b5563'}}>{tip}</div>
      </div>
    </div>
  );
}
