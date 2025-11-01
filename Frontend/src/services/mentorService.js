// Use configured mentor API if provided. In production, avoid falling back to localhost.
const API_FROM_ENV = import.meta.env.VITE_MENTOR_API;
const IS_PROD = import.meta.env.PROD;
const API = IS_PROD ? (API_FROM_ENV || '') : (API_FROM_ENV || 'http://localhost:4500');

// Minimal offline knowledge base so the mentor can respond without a backend
const DEFAULT_KB = {
  intents: {
    emi_explain: 'EMI (Equated Monthly Installment) wo nishchit rashi hoti hai jo aap har mahine loan chukane ke liye dete ho. Isme principal + interest shamil hota hai.',
    loan_explain: 'Loan lene se pehle apni repayment capacity check karo. Interest rate, processing fee aur tenure dekhkar EMI calculate karo.',
    investment_basic: 'Investment ke liye SIP/Mutual Funds achha option hai. Har mahine chhoti rashi lagaao, long-term me compounding se fayda hota hai.',
    credit_score_explain: 'Credit score timely payments, credit utilization aur credit history par nirbhar hota hai. Humesha bills time par pay karo aur utilization 30% se kam rakho.',
    fallback: 'Is vishay par mere paas limited jankari hai. Apna sawal thoda aur detail me pucho ya doosra sawal try karo.'
  }
}

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
    const kb = JSON.parse(localStorage.getItem('kb_hindi')||JSON.stringify(DEFAULT_KB));
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
    if (!API) {
      // Seed offline KB if not present
      if (!localStorage.getItem('kb_hindi')) {
        localStorage.setItem('kb_hindi', JSON.stringify(DEFAULT_KB));
      }
      return;
    }
    const res = await fetch(`${API}/api/kb`);
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('kb_hindi', JSON.stringify(data));
    } else {
      // fallback to default if server returns error
      if (!localStorage.getItem('kb_hindi')) {
        localStorage.setItem('kb_hindi', JSON.stringify(DEFAULT_KB));
      }
    }
  }catch{
    if (!localStorage.getItem('kb_hindi')) {
      localStorage.setItem('kb_hindi', JSON.stringify(DEFAULT_KB));
    }
  }
}
