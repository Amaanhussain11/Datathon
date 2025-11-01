// Use configured mentor API if provided. In production, avoid falling back to localhost.
const API_FROM_ENV = import.meta.env.VITE_MENTOR_API;
const IS_PROD = import.meta.env.PROD;
const API = IS_PROD ? (API_FROM_ENV || '') : (API_FROM_ENV || 'http://localhost:4500');

export async function mentorChat(text, lang='hi', meta={}){
  try{
    if (!API) throw new Error('mentor api not configured');
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
    if (!API) return; // no-op if mentor API not configured
    const res = await fetch(`${API}/api/kb`);
    const data = await res.json();
    localStorage.setItem('kb_hindi', JSON.stringify(data));
  }catch{}
}
