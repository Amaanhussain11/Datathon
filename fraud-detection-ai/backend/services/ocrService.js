import { spawn } from 'child_process';
import path from 'path';

// Uses Python (pytesseract) via detect_fraud.py to OCR an image
export async function extractText(imagePath){
  const script = process.env.PY_SCRIPT || path.resolve(process.cwd(), '../ml/detect_fraud.py');
  const python = process.env.PYTHON_BIN || 'python';
  return new Promise((resolve, reject)=>{
    const proc = spawn(python, [script, 'ocr', imagePath], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out=''; let err='';
    proc.stdout.on('data', d=> out += d.toString());
    proc.stderr.on('data', d=> err += d.toString());
    proc.on('close', (code)=>{
      if(code!==0){ return reject(new Error(err || `ocr exited ${code}`)); }
      try{ const j = JSON.parse(out); resolve(j.text || ''); }
      catch(e){ resolve(''); }
    });
  });
}

export default { extractText };
