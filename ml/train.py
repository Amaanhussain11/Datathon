"""
Train XGBoost model on synthetic data using features.py
Saves models/xgb_model.joblib (model, feature_names)
"""
import json
import os
from joblib import dump
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier
from features import compute_features

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, 'data', 'synthetic_users.json')
MODEL_DIR = os.path.join(BASE_DIR, 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURES = ['monthly_avg_income','income_volatility','ontime_pct','cash_ratio','merchant_diversity','night_txn_ratio']


def label_user(feat):
    # Heuristic label: good if decent income, low volatility, low cash ratio, mostly daytime
    score = 0
    score += min(1.0, feat['monthly_avg_income'] / 60000)
    score += max(0, 0.8 - feat['income_volatility'])
    score += feat['ontime_pct']
    score += max(0, 0.6 - feat['cash_ratio'])
    score += min(1.0, feat['merchant_diversity'] / 8)
    score += max(0, 0.7 - feat['night_txn_ratio'])
    # Normalize roughly into 0..1, threshold
    prob = score / 5.4
    return 1 if prob > 0.55 else 0


def main():
    with open(DATA_PATH, 'r') as f:
        users = json.load(f)

    rows = []
    y = []
    for u in users:
        feats = compute_features(u['transactions'])
        rows.append([feats[k] for k in FEATURES])
        y.append(label_user(feats))

    X = pd.DataFrame(rows, columns=FEATURES)
    y = np.array(y)

    # Validation split to avoid overconfidence
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = XGBClassifier(
        n_estimators=60,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_lambda=1.5,
        reg_alpha=0.0,
        random_state=42,
        eval_metric='logloss',
        use_label_encoder=False
    )
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False
    )

    pred_proba_tr = model.predict_proba(X_train)[:, 1]
    pred_proba_val = model.predict_proba(X_val)[:, 1]
    auc_tr = roc_auc_score(y_train, pred_proba_tr)
    auc_val = roc_auc_score(y_val, pred_proba_val)
    print(f"Train ROC AUC: {auc_tr:.4f} | Val ROC AUC: {auc_val:.4f}")

    dump({ 'model': model, 'features': FEATURES }, os.path.join(MODEL_DIR, 'xgb_model.joblib'))
    print('Saved model to models/xgb_model.joblib')


if __name__ == '__main__':
    main()
