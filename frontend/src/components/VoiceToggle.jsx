import React, { useEffect, useRef } from 'react';
export default function VoiceToggle({ enabled, setEnabled, lastText }){
  const synthRef = useRef(window.speechSynthesis || null);
  useEffect(()=>{
    if(!enabled || !lastText) return;
    const utter = new SpeechSynthesisUtterance(lastText);
    utter.lang = 'hi-IN';
    synthRef.current?.speak(utter);
  },[enabled,lastText]);
  return (
    <button className="ghost" onClick={()=>setEnabled(!enabled)}>{enabled?'Voice: On':'Voice: Off'}</button>
  );
}
