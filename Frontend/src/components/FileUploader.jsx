import React, { useState } from 'react';
import Papa from 'papaparse';
import { uploadCSV } from '../services/api.js';

export default function FileUploader({ onData }){
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onFile = (f) => {
    setFile(f);
    if (!f) return setPreview([]);
    setError('');
    setSuccess('');
    // Basic extension check
    if (!/\.csv$/i.test(f.name || '')) {
      setError('Please select a .csv file.');
      return;
    }
    Papa.parse(f, {
      header: true,
      complete: (results) => {
        setPreview(results.data.slice(0, 5));
      },
    });
  };

  const onUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try{
      const data = await uploadCSV(file);
      onData && onData(data);
      setSuccess('Upload successful. Dashboard updated.');
    } finally {
      setLoading(false);
    }
  };

  const onUploadSafe = async () => {
    try {
      await onUpload();
    } catch (e) {
      console.error('Upload failed:', e);
      setError(String(e?.response?.data?.message || e?.message || 'Upload failed'));
    }
  };

  return (
    <div className="card">
      <div style={{fontWeight:700, marginBottom:8}}>Upload 6-Month Bank Statement (CSV)</div>
      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <input className="file" type="file" accept=".csv" onChange={e=>onFile(e.target.files?.[0]||null)} />
        <button className="button" onClick={onUploadSafe} disabled={!file || loading}>{loading? 'Uploading...' : 'Upload'}</button>
      </div>
      {preview.length>0 && (
        <div className="muted" style={{marginTop:8}}>
          Previewing first {preview.length} rows
        </div>
      )}
      {success && <div style={{marginTop:8, color:'#16a34a'}}>{success}</div>}
      {error && <div style={{marginTop:8, color:'#dc2626'}}>{error}</div>}
    </div>
  );
}
