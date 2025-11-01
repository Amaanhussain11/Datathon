import React, { useMemo, useState } from 'react'

// Hardcoded API key and examples (frontend-only; no backend calls)
const DEMO_API_KEY = 'sk_test_7dA2xP3bC9L1mN0q'

const Card = ({ title, subtitle, children, className='' }) => (
  <div className={`card ${className}`} style={{ padding: 16 }}>
    {title && (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{title}</div>
        {subtitle && <div className="muted" style={{ fontSize: 12 }}>{subtitle}</div>}
      </div>
    )}
    {children}
  </div>
)

const Code = ({ children }) => (
  <pre style={{
    whiteSpace: 'pre-wrap',
    background: '#0b1020',
    color: '#e6edf3',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    lineHeight: 1.35,
    overflowX: 'auto',
  }}>
    <code>{children}</code>
  </pre>
)

const Section = ({ icon, title, path, method, description, exampleRequest, exampleResponse, disabledTry = true }) => {
  const [open, setOpen] = useState(true)
  return (
    <Card>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <div>
            <div style={{ fontWeight: 700 }}>{title}</div>
            <div className="muted" style={{ fontSize: 12 }}>{method} {path}</div>
          </div>
        </div>
        <button className="button" onClick={()=>setOpen(o=>!o)}>{open ? 'Hide' : 'Show'}</button>
      </div>

      <div className="muted" style={{ marginBottom: 10 }}>{description}</div>

      {open && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {exampleRequest && (
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom:4 }}>Example Request</div>
              <Code>{exampleRequest}</Code>
            </div>
          )}
          {exampleResponse && (
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom:4 }}>Example Response</div>
              <Code>{exampleResponse}</Code>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 10, display:'flex', gap:8, alignItems:'center' }}>
        <button className="button" disabled={disabledTry} title={disabledTry ? 'Mock only' : 'Try it'}>
          {disabledTry ? 'Try It (Mock)' : 'Try It'}
        </button>
        <span className="muted" style={{ fontSize: 12 }}>Coming soon: interactive mock requests</span>
      </div>
    </Card>
  )
}

export default function OpenBankingAPIPage(){
  const [copied, setCopied] = useState(false)

  const scoreReq = useMemo(()=>`
GET /credit-score/api HTTP/1.1
Host: api.example.com
Authorization: Bearer ${DEMO_API_KEY}
Content-Type: application/json
`,[])

  const scoreRes = useMemo(()=>`
{
  "user_id": "USR12345",
  "alt_credit_score": 742,
  "score_band": "Good",
  "last_updated": "2025-11-01T10:30:00Z"
}
`, [])

  const riskReq = useMemo(()=>`
POST /risk-insight/api HTTP/1.1
Host: api.example.com
Authorization: Bearer ${DEMO_API_KEY}
Content-Type: application/json

{
  "aadhaar": "XXXX-XXXX-1234",
  "pan": "ABCDE1234F",
  "bank_activity_score": 88
}
`, [])

  const riskRes = useMemo(()=>`
{
  "fraud_risk_level": "Low",
  "flagged": false,
  "insight_id": "INS-98237"
}
`, [])

  const accReq = useMemo(()=>`
GET /account-summary/api HTTP/1.1
Host: api.example.com
Authorization: Bearer ${DEMO_API_KEY}
Content-Type: application/json
`, [])

  const accRes = useMemo(()=>`
{
  "total_credits": 540000,
  "total_debits": 502000,
  "average_balance": 38000
}
`, [])

  const copy = async () => {
    try{
      await navigator.clipboard.writeText(DEMO_API_KEY)
      setCopied(true)
      setTimeout(()=>setCopied(false), 1200)
    }catch{}
  }

  return (
    <div className="panel" style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Open Banking & SaaS Layer</h2>
          <div className="muted" style={{ marginTop: 4 }}>
            Design your platform as a service layer (API) that banks or NBFCs can integrate.
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ℹ️ Use these APIs to access alternate credit score, risk insights, and other fintech utilities.</div>
        </div>
      </div>

      {/* API Key Card */}
      <Card title="API Key" subtitle="Use this key to authenticate your API requests">
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <code style={{ padding:'6px 10px', background:'#f3f4f6', borderRadius: 6 }}>{DEMO_API_KEY}</code>
          <button className="button" onClick={copy}>{copied? 'Copied' : 'Copy'}</button>
          <button className="button" disabled title="Regenerate coming soon">Regenerate</button>
        </div>
      </Card>

      {/* Endpoints */}
      <div className="grid" style={{ gridTemplateColumns:'1fr', gap: 12, marginTop: 12 }}>
        <Section
          icon="🧠"
          title="Alternate Credit Score"
          method="GET"
          path="/credit-score/api"
          description="Returns an alternate credit score using transaction and behavioral data."
          exampleRequest={scoreReq}
          exampleResponse={scoreRes}
        />

        <Section
          icon="🛡️"
          title="Risk Insight / Fraud Detection"
          method="POST"
          path="/risk-insight/api"
          description="Detects fraudulent KYC or suspicious transaction patterns."
          exampleRequest={riskReq}
          exampleResponse={riskRes}
        />

        <Section
          icon="📊"
          title="Account Summary"
          method="GET"
          path="/account-summary/api"
          description="Fetches aggregated transaction summary for the last 6 months."
          exampleRequest={accReq}
          exampleResponse={accRes}
        />
      </div>

      {/* Optional mock playground (simple, non-interactive) */}
      <Card title="Mock API Playground" subtitle="Prototype only — no network calls">
        <div className="muted" style={{ marginBottom: 6 }}>Enter a sample payload and click Send to preview a mock response.</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Code>{`// Request (sample)
POST /risk-insight/api
Authorization: Bearer ${DEMO_API_KEY}
Content-Type: application/json

{ "aadhaar": "XXXX-XXXX-1234", "pan": "ABCDE1234F" }`}</Code>
          <Code>{`// Response (sample)
{
  "fraud_risk_level": "Low",
  "flagged": false,
  "insight_id": "INS-98237"
}`}</Code>
        </div>
      </Card>
    </div>
  )
}
