import axios from 'axios';

const API = import.meta.env.VITE_FRAUD_API || 'http://localhost:4800';

export async function uploadCSV(file) {
  const form = new FormData();
  form.append('file', file);
  // Let the browser set the correct multipart boundary header
  const { data } = await axios.post(`${API}/api/upload`, form);
  return data;
}

export default { uploadCSV };
