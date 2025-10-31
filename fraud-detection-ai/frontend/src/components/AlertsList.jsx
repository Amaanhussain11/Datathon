import React from 'react';
export default function AlertsList({ alerts }){
  if(!alerts || alerts.length===0) return null;
  return (
    <div style={{marginTop:8}}>
      <div style={{fontWeight:600, marginBottom:6}}>Alerts</div>
      <ul style={{margin:0, paddingLeft:18}}>
        {alerts.map((a,i)=>(<li key={i}>{a}</li>))}
      </ul>
    </div>
  );
}
