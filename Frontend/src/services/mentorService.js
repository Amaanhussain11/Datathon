const API = import.meta.env.VITE_MENTOR_API || 'http://localhost:4500';

export async function mentorChat(text, lang='hi', meta={}){
  try{
    const res = await fetch(`${API}/api/chat`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ text, lang, meta })
    });
    if(!res.ok) throw new Error('server error');
    return await res.json();
  }catch(err){
    // offline minimal fallback using cached KB
    const kb = JSON.parse(localStorage.getItem('kb_hindi')||'{"intents":{}}');
    const t = (text||'').toLowerCase();
    const pick = (k)=> kb.intents?.[k];
    let intent = 'fallback';
    if(/emi|installment|क़िस्त|किस्त/.test(t)) intent = 'emi_explain';
    else if(/loan|कर्ज/.test(t)) intent = 'loan_explain';
    else if(/invest|sip|निवेश/.test(t)) intent = 'investment_basic';
    else if(/score|cibil|स्कोर/.test(t)) intent = 'credit_score_explain';
    const tpl = pick(intent) || pick('fallback') || '...';
    return { answer: tpl, intent };
  }
}

export async function loadKB(){
  try{
    const res = await fetch(`${API}/api/kb`);
    const data = await res.json();
    localStorage.setItem('kb_hindi', JSON.stringify(data));
  }catch{}
}
