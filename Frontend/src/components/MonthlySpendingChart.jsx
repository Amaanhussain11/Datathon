import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#7c4dff','#22c55e','#f59e0b','#3b82f6'];

export default function MonthlySpendingChart({ data=[{"name":"Food & Dining","value":35},{"name":"Transportation","value":20},{"name":"Shopping","value":25},{"name":"Utilities","value":20}] }){
  return (
    <div className="card">
      <div style={{fontWeight:700, marginBottom:8}}>Monthly Spending Analysis</div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
