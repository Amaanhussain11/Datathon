import React from 'react';
import KycUpload from './components/KycUpload.jsx';
import RiskDashboard from './components/RiskDashboard.jsx';

export default function App(){
  return (
    <div className="app-shell">
      <div className="header">
        <div>
          <h2 style={{margin:0}}>Fraud Detection Dashboard</h2>
          <div className="muted" style={{marginTop:6}}>KYC verification, transaction anomaly detection, and combined risk summary.</div>
        </div>
      </div>

      <div className="grid grid-2">
        <KycUpload />
        <RiskDashboard />
      </div>
    </div>
  );
}
