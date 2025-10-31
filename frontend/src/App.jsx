import React from 'react';
import ChatBox from './components/ChatBox.jsx';
import './styles.css';

export default function App(){
  return (
    <div className="container">
      <h1>Finance Mentor</h1>
      <p className="sub">Offline-first Hindi/Hinglish chatbot for EMI, loans, savings, credit score basics.</p>
      <ChatBox />
    </div>
  );
}
