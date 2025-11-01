import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Uses Python (pytesseract) via detect_fraud.py to OCR an image
export async function extractText(imagePath){
  // Allow disabling OCR completely via env to avoid Python deps in production
  if (String(process.env.DISABLE_OCR || '').toLowerCase() === 'true' || process.env.DISABLE_OCR === '1') {
    return '';
  }
  try {
    // Prefer explicit env if provided
    let script = process.env.PY_SCRIPT || '';
    if (!script) {
      // Try multiple likely locations relative to backend cwd in Render
      const cwd = process.cwd();
      const candidates = [
        path.resolve(cwd, '../../ml/detect_fraud.py'), // repoRoot/ml from fraud-detection-ai/backend
        path.resolve(cwd, '../ml/detect_fraud.py'),    // fraud-detection-ai/ml
        path.resolve(cwd, 'ml/detect_fraud.py'),       // cwd/ml
      ];
      const found = candidates.find(p => {
        try { return fs.existsSync(p); } catch { return false; }
      });
      script = found || '';
    }

    // If script not found, gracefully degrade with empty text
    if (!script) {
      console.warn('[ocrService] Python script not found. Skipping OCR.');
      return '';
    }

    const python = process.env.PYTHON_BIN || 'python3';
    return new Promise((resolve)=>{
      const proc = spawn(python, [script, 'ocr', imagePath], { stdio: ['ignore', 'pipe', 'pipe'] });
      let out=''; let err='';
      proc.stdout.on('data', d=> out += d.toString());
      proc.stderr.on('data', d=> err += d.toString());
      proc.on('error', () => { resolve(''); });
      proc.on('close', (code)=>{
        if(code!==0){
          console.warn('[ocrService] OCR process failed:', err || `exit ${code}`);
          return resolve('');
        }
        try{ const j = JSON.parse(out); resolve(j.text || ''); }
        catch(e){ resolve(''); }
      });
      // Safety timeout (10s)
      setTimeout(() => { try { proc.kill('SIGKILL'); } catch {} resolve(''); }, 10000).unref();
    });
  } catch {
    return '';
  }
}

export default { extractText };
