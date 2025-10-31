# Alternative Credit Scoring Engine MVP

Demo-ready project with three services:

- `server/` — Node/Express API exposing `POST /api/predict` with ML-forwarding and deterministic fallback.
- `ml/` — Python FastAPI microservice with XGBoost + SHAP exposing `POST /predict`.
- `client/` — Vite + React frontend to paste or load demo payloads and visualize score and contributions.

All components are lightweight and designed to be demoable in under 5 hours.

## Project Structure
```
/server
  package.json
  src/
    index.js
    routes/predict.js
    utils/featureExtractor.js
    utils/scoreMapper.js
    utils/seedDemo.js
  .env.example
/client
  package.json
  index.html
  vite.config.js
  src/
    main.jsx
    App.jsx
    components/UploadAndScore.jsx
    components/ScoreCard.jsx
    styles.css
/ml
  requirements.txt
  generate_data.py
  features.py
  train.py
  serve.py
  models/xgb_model.joblib    # produced by train.py
  demo_payloads.json
```

## Prerequisites
- Node.js 18+
- Python 3.10+
- npm (or yarn/pnpm)

## Quick Start

1) Start the ML service (recommended for full demo)
```bash
cd ml
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python generate_data.py
python train.py   # creates models/xgb_model.joblib
uvicorn serve:app --reload --port 8000
```

2) Start the Node server
```bash
cd server
cp .env.example .env
# (optional) edit ML_SERVICE_URL, default http://127.0.0.1:8000
npm install
npm run dev  # http://localhost:4000
```

3) Start the React client
```bash
cd client
npm install
npm run dev  # http://localhost:5173
```

Open the client and click one of the demo buttons (Salaried/Gig/Risky), then "Calculate Score (ML)".

## API Overview

### Node server — POST `/api/predict`
Request body:
```json
{
  "userId": "demo_salaried",
  "transactions": [{"ts":"2025-10-01T10:00:00Z","amount":80000,"type":"credit","merchant":"ACME","channel":"Bank"}],
  "mode": "ml"  // or "fallback"
}
```
Response body (example):
```json
{
  "userId": "demo_salaried",
  "score": 728,
  "tier": "Gold",
  "prob_good": 0.81,
  "contributions": [{"feature":"monthly_avg_income","value":42,"description":"Stable monthly income +42"}],
  "features": {"monthly_avg_income":80000, ...},
  "summary": ["+42 Stable monthly income", "-12 Cash spending ratio"]
}
```

### Python ML — POST `/predict`
Accepts the same shape, returns the same structure, with SHAP-derived `contributions` (points scaled by ~40x).

## Curl Examples

Call ML service directly (after training):
```bash
curl -X POST "http://127.0.0.1:8000/predict" \
  -H "Content-Type: application/json" \
  -d @ml/demo_payloads.json
```

Call Node server (forward to ML by default):
```bash
curl -X POST "http://127.0.0.1:4000/api/predict" \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo_salaried","transactions":[{"ts":"2025-10-01T10:00:00Z","amount":80000,"type":"credit","merchant":"ACME","channel":"Bank"}]}'
```

Force fallback mode:
```bash
curl -X POST "http://127.0.0.1:4000/api/predict" \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo_salaried","mode":"fallback","transactions":[{"ts":"2025-10-01T10:00:00Z","amount":80000,"type":"credit","merchant":"ACME","channel":"Bank"}]}'
```

## Demo Script (3–4 steps)
- **Start services**: ML (`uvicorn serve:app --port 8000`), Server (`npm run dev`), Client (`npm run dev`).
- **Load a demo**: In the client, click "Load Salaried".
- **Calculate**: Click "Calculate Score (ML)" — show score, tier, and contributions.
- **Fallback**: Stop ML or pick "Calculate Score (Fallback)" to demo deterministic scoring.

## Notes
- Server env var: `ML_SERVICE_URL` controls where the Node server forwards `/api/predict` requests.
- Fallback mode: set `mode":"fallback"` in request, or let the server fallback automatically if ML is unreachable.
- Features are consistent across Node and Python: `['monthly_avg_income','income_volatility','ontime_pct','cash_ratio','merchant_diversity','night_txn_ratio']`.

## Commit messages (suggested)
- feat(server): add predict route and deterministic scorer fallback
- feat(ml): add data generator and train script
- feat(client): add upload and score UI
- docs: add README and run instructions
# Datathon
