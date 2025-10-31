import axios from 'axios';

const API = import.meta.env.VITE_FRAUD_API || 'http://localhost:4800';

export async function uploadCSV(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await axios.post(`${API}/api/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export default { uploadCSV };
