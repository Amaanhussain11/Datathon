import React, { useState } from 'react'
import ScoreCard from './ScoreCard.jsx'

const DEMOS = {
  salaried: {
    userId: 'demo_salaried',
    transactions: [
      { ts: '2025-07-01T10:00:00Z', amount: 80000, type: 'credit', merchant: 'ACME Corp', channel: 'Bank' },
      { ts: '2025-08-01T10:00:00Z', amount: 80000, type: 'credit', merchant: 'ACME Corp', channel: 'Bank' },
      { ts: '2025-09-01T10:00:00Z', amount: 80000, type: 'credit', merchant: 'ACME Corp', channel: 'Bank' },
      { ts: '2025-10-01T10:00:00Z', amount: 80000, type: 'credit', merchant: 'ACME Corp', channel: 'Bank' },
      { ts: '2025-10-02T13:00:00Z', amount: 1200, type: 'debit', merchant: 'GroceryMart', channel: 'Card' },
      { ts: '2025-10-05T18:00:00Z', amount: 900, type: 'debit', merchant: 'CafeBrew', channel: 'UPI' },
      { ts: '2025-10-09T15:00:00Z', amount: 3000, type: 'debit', merchant: 'ElectroShop', channel: 'Card' }
    ]
  },
  gig: {
    userId: 'demo_gig',
    transactions: [
      { ts: '2025-10-01T12:00:00Z', amount: 7500, type: 'credit', merchant: 'GigPlatform', channel: 'UPI' },
      { ts: '2025-10-03T20:00:00Z', amount: 1000, type: 'debit', merchant: 'FoodApp', channel: 'UPI' },
      { ts: '2025-10-06T23:00:00Z', amount: 700, type: 'debit', merchant: 'LateBites', channel: 'Card' },
      { ts: '2025-10-11T14:00:00Z', amount: 2500, type: 'debit', merchant: 'FuelStation', channel: 'Card' }
    ]
  },
  risky: {
    userId: 'demo_risky',
    transactions: [
      { ts: '2025-07-05T02:00:00Z', amount: 15000, type: 'credit', merchant: 'OddJobs', channel: 'Cash' },
      { ts: '2025-08-05T02:00:00Z', amount: 15000, type: 'credit', merchant: 'OddJobs', channel: 'Cash' },
      { ts: '2025-09-05T02:00:00Z', amount: 15000, type: 'credit', merchant: 'OddJobs', channel: 'Cash' },
      { ts: '2025-10-05T02:00:00Z', amount: 15000, type: 'credit', merchant: 'OddJobs', channel: 'Cash' },
      { ts: '2025-10-04T01:00:00Z', amount: 3000, type: 'debit', merchant: 'ClubNight', channel: 'Cash' },
      { ts: '2025-10-07T00:00:00Z', amount: 2000, type: 'debit', merchant: 'Bar', channel: 'Cash' },
      { ts: '2025-10-08T23:00:00Z', amount: 1500, type: 'debit', merchant: 'LateBites', channel: 'Cash' }
    ]
  }
}

export default function UploadAndScore() {
  const [jsonText, setJsonText] = useState(JSON.stringify(DEMOS.salaried, null, 2))
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [ocrInfo, setOcrInfo] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const SERVER = 'http://localhost:4000'

  const parseInput = () => {
    try {
      const obj = JSON.parse(jsonText)
      if (!obj.transactions || !Array.isArray(obj.transactions)) throw new Error('Provide an object with transactions[]')
      return obj
    } catch (e) {
      setError('Invalid JSON: ' + e.message)
      return null
    }
  }

  const callServer = async (mode='ml') => {
    const payload = parseInput()
    if (!payload) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`${SERVER}/api/predict`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, mode })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Server error')
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const extractFromImage = async () => {
    if (!imageFile) { setError('Select an image first'); return }
    setLoading(true)
    setError('')
    setOcrInfo('')
    try {
      const form = new FormData()
      form.append('image', imageFile)
      const res = await fetch(`${SERVER}/api/extract`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'OCR failed')
      if ((data.transactions || []).length === 0) {
        setOcrInfo('No transactions detected from image. You can edit the JSON manually.')
      } else {
        const payload = { userId: 'from_image', transactions: data.transactions }
        setJsonText(JSON.stringify(payload, null, 2))
        setOcrInfo(`Extracted ${data.transactions.length} transactions from image`)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel">
      <div className="row">
        <div className="col">
          <div className="btn-group">
            <button className="secondary" onClick={() => setJsonText(JSON.stringify(DEMOS.salaried, null, 2))}>Load Salaried</button>
            <button className="secondary" onClick={() => setJsonText(JSON.stringify(DEMOS.gig, null, 2))}>Load Gig</button>
            <button className="secondary" onClick={() => setJsonText(JSON.stringify(DEMOS.risky, null, 2))}>Load Risky</button>
            <span className="pill">Server: {SERVER}</span>
          </div>

          <div className="file-row">
            <div
              className={`dropzone ${dragOver ? 'dragover' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) setImageFile(f)
              }}
            >
              {imageFile ? (
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{overflow:'hidden', textOverflow:'ellipsis'}}>{imageFile.name}</span>
                  <button className="ghost" onClick={() => setImageFile(null)}>Clear</button>
                </div>
              ) : (
                <>
                  <div style={{fontWeight:600}}>Drag & drop a statement screenshot</div>
                  <div className="hint">or click to select an image</div>
                </>
              )}
              <input
                title="file"
                type="file"
                accept="image/*"
                onChange={e => setImageFile(e.target.files?.[0] || null)}
                style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer' }}
              />
            </div>
            <button disabled={loading || !imageFile} onClick={extractFromImage}>
              {loading ? (<span style={{display:'inline-flex', alignItems:'center', gap:8}}><span className="loader"></span>Extracting</span>) : 'Extract from Image'}
            </button>
          </div>

          <textarea value={jsonText} onChange={e => setJsonText(e.target.value)} rows={18} spellCheck={false} />
          <div className="btn-group">
            <button disabled={loading} onClick={() => callServer('ml')}>{loading ? 'Calculating…' : 'Calculate Score (ML)'}</button>
            <button className="ghost" disabled={loading} onClick={() => callServer('fallback')}>Calculate Score (Fallback)</button>
          </div>
          {loading && <p className="hint" style={{display:'inline-flex', alignItems:'center', gap:8}}><span className="loader"></span> Working…</p>}
          {error && <p className="error">{error}</p>}
          {ocrInfo && <p className="hint">{ocrInfo}</p>}
        </div>
        <div className="col">
          {result && <ScoreCard result={result} />}
        </div>
      </div>
    </div>
  )
}
