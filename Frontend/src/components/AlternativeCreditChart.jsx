import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AlternativeCreditChart({ trends=[700,725,740,760,780,800] }){
  const data = ['Jan','Feb','Mar','Apr','May','Jun'].map((m,i)=>({ name: m, value: trends[i]||0 }));
  return (
    <div className="card" style={{gridColumn:'1 / span 2'}}>
      <div style={{fontWeight:700, marginBottom:8}}>Alternative Credit Score Analysis</div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#7c4dff" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div style={{display:'flex', gap:24, marginTop:12}}>
        <div><b>85%</b> UPI Patterns</div>
        <div><b>92%</b> Digital Behavior</div>
        <div><b>78%</b> Spending Habits</div>
      </div>
    </div>
  );
}
