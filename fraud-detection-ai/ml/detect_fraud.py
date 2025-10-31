#!/usr/bin/env python3
import sys, json, os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

# Optional OCR
try:
    import pytesseract
    from PIL import Image
except Exception:
    pytesseract = None
    Image = None

ROOT = os.path.dirname(__file__)
MODEL_PATH = os.path.join(ROOT, 'isolation_model.pkl')
SEED_CSV = os.path.join(ROOT, 'sample_transactions.csv')


def ensure_model():
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    # train quick model on seed or synthetic data
    if os.path.exists(SEED_CSV):
        df = pd.read_csv(SEED_CSV)
    else:
        # synthetic: normal amounts around 500-2000
        rng = np.random.default_rng(42)
        df = pd.DataFrame({
            'amount': rng.normal(1500, 400, 500).clip(10, 10000),
            'freq': rng.integers(1, 10, 500),
        })
    X = df[['amount']].values
    clf = IsolationForest(random_state=42, contamination=0.05)
    clf.fit(X)
    joblib.dump(clf, MODEL_PATH)
    return clf


def txn_mode(stdin_data: str):
    try:
        payload = json.loads(stdin_data or '{}')
    except Exception:
        payload = {}
    tx = payload.get('transactions', [])
    amounts = []
    for t in tx:
        try:
            amounts.append(float(t.get('amount', 0)))
        except Exception:
            amounts.append(0.0)
    if len(amounts) == 0:
        print(json.dumps({ 'transaction_risk_score': 0.0, 'alerts': ['No transactions provided'] }))
        return
    clf = ensure_model()
    X = np.array(amounts).reshape(-1,1)
    pred = clf.decision_function(X)  # higher is less anomalous
    # convert to risk: negative -> higher risk
    risk_vals = (-pred - pred.min()) / (pred.max() - pred.min() + 1e-9)
    risk = min(1.0, max(0.0, float(np.mean(risk_vals))))
    alerts = []
    if risk > 0.7:
        alerts.append('High anomaly risk detected (IsolationForest)')
    # simple behavior stats for summary
    avg = float(np.mean(amounts)) if amounts else 0.0
    last = float(amounts[-1]) if amounts else 0.0
    out = { 'transaction_risk_score': risk, 'alerts': alerts, 'stats': { 'avg': avg, 'last': last } }
    print(json.dumps(out))


def ocr_mode(img_path: str):
    if pytesseract is None or Image is None:
        print(json.dumps({ 'text': '' }))
        return
    try:
        img = Image.open(img_path)
        # Basic preprocessing: to grayscale and upscale for better OCR of small text
        img = img.convert('L')
        w, h = img.size
        if w < 1000:
            img = img.resize((int(w*1.8), int(h*1.8)))
        # Tesseract config: assume PAN is uppercase letters and digits
        config = "--oem 1 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        text = pytesseract.image_to_string(img, config=config)
    except Exception:
        text = ''
    print(json.dumps({ 'text': (text or '').upper() }))


def main():
    if len(sys.argv) < 2:
        print(json.dumps({ 'error': 'mode required' }))
        return
    mode = sys.argv[1]
    if mode == 'txn':
        data = sys.stdin.read()
        txn_mode(data)
    elif mode == 'ocr':
        img_path = sys.argv[2] if len(sys.argv) > 2 else ''
        ocr_mode(img_path)
    else:
        print(json.dumps({ 'error': 'unknown mode' }))

if __name__ == '__main__':
    main()
