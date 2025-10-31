import React, { useEffect, useRef, useState } from 'react';
import { chat, loadKB } from '../services/chatService.js';
import Message from './Message.jsx';
import VoiceToggle from './VoiceToggle.jsx';

export default function ChatBox(){
  const [items, setItems] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('chat_hist')||'[]'); }catch{ return []; }
  });
  const [text, setText] = useState('EMI kya hota hai?');
  const [voice, setVoice] = useState(false);
  const lastBot = items?.slice().reverse().find(x=>x.who==='bot');
  const listRef = useRef(null);

  useEffect(()=>{ loadKB(); },[]);
  useEffect(()=>{ listRef.current?.scrollTo(0, listRef.current.scrollHeight); }, [items]);
  useEffect(()=>{ localStorage.setItem('chat_hist', JSON.stringify(items)); }, [items]);

  const send = async (meta={}) => {
    if(!text.trim()) return;
    const mine = { who:'user', text };
    setItems(x=>[...x, mine]);
    setText('');
    try {
      const res = await chat(mine.text, 'hi', meta);
      setItems(x=>[...x, { who:'bot', text: res.answer, meta: res.meta||{} }]);
    } catch (e) {
      setItems(x=>[...x, { who:'bot', text: 'Network issue. Offline reply not available yet. Try again in a moment.', meta:{} }]);
    }
  };

  const loadSample = (which) => {
    if(which==='emi') setText('EMI kya hota hai?');
    if(which==='score') setText('Mera score kaise banta hai?');
    if(which==='simulate') setText('Mera score improve kaise ho sakta hai?');
  };

  const pasteFeatures = async () => {
    const val = prompt('Paste features JSON (keys: monthly_avg_income, income_volatility, ontime_pct, cash_ratio, merchant_diversity, night_txn_ratio)');
    if(!val) return;
    try{ const features = JSON.parse(val); send({ features }); }catch{ alert('Invalid JSON'); }
  };

  return (
    <div className="card">
      <div className="header">
        <h2 style={{margin:0}}>AI Financial Mentor (Hindi)</h2>
        <VoiceToggle enabled={voice} setEnabled={setVoice} lastText={lastBot?.text} />
      </div>
      <div className="row">
        <div className="list" ref={listRef}>
          {items.map((m,i)=>(<Message key={i} who={m.who} text={m.text} meta={m.meta} />))}
        </div>
        <div>
          <div style={{display:'flex', gap:8}}>
            <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type your question in Hindi/Hinglish" />
            <button onClick={()=>send()}>Send</button>
          </div>
          <div style={{display:'flex', gap:8, marginTop:8}}>
            <button className="ghost" onClick={()=>loadSample('emi')}>EMI example</button>
            <button className="ghost" onClick={()=>loadSample('score')}>Explain score</button>
            <button className="ghost" onClick={()=>loadSample('simulate')}>Simulate improvement</button>
            <button onClick={pasteFeatures}>Paste features JSON</button>
          </div>
        </div>
      </div>
    </div>
  );
}
