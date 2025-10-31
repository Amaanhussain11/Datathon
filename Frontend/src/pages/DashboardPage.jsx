import React, { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import FileUploader from '../components/FileUploader.jsx';
import Dashboard from '../components/Dashboard.jsx';
import { mockDashboardData } from '../services/mockData.js';
import UploadAndScore from '../components/UploadAndScore.jsx';
import MentorChatBox from '../components/MentorChatBox.jsx';
import FraudDashboardApp from '../fraud/App.jsx';
import GamesTab from './GamesTab.jsx';

export default function DashboardPage(){
  const [data, setData] = useState(mockDashboardData);
  const [activeTab, setActiveTab] = useState('dashboard');
  const onUploadData = (d) => {
    const newScore = d.creditScore ?? mockDashboardData.creditScore;
    const trends = [...mockDashboardData.altCreditTrends];
    trends[trends.length - 1] = newScore; // reflect latest score in last point
    const mapped = {
      creditScore: newScore,
      healthIndex: d.healthIndex ?? 8.7,
      availableCredit: 245000,
      monthlySavings: d.monthlySavings ?? 18500,
      savingsGoal: 20000,
      riskScore: d.riskScore ?? 'Low',
      altCreditTrends: trends,
      summary: d.summary ?? null,
      spendingBreakdown: (d.monthlySpending || []).map(x=>({ name: x.category||x.name, value: x.value }))
    };
    setData(mapped);
  };
  return (
    <div style={{display:'grid', gridTemplateColumns:'260px 1fr', gap:12}}>
      <Sidebar
        score={data.creditScore ?? mockDashboardData.creditScore}
        activeTab={activeTab}
        onSelect={setActiveTab}
      />
      <main>
        <Topbar />
        {/* Keep all panels mounted; toggle visibility to preserve state */}
        <section style={{display: activeTab==='dashboard' ? 'block' : 'none'}}>
          <FileUploader onData={onUploadData} />
          <Dashboard data={data} onOpenMentor={()=>setActiveTab('mentor')} />
        </section>
        <section style={{display: activeTab==='credit' ? 'block' : 'none'}}>
          <div className="card" style={{padding:0, background:'transparent'}}>
            <UploadAndScore />
          </div>
        </section>
        <section style={{display: activeTab==='mentor' ? 'block' : 'none'}}>
          <div className="card" style={{padding:0, background:'transparent'}}>
            <MentorChatBox />
          </div>
        </section>
        <section style={{display: activeTab==='fraud' ? 'block' : 'none'}}>
          <div className="card" style={{padding:0, background:'transparent'}}>
            <FraudDashboardApp />
          </div>
        </section>
        <section style={{display: activeTab==='games' ? 'block' : 'none'}}>
          <GamesTab />
        </section>
      </main>
    </div>
  );
}
