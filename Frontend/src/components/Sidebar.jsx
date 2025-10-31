import React from 'react';
import { BarChart3, CreditCard, ShieldCheck, Brain, Gamepad2, Code2, Leaf } from 'lucide-react';

export default function Sidebar({ score=742, activeTab='dashboard', onSelect=()=>{} }){
  return (
    <aside className="sidebar" style={{width:260, background:'#2b2261', color:'#fff', padding:16, borderRadius:16}}>
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:16}}>
        <div style={{width:28, height:28, borderRadius:8, background:'#7c4dff'}}/>
        <div>
          <div style={{fontWeight:700}}>FinclusiAI</div>
          <div style={{opacity:0.8, fontSize:12}}>Next Billion Users</div>
        </div>
      </div>
      <div style={{background:'#3b2aa1', padding:12, borderRadius:12, marginBottom:12}}>
        <div style={{fontSize:12, opacity:0.9}}>Credit Score</div>
        <div style={{fontSize:28, fontWeight:800}}>{score}</div>
        <div style={{fontSize:12, opacity:0.9}}>Excellent · +23 this month</div>
      </div>
      <nav style={{display:'grid', gap:8}}>
        <NavItem icon={<BarChart3 size={18}/>} label="Dashboard" active={activeTab==='dashboard'} onClick={()=>onSelect('dashboard')} />
        <NavItem icon={<CreditCard size={18}/>} label="Credit Scoring" active={activeTab==='credit'} onClick={()=>onSelect('credit')} />
        <NavItem icon={<Brain size={18}/>} label="AI Mentor" active={activeTab==='mentor'} onClick={()=>onSelect('mentor')} />
        <NavItem icon={<ShieldCheck size={18}/>} label="Fraud Detection" active={activeTab==='fraud'} onClick={()=>onSelect('fraud')} />
        <NavItem icon={<Gamepad2 size={18}/>} label="Finance Games" active={activeTab==='games'} onClick={()=>onSelect('games')} />
        <NavItem icon={<Code2 size={18}/>} label="API Console" active={false} onClick={()=>onSelect('api')} />
        <NavItem icon={<Leaf size={18}/>} label="Green Finance" active={false} onClick={()=>onSelect('green')} />
      </nav>
      <div style={{marginTop:16, padding:12, background:'#3b2aa1', borderRadius:12}}>
        <div style={{fontWeight:700}}>Upgrade to Pro</div>
        <div style={{fontSize:12, opacity:0.9}}>Unlock advanced features</div>
      </div>
      <div style={{marginTop:16, display:'flex', alignItems:'center', gap:8}}>
        <div style={{width:28, height:28, borderRadius:14, background:'#7c4dff'}}></div>
        <div>
          <div style={{fontWeight:600}}>Priya Sharma</div>
          <div style={{fontSize:12, opacity:0.8}}>Premium User</div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick }){
  return (
    <button onClick={onClick} style={{textAlign:'left', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background: active? '#4c3bd1' : 'transparent', border:'none', color:'#fff', cursor:'pointer'}}>
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
