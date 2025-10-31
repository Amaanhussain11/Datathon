import axios from 'axios';

const API = import.meta.env.VITE_FRAUD_API || 'http://localhost:4800';

export async function uploadKyc(user_id, file, name='', aliases=null){
  const form = new FormData();
  form.append('user_id', user_id || 'anon');
  if (name) form.append('name', name);
  // aliases can be a string or array; support both
  if (aliases) {
    if (Array.isArray(aliases)) {
      for (const a of aliases) if (a) form.append('aliases', a);
    } else {
      form.append('aliases', aliases);
    }
  }
  form.append('file', file);
  const { data } = await axios.post(`${API}/api/kyc`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
}

export async function analyzeTransactions(user_id, transactions){
  const { data } = await axios.post(`${API}/api/transactions`, { user_id, transactions });
  return data;
}

export async function getRiskSummary(user_id){
  const { data } = await axios.get(`${API}/api/risk-summary/${encodeURIComponent(user_id)}`);
  return data;
}

export default { uploadKyc, analyzeTransactions, getRiskSummary };
