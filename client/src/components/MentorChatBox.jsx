import React, { useEffect, useRef, useState } from 'react'
import { mentorChat, loadKB } from '../services/mentorService.js'

export default function MentorChatBox() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mentor_hist') || '[]') } catch { return [] }
  })
  const [text, setText] = useState('EMI kya hota hai?')
  const listRef = useRef(null)

  useEffect(() => { loadKB() }, [])
  useEffect(() => { listRef.current?.scrollTo(0, listRef.current.scrollHeight) }, [items])
  useEffect(() => { localStorage.setItem('mentor_hist', JSON.stringify(items)) }, [items])

  const send = async (meta = {}) => {
    if (!text.trim()) return
    const mine = { who: 'user', text }
    setItems(x => [...x, mine])
    setText('')
    try {
      const res = await mentorChat(mine.text, 'hi', meta)
      setItems(x => [...x, { who: 'bot', text: res.answer, meta: res.meta || {} }])
    } catch (e) {
      setItems(x => [...x, { who: 'bot', text: 'Network issue. Try again or check mentor backend (port 4500).', meta: {} }])
    }
  }

  const sample = (k) => {
    if (k === 'emi') setText('EMI kya hota hai?')
    if (k === 'score') setText('Mera score kaise banta hai?')
    if (k === 'save') setText('Saving tips batao')
  }

  return (
    <div className="panel">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
        <h2 style={{margin:0}}>AI Mentor (Hindi/Hinglish)</h2>
        <span className="pill">API: http://localhost:4500</span>
      </div>
      <div className="row">
        <div className="col">
          <div className="score-card" style={{maxHeight:'50vh', overflow:'auto'}} ref={listRef}>
            {items.map((m,i)=> (
              <div key={i} style={{marginBottom:8}}>
                <div className="label" style={{opacity:.8}}>{m.who === 'user' ? 'You' : 'Mentor'}</div>
                <div className="panel" style={{padding:10, background:m.who==='user'? '#162033':'#111a2b'}}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="btn-group">
            <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type in Hindi/Hinglish" style={{flex:1}} />
            <button onClick={()=>send()}>Send</button>
          </div>
          <div className="btn-group">
            <button className="ghost" onClick={()=>sample('emi')}>EMI example</button>
            <button className="ghost" onClick={()=>sample('score')}>Explain score</button>
            <button className="ghost" onClick={()=>sample('save')}>Saving tips</button>
          </div>
        </div>
      </div>
    </div>
  )
}
