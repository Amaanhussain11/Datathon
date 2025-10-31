import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { extractText } from '../services/ocrService.js';
import { sha256File } from '../services/hashService.js';
import { store } from '../services/store.js';
import { compareNames } from '../utils/nameMatch.js';

  const router = Router();
  const upload = multer({ dest: 'uploads/' });

// Use shared store

// Extract PAN by tolerating OCR noise and common confusions
function extractPAN(rawText = '') {
  const text = (rawText || '').toUpperCase();
  const panStrict = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

  // 1) Sliding window over alphanumerics with positional coercion
  const alnum = text.replace(/[^A-Z0-9]/g, '');
  const coerce = (s) => {
    if (s.length !== 10) return null;
    const chars = s.split('');
    const mapDigitToLetter = { '0':'O','1':'I','2':'Z','5':'S','8':'B' };
    const mapLetterToDigit = { 'O':'0','I':'1','Z':'2','S':'5','B':'8' };
    // positions 0-4 letters
    for (let i=0;i<5;i++) {
      const c = chars[i];
      if (c >= '0' && c <= '9') {
        const rep = mapDigitToLetter[c];
        if (!rep) return null;
        chars[i] = rep;
      }
    }
    // positions 5-8 digits
    for (let i=5;i<9;i++) {
      const c = chars[i];
      if (c >= 'A' && c <= 'Z') {
        const rep = mapLetterToDigit[c];
        if (!rep) return null;
        chars[i] = rep;
      }
    }
    // position 9 letter
    if (chars[9] >= '0' && chars[9] <= '9') {
      const rep = mapDigitToLetter[chars[9]];
      if (!rep) return null;
      chars[9] = rep;
    }
    const out = chars.join('');
    return panStrict.test(out) ? out : null;
  };
  for (let i=0; i+10<=alnum.length; i++) {
    const win = alnum.slice(i, i+10);
    const fixed = coerce(win);
    if (fixed) return fixed;
  }

  // 2) Token approach as fallback (space-split + confusion mapping)
  const cleaned = text.replace(/[^A-Z0-9]/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(Boolean).concat([cleaned.replace(/\s+/g, '')]);
  const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/;
  const confuse = (s) => s
    .replace(/O/g, '0')
    .replace(/I/g, '1')
    .replace(/Z/g, '2')
    .replace(/S/g, '5')
    .replace(/B/g, '8');
  for (const t of tokens) {
    const m1 = t.match(panRegex);
    if (m1) return m1[0];
    const t2 = confuse(t);
    const m2 = t2.match(panRegex);
    if (m2) return m2[0];
  }
  return null;
}

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const user_id = req.body.user_id || 'anon';
    if (!req.file) return res.status(400).json({ message: 'file is required' });

    const absPath = path.resolve(req.file.path);
    const ocrText = await extractText(absPath);
    // Debug minimal log to help trace OCR quality
    if (process.env.DEBUG_KYC) console.log('KYC OCR len:', (ocrText||'').length);

    const extracted_pan = extractPAN(ocrText);
    const panValid = !!extracted_pan;
    const name = (req.body.name || '').trim();
    const aliases = Array.isArray(req.body.aliases)
      ? req.body.aliases.filter(Boolean)
      : (req.body.aliases ? [req.body.aliases] : []);
    const NAME_THRESHOLD = Number(process.env.KYC_NAME_THRESHOLD || '0.80');
    // Compare provided profile name against OCR text using normalized fuzzy match.
    const cmp = name
      ? compareNames(name, ocrText, aliases, NAME_THRESHOLD, console)
      : { passed: true, score: 0, matchedWith: null };
    const nameConsistent = !!cmp.passed;

    const hash = await sha256File(absPath);

    // Tamper heuristic: short OCR text is suspicious only if PAN not extracted
    const tamperSuspicious = ((ocrText || '').length < 30) && !extracted_pan;

    // Compute fraud score (0..1) from simple signals
    let kyc_fraud_score = 0;
    if (!panValid) kyc_fraud_score += 0.5;
    if (!nameConsistent) kyc_fraud_score += 0.3;
    if (tamperSuspicious) kyc_fraud_score += 0.2;
    kyc_fraud_score = Math.min(1, kyc_fraud_score);

    const alerts = [];
    if (!panValid) alerts.push('PAN format invalid');
    if (name && !nameConsistent) alerts.push('Name mismatch');
    if (tamperSuspicious) alerts.push('Possible image tampering (low OCR text)');

    const payload = {
      user_id,
      kyc_fraud_score,
      kyc_verified: kyc_fraud_score < 0.5,
      alerts,
      panValid,
      extracted_pan,
      hash,
      // Debug/trace fields for demo visibility
      kyc_name_score: Number((cmp?.score || 0).toFixed(4)),
      kyc_name_threshold: NAME_THRESHOLD,
      kyc_name_matched_with: cmp?.matchedWith || null
    };
    store.kyc.set(user_id, payload);

    // Cleanup temp file
    fs.unlink(absPath, () => {});

    res.json(payload);
  } catch (err) {
    res.status(500).json({ message: 'kyc processing failed', error: String(err?.message || err) });
  }
});

export default router;
