// Robust name comparison without external deps
// - Normalizes with Unicode NFKC, lowercases, trims, collapses whitespace
// - Strips common honorifics
// - Handles initials (e.g., "A." compatible with "Amaan")
// - Uses a small Jaro-Winkler similarity implementation over token-sorted strings

const HONORIFICS = new Set([
  'mr','mrs','ms','miss','shri','smt','kumari','dr','prof','sir','madam'
]);

function unicodeNorm(s) {
  try { return s.normalize('NFKC'); } catch { return s; }
}
function collapseSpaces(s) {
  return s.replace(/\s+/g, ' ').trim();
}
function stripPunct(s) {
  return s.replace(/[.,\-_/\\]+/g, ' ');
}
function tokenize(name) {
  const s = collapseSpaces(stripPunct(unicodeNorm((name || '').toLowerCase())));
  return s.split(' ').filter(Boolean);
}
function stripHonorifics(tokens) {
  return tokens.filter(t => !HONORIFICS.has(t));
}
function normalizeTokens(tokens) {
  const noHonor = stripHonorifics(tokens);
  return noHonor.map(t => t.endsWith('.') ? t.slice(0, -1) : t);
}
function tokensToKey(tokens) {
  return tokens.slice().sort().join(' ');
}
function initialsCompatible(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  for (const t of a) {
    if (t.length === 1) {
      if (![...b].some(x => x && x.length > 1 && x[0] === t)) return false;
    }
  }
  for (const t of b) {
    if (t.length === 1) {
      if (![...a].some(x => x && x.length > 1 && x[0] === t)) return false;
    }
  }
  return true;
}

// Jaro similarity
function jaro(a, b) {
  if (a === b) return 1;
  const aLen = a.length; const bLen = b.length;
  if (!aLen || !bLen) return 0;
  const matchDist = Math.floor(Math.max(aLen, bLen) / 2) - 1;
  const aMatches = new Array(aLen).fill(false);
  const bMatches = new Array(bLen).fill(false);
  let matches = 0; let transpositions = 0;
  for (let i = 0; i < aLen; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, bLen);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true; bMatches[j] = true; matches++; break;
    }
  }
  if (matches === 0) return 0;
  let k = 0;
  for (let i = 0; i < aLen; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  const m = matches;
  const jaroScore = (m / aLen + m / bLen + (m - transpositions / 2) / m) / 3;
  return jaroScore;
}

// Jaro-Winkler similarity
function jaroWinkler(a, b, p = 0.1, maxL = 4) {
  const j = jaro(a, b);
  if (j <= 0.7) return j;
  let l = 0;
  const maxPref = Math.min(maxL, Math.min(a.length, b.length));
  while (l < maxPref && a[l] === b[l]) l++;
  return j + l * p * (1 - j);
}

// Extract likely name candidates from a long OCR text by scanning lines and
// generating sliding windows of 2-5 alphabetic tokens. Returns array of strings.
function ocrNameCandidates(longText, maxPerLine = 5) {
  const out = [];
  const seen = new Set();
  const lines = String(longText || '').split(/\r?\n+/);
  for (const line of lines) {
    const toks = tokenize(line).filter(t => /^[a-z]+$/i.test(t));
    if (toks.length === 0) continue;
    for (let size = 5; size >= 2; size--) {
      for (let i = 0; i + size <= toks.length; i++) {
        const win = toks.slice(i, i + size);
        const key = tokensToKey(normalizeTokens(win));
        if (!seen.has(key)) {
          seen.add(key);
          out.push(win.join(' '));
        }
      }
    }
    if (out.length >= maxPerLine) continue;
  }
  // Also add the best-looking single line (collapsed) as a fallback
  const collapsed = collapseSpaces(stripPunct(unicodeNorm(longText || '')));
  if (collapsed && !seen.has(collapsed)) out.push(collapsed);
  return out.slice(0, 100);
}

export function compareNames(profileName, docName, aliases = [], threshold = 0.80, logger = console) {
  const candidates = [profileName, ...aliases].filter(Boolean);

  // Build doc candidates: if docName seems like long OCR text, derive windows.
  const docStr = String(docName || '');
  const docIsLong = docStr.length > 80 || /\n/.test(docStr);
  const docCandidates = docIsLong ? ocrNameCandidates(docStr) : [docStr];

  // 1) Regex-tolerant early match: if tokens of the profile name appear in order
  // with minor noise (spaces/punct) between them, treat as a strong match.
  const makeTolerantRegex = (name) => {
    const toks = normalizeTokens(tokenize(name)).filter(Boolean);
    if (toks.length === 0) return null;
    // Allow up to 3 non-letters between tokens; require alpha tokens to appear in order
    const body = toks.map(t => t.replace(/[^a-z]/g, '')).filter(Boolean).join('[^a-z]{0,3}');
    if (!body) return null;
    try { return new RegExp(body, 'i'); } catch { return null; }
  };
  for (const cand of candidates) {
    const rx = makeTolerantRegex(cand);
    if (!rx) continue;
    for (const docCand of docCandidates) {
      const plain = collapseSpaces(stripPunct(unicodeNorm(String(docCand || '')))).replace(/\s+/g,'');
      const lettersOnly = plain.replace(/[^a-z]/gi, '');
      if (rx.test(lettersOnly)) {
        const score = 0.99; // strong regex hit
        const passed = score >= threshold;
        logger && logger.info && logger.info('[KYC:name] regex-match', {
          profileCandidates: candidates,
          testedWith: cand,
          threshold,
          bestScore: Number(score.toFixed(4)),
          matchedWith: cand,
          docMatchedFragment: docCand
        });
        return { passed, score, matchedWith: cand };
      }
    }
  }

  let best = { score: 0, candidate: null, docCandidate: null };

  for (const cand of candidates) {
    const candTokens = normalizeTokens(tokenize(cand));
    const candKey = tokensToKey(candTokens);

    for (const docCand of docCandidates) {
      const docTokens = normalizeTokens(tokenize(docCand));
      if (!initialsCompatible(candTokens, docTokens)) continue;
      const docKey = tokensToKey(docTokens);
      const score = jaroWinkler(candKey, docKey);
      if (score > best.score) best = { score, candidate: cand, docCandidate: docCand };
    }
  }

  const passed = best.score >= threshold;
  logger && logger.info && logger.info('[KYC:name] compare', {
    profileCandidates: candidates,
    docCandidates: docCandidates.slice(0, 5),
    threshold,
    bestScore: Number(best.score.toFixed(4)),
    matchedWith: best.candidate,
    docMatchedFragment: best.docCandidate
  });
  return { passed, score: best.score, matchedWith: best.candidate };
}

export default { compareNames };
