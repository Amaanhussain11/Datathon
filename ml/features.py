"""
Python feature extractor mirroring server/src/utils/featureExtractor.js
Features: monthly_avg_income, income_volatility, ontime_pct, cash_ratio, merchant_diversity, night_txn_ratio
"""
from datetime import datetime
from collections import defaultdict
from math import sqrt

def parse_iso(ts):
    try:
        return datetime.fromisoformat(ts.replace('Z', '+00:00'))
    except Exception:
        return None


def month_key(dt: datetime):
    return f"{dt.year}-{dt.month:02d}"


def compute_features(transactions):
    if not transactions:
        return {
            "monthly_avg_income": 0.0,
            "income_volatility": 0.0,
            "ontime_pct": 0.0,
            "cash_ratio": 0.0,
            "merchant_diversity": 0.0,
            "night_txn_ratio": 0.0,
        }

    parsed = []
    for t in transactions:
        dt = parse_iso(t.get("ts", ""))
        if not dt:
            continue
        amt = float(t.get("amount", 0) or 0)
        typ = "credit" if t.get("type") == "credit" else "debit"
        merchant = (t.get("merchant") or "").strip()
        channel = (t.get("channel") or "").strip()
        parsed.append({"dt": dt, "amount": amt, "type": typ, "merchant": merchant, "channel": channel})

    if not parsed:
        return compute_features([])

    credits_by_month = defaultdict(float)
    merchants_by_month = defaultdict(set)

    cash_debit = 0.0
    total_debit = 0.0
    night_count = 0
    total_count = 0
    daytime_count = 0

    for t in parsed:
        total_count += 1
        hour = t["dt"].hour
        is_night = hour < 6 or hour >= 22
        if is_night:
            night_count += 1
        else:
            daytime_count += 1

        if t["type"] == "debit":
            total_debit += abs(t["amount"])
            if t["channel"].lower() == "cash":
                cash_debit += abs(t["amount"])
        else:
            mk = month_key(t["dt"])
            credits_by_month[mk] += max(0.0, t["amount"])

        mk2 = month_key(t["dt"])
        merchants_by_month[mk2].add(t["merchant"])

    credit_months = list(credits_by_month.values())
    if credit_months:
        mean = sum(credit_months) / len(credit_months)
        var = sum((v - mean) ** 2 for v in credit_months) / len(credit_months)
        stddev = sqrt(var)
        monthly_avg_income = mean
        income_volatility = (stddev / mean) if mean > 0 else 0.0
    else:
        monthly_avg_income = 0.0
        income_volatility = 0.0

    months_covered = len(merchants_by_month) or 1
    total_unique_merchants = sum(len(s) for s in merchants_by_month.values())
    merchant_diversity = (total_unique_merchants / months_covered) if months_covered else 0.0

    cash_ratio = (cash_debit / total_debit) if total_debit > 0 else 0.0
    night_txn_ratio = (night_count / total_count) if total_count > 0 else 0.0
    ontime_pct = (daytime_count / total_count) if total_count > 0 else 0.0

    return {
        "monthly_avg_income": round(monthly_avg_income, 2),
        "income_volatility": round(income_volatility, 4),
        "ontime_pct": round(ontime_pct, 4),
        "cash_ratio": round(cash_ratio, 4),
        "merchant_diversity": round(merchant_diversity, 2),
        "night_txn_ratio": round(night_txn_ratio, 4),
    }
