const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function chat(text, lang='hi', meta={}){
  try{
    const res = await fetch(`${API}/api/chat`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text, lang, meta})});
    if(!res.ok) throw new Error('server error');
    return await res.json();
  }catch(err){
    // offline fallback: minimal detect using cached KB
    const kb = JSON.parse(localStorage.getItem('kb_hindi')||'{"intents":{}}');
    const t = (text||'').toLowerCase();
    const pick = (k)=> kb.intents?.[k];
    const contains = (s)=> t.includes(s);
    let intent = 'fallback';
    if(/emi|installment/.test(t)) intent = 'emi_explain';
    else if(/loan|karr?z/.test(t)) intent = 'loan_explain';
    else if(/invest|sip/.test(t)) intent = 'investment_basic';
    else if(/score|cibil/.test(t)) intent = 'credit_score_explain';
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
