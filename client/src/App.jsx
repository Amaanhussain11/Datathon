import React from 'react'
import UploadAndScore from './components/UploadAndScore.jsx'

export default function App() {
  return (
    <div className="container">
      <h1>Alternative Credit Scoring MVP</h1>
      <p>Paste JSON transactions or load a demo payload and calculate a score. The server forwards to the Python ML service by default, falling back to a deterministic scorer if unreachable.</p>
      <UploadAndScore />
    </div>
  )
}
