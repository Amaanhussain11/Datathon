import React, { useState } from 'react'
import UploadAndScore from './components/UploadAndScore.jsx'
import MentorChatBox from './components/MentorChatBox.jsx'

export default function App() {
  const [tab, setTab] = useState('score')
  return (
    <div className="container">
      <h1>Alternative Credit Scoring MVP</h1>
      <p>Paste JSON transactions or load a demo payload and calculate a score. Or switch to the AI Mentor for Hindi/Hinglish guidance.</p>

      <div className="btn-group" style={{marginTop:12}}>
        <button className={tab==='score'? '': 'ghost'} onClick={()=>setTab('score')}>Scoring</button>
        <button className={tab==='mentor'? '': 'ghost'} onClick={()=>setTab('mentor')}>AI Mentor (Hindi)</button>
      </div>

      {tab === 'score' ? (
        <UploadAndScore />
      ) : (
        <MentorChatBox />
      )}
    </div>
  )
}
