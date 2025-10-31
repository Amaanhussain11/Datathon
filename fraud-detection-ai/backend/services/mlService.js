import { spawn } from 'child_process';
import path from 'path';

export async function runTxnModel(payload){
  const script = process.env.PY_SCRIPT || path.resolve(process.cwd(), '../ml/detect_fraud.py');
  const python = process.env.PYTHON_BIN || 'python';
  return new Promise((resolve, reject)=>{
    const proc = spawn(python, [script, 'txn'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out=''; let err='';
    proc.stdout.on('data', d=> out += d.toString());
    proc.stderr.on('data', d=> err += d.toString());
    proc.on('close', (code)=>{
      if(code!==0){ return reject(new Error(err || `txn exited ${code}`)); }
      try{ const j = JSON.parse(out); resolve(j); }
      catch(e){ reject(new Error('invalid JSON from python')); }
    });
    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
  });
}

export default { runTxnModel };
