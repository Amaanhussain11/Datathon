import mongoose from 'mongoose';

const UserRiskSchema = new mongoose.Schema({
  user_id: { type: String, index: true },
  kyc: {
    kyc_fraud_score: Number,
    kyc_verified: Boolean,
    alerts: [String],
    panValid: Boolean,
    hash: String,
    createdAt: { type: Date, default: Date.now }
  },
  transactions: {
    transaction_risk_score: Number,
    alerts: [String],
    stats: { avg: Number, last: Number },
    createdAt: { type: Date, default: Date.now }
  },
  summary: {
    total_risk_score: Number,
    alerts: [String],
    createdAt: { type: Date, default: Date.now }
  }
}, { timestamps: true });

export default mongoose.models.UserRisk || mongoose.model('UserRisk', UserRiskSchema);
