import React from 'react';
import { Bell } from 'lucide-react';

export default function Topbar(){
  return (
    <header style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
      <div>
        <div style={{fontSize:22, fontWeight:800}}>Financial Dashboard</div>
        <div style={{opacity:0.8}}>Welcome back, Priya! Your financial health is improving.</div>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <input placeholder="Search transactions, insight" className="input" style={{minWidth:260}}/>
        <button className="button ghost"><Bell size={18}/></button>
        <button className="button">+ Add Account</button>
      </div>
    </header>
  );
}
