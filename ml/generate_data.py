"""
Generate demo payloads (3 users) and a synthetic dataset of ~2500 users with transactions.
Saves:
- ml/demo_payloads.json
- ml/data/synthetic_users.json
"""
import json
import os
import random
from datetime import datetime, timedelta, timezone

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

random.seed(42)


def iso(dt: datetime):
    return dt.replace(tzinfo=timezone.utc).isoformat().replace('+00:00', 'Z')


def gen_transactions(archetype: str):
    now = datetime(2025, 10, 15, 12, 0, 0, tzinfo=timezone.utc)
    tx = []
    if archetype == 'salaried':
        # 4 months of salary
        for m in range(7, 11):
            tx.append({"ts": iso(datetime(2025, m, 1, 10, 0, 0)), "amount": 80000, "type": "credit", "merchant": "ACME Corp", "channel": "Bank"})
        # spends
        for day in [2, 5, 9, 12, 16]:
            tx.append({"ts": iso(datetime(2025, 10, day, 13, 0, 0)), "amount": random.randint(500, 3000), "type": "debit", "merchant": random.choice(["GroceryMart","CafeBrew","Pharmacy","FuelStation"]), "channel": random.choice(["Card","UPI"])})
    elif archetype == 'gig':
        for i in range(20):
            dt = now - timedelta(days=random.randint(0, 60))
            amt = random.randint(4000, 12000)
            tx.append({"ts": iso(dt), "amount": amt, "type": "credit", "merchant": "GigPlatform", "channel": "UPI"})
        for i in range(12):
            dt = now - timedelta(days=random.randint(0, 45), hours=random.randint(0, 23))
            amt = random.randint(300, 3000)
            tx.append({"ts": iso(dt), "amount": amt, "type": "debit", "merchant": random.choice(["FoodApp","Market","FuelStation","CafeBrew"]), "channel": random.choice(["Card","UPI"])})
    else:  # risky
        for m in range(7, 11):
            tx.append({"ts": iso(datetime(2025, m, 5, 2, 0, 0)), "amount": 15000, "type": "credit", "merchant": "OddJobs", "channel": "Cash"})
        for i in range(15):
            dt = now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 6))
            amt = random.randint(500, 4000)
            tx.append({"ts": iso(dt), "amount": amt, "type": "debit", "merchant": random.choice(["ClubNight","Bar","LateBites"]), "channel": "Cash"})
    return tx


def make_demo_payloads():
    return {
        "salaried": {"userId": "demo_salaried", "transactions": gen_transactions('salaried')},
        "gig": {"userId": "demo_gig", "transactions": gen_transactions('gig')},
        "risky": {"userId": "demo_risky", "transactions": gen_transactions('risky')},
    }


def generate_synthetic_users(n=2500):
    users = []
    for i in range(n):
        archetype = random.choices(['salaried','gig','risky'], weights=[0.45, 0.35, 0.2])[0]
        uid = f"user_{i:05d}_{archetype}"
        users.append({"userId": uid, "transactions": gen_transactions(archetype)})
    return users


def main():
    demos = make_demo_payloads()
    with open(os.path.join(os.path.dirname(__file__), 'demo_payloads.json'), 'w') as f:
        json.dump(demos, f, indent=2)
    users = generate_synthetic_users(2500)
    with open(os.path.join(DATA_DIR, 'synthetic_users.json'), 'w') as f:
        json.dump(users, f)
    print('Wrote demo_payloads.json and data/synthetic_users.json')


if __name__ == '__main__':
    main()
