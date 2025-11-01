import { spawn } from 'child_process';
import path from 'path';

export async function runTxnModel(payload){
  // If ML is disabled, or python fails, compute a JS fallback
  const jsFallback = (p)=>{
    try{
      const txns = Array.isArray(p?.transactions) ? p.transactions : [];
      const amounts = txns.map(t=> Number(t?.amount)||0).filter(a=>a>0);
      const mean = amounts.length ? (amounts.reduce((a,b)=>a+b,0)/amounts.length) : 0;
      const variance = amounts.length ? (amounts.reduce((a,b)=> a + Math.pow(b-mean,2),0)/amounts.length) : 0;
      const std = Math.sqrt(variance);
      const absThreshold = 50000;
      const zThreshold = mean + 3*std;
      const bigThreshold = Math.max(absThreshold, zThreshold || 0);
      let cryptoCount=0, largeCount=0, maxZ=0;
      const alerts=[];
      for(const t of txns){
        const amt = Number(t?.amount)||0;
        const desc = String(t?.merchant||'');
        const ts = t?.ts;
        const isCrypto = /crypto|binance|coin|exchange/i.test(desc);
        if(isCrypto){ cryptoCount++; alerts.push(`Crypto txn: ₹${amt.toLocaleString?.()||amt} @ ${desc}`); }
        if(amt >= bigThreshold){ largeCount++; alerts.push(`Large txn: ₹${amt.toLocaleString?.()||amt} on ${ts||''}`); }
        const z = std? Math.abs((amt-mean)/std):0; if(z>maxZ) maxZ=z;
      }
      const zComponent = Math.min(1, maxZ/6);
      const cryptoComponent = cryptoCount>0 ? 0.4 : 0;
      const largeComponent = Math.min(1, Math.min(3, largeCount)*0.2);
      const score = Math.min(1, 0.5*zComponent + cryptoComponent + largeComponent);
      const stats = { avg: mean, last: amounts[amounts.length-1]||0 };
      return { transaction_risk_score: score, alerts, stats };
    }catch{
      return { transaction_risk_score: 0, alerts: [], stats: { avg:0, last:0 } };
    }
  };

  if (String(process.env.DISABLE_ML || '').toLowerCase() === 'true' || process.env.DISABLE_ML === '1') {
    return jsFallback(payload);
  }

  const script = process.env.PY_SCRIPT || path.resolve(process.cwd(), '../ml/detect_fraud.py');
  const python = process.env.PYTHON_BIN || 'python3';
  return new Promise((resolve)=>{
    try{
      const proc = spawn(python, [script, 'txn'], { stdio: ['pipe', 'pipe', 'pipe'] });
      let out=''; let err='';
      proc.stdout.on('data', d=> out += d.toString());
      proc.stderr.on('data', d=> err += d.toString());
      proc.on('error', ()=> { resolve(jsFallback(payload)); });
      proc.on('close', (code)=>{
        if(code!==0){ return resolve(jsFallback(payload)); }
        try{ const j = JSON.parse(out); resolve(j); }
        catch(e){ resolve(jsFallback(payload)); }
      });
      proc.stdin.write(JSON.stringify(payload));
      proc.stdin.end();
      // Safety timeout (8s)
      setTimeout(()=>{ try{ proc.kill('SIGKILL'); }catch{} resolve(jsFallback(payload)); }, 8000).unref();
    }catch{
      resolve(jsFallback(payload));
    }
  });
}

export default { runTxnModel };
