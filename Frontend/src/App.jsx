import React, { useState } from 'react'
import UploadAndScore from './components/UploadAndScore.jsx'
import MentorChatBox from './components/MentorChatBox.jsx'
import FraudDashboardApp from './fraud/App.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

export default function App() {
  const [tab, setTab] = useState('score')
  return (
    <div className="container">
      <h1>Alternative Credit Scoring MVP</h1>
      <p>Paste JSON transactions or load a demo payload and calculate a score. Or switch to the AI Mentor for Hindi/Hinglish guidance.</p>

      <div className="btn-group" style={{marginTop:12}}>
        <button className={tab==='score'? '': 'ghost'} onClick={()=>setTab('score')}>Scoring</button>
        <button className={tab==='mentor'? '': 'ghost'} onClick={()=>setTab('mentor')}>AI Mentor (Hindi)</button>
        <button className={tab==='fraud'? '': 'ghost'} onClick={()=>setTab('fraud')}>Fraud Detection</button>
        <button className={tab==='dashboard'? '': 'ghost'} onClick={()=>setTab('dashboard')}>Financial Dashboard</button>
      </div>

      {tab === 'score' && <UploadAndScore />}
      {tab === 'mentor' && <MentorChatBox />}
      {tab === 'fraud' && <FraudDashboardApp />}
      {tab === 'dashboard' && <DashboardPage />}
    </div>
  )
}
