import React, { useEffect, useState } from 'react'
import { api } from './api'

export default function App() {
  const [status, setStatus] = useState('loading...')

  useEffect(() => {
    api.get('/api/health')
      .then(res => setStatus(`${res.status} - ${res.data.status}`))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div style={{ fontFamily: 'ui-sans-serif, system-ui', padding: 24 }}>
      <h1>MERN Starter</h1>
      <p>Backend health: {status}</p>
    </div>
  )
}
