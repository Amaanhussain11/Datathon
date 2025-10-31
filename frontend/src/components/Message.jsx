import React from 'react';
export default function Message({ who, text, meta }){
  return (
    <div className={`msg ${who}`}>
      <div>{text}</div>
      {meta?.contributions && meta.contributions.length>0 && (
        <div style={{marginTop:8}}>
          <div className="meta">Top factors</div>
          {meta.contributions.slice(0,3).map((c,i)=>{
            const pct = Math.max(0, Math.min(1, Math.abs(c.points))); 
            return (
              <div key={i} style={{margin:'6px 0'}}>
                <div className="meta">{c.feature}: {c.points.toFixed ? c.points.toFixed(2) : c.points}</div>
                <div className="bar"><div className="fill" style={{width:`${pct*100}%`}}/></div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
