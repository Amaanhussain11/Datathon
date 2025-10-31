// Simple shared in-memory store across routes
export const store = {
  kyc: new Map(), // user_id -> kyc payload
  txn: new Map(), // user_id -> txn payload
};

export default store;
