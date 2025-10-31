"""
FastAPI server exposing POST /predict
Loads xgb_model.joblib, computes features, SHAP contributions, and maps to score/tier.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import FastAPI
from pydantic import BaseModel
try:
    # When running as a package: uvicorn ml.serve:app
    from .features import compute_features  # type: ignore
except Exception:
    # When running from inside ml/: uvicorn serve:app
    from features import compute_features

FEATURES = ['monthly_avg_income','income_volatility','ontime_pct','cash_ratio','merchant_diversity','night_txn_ratio']

app = FastAPI()

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'xgb_model.joblib')
OBJ = None
EXPLAINER = None

class Txn(BaseModel):
    ts: str
    amount: float
    type: str
    merchant: str | None = None
    channel: str | None = None

class PredictIn(BaseModel):
    userId: str | None = 'demo'
    transactions: list[Txn]


def prob_to_score(prob: float) -> int:
    prob = max(0.0, min(1.0, prob))
    return int(round(300 + prob * (850 - 300)))


def score_to_tier(score: int) -> str:
    if score >= 720: return 'Gold'
    if score >= 640: return 'Silver'
    return 'Bronze'


@app.on_event('startup')
def load_model():
    global OBJ, EXPLAINER
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError('Model artifact not found. Run train.py first.')
    OBJ = joblib.load(MODEL_PATH)
    model = OBJ['model']
    EXPLAINER = shap.TreeExplainer(model)


@app.post('/predict')
async def predict(payload: PredictIn):
    feats = compute_features([t.dict() for t in payload.transactions])
    X = pd.DataFrame([[feats[k] for k in FEATURES]], columns=FEATURES)
    model = OBJ['model']
    proba = float(model.predict_proba(X)[:,1][0])
    score = prob_to_score(proba)
    tier = score_to_tier(score)

    # SHAP contributions
    # TreeExplainer returns numpy array; pick first row
    sv = EXPLAINER.shap_values(X)
    try:
        sv_row = sv[0]
    except Exception:
        sv_row = sv
    shap_scale = 40.0
    contribs = []
    for name, val in zip(FEATURES, sv_row):
        points = int(round(float(val) * shap_scale))
        contribs.append({
            'feature': name,
            'shap': float(val),
            'points': points,
            'description': f"{name} {('+' if points>=0 else '')}{points}"
        })
    # top 6 by absolute points
    contribs.sort(key=lambda x: abs(x['points']), reverse=True)
    contribs = contribs[:6]

    return {
        'userId': payload.userId or 'demo',
        'score': score,
        'tier': tier,
        'prob_good': round(proba, 4),
        'contributions': contribs,
        'features': feats,
        'summary': [f"{('+' if c['points']>=0 else '')}{c['points']} {c['feature']}" for c in contribs]
    }
