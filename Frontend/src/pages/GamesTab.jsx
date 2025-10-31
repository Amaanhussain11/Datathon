import React, { useMemo, useState } from 'react';

// Financial Literacy Gamified Learning Zone (3 Levels)
// Self-contained UI-only module. No backend changes.
export default function GamesTab(){
  // Define 3 levels, each with specific lessons
  const levels = useMemo(() => ([
    {
      id: 1,
      title: 'Level 1 · Foundations',
      lessons: [
        { id: 101, title: 'Budget Basics 💰', desc: 'Plan your monthly spending wisely.' },
        { id: 102, title: 'Smart Saving Goals 🎯', desc: 'Set achievable saving goals.' },
      ],
    },
    {
      id: 2,
      title: 'Level 2 · Safety & Credit',
      lessons: [
        { id: 201, title: 'Avoiding Online Scams 🔒', desc: 'Recognize and avoid common frauds.' },
        { id: 202, title: 'Understanding Credit Scores 📈', desc: 'Learn what impacts your score.' },
      ],
    },
    {
      id: 3,
      title: 'Level 3 · Investing',
      lessons: [
        { id: 301, title: 'Investment Essentials 📊', desc: 'Basics of compounding and risk.' },
      ],
    },
  ]), []);

  // Local state only; persisted while mounted by DashboardPage
  const [points, setPoints] = useState(0);
  const [activeLesson, setActiveLesson] = useState(null);
  const [completed, setCompleted] = useState(new Set());

  // Quiz questions mapped to lesson IDs
  const questions = {
    101: { q: 'What is the 50/30/20 rule?', options: [
      { t: '50% needs, 30% wants, 20% savings', correct: true },
      { t: '50% savings, 30% wants, 20% needs' },
      { t: '33% each for all categories' },
    ]},
    102: { q: 'Best way to hit a saving goal?', options: [
      { t: 'Automate a monthly transfer to savings', correct: true },
      { t: 'Save only leftover cash' },
      { t: 'Borrow for savings' },
    ]},
    201: { q: 'Which is a scam red flag?', options: [
      { t: 'Urgent messages asking for OTP', correct: true },
      { t: 'Bank emails from verified domain' },
      { t: 'Two-factor authentication prompts' },
    ]},
    202: { q: 'Improving credit score involves…', options: [
      { t: 'Paying bills on time', correct: true },
      { t: 'Maxing out credit every month' },
      { t: 'Missing EMIs occasionally' },
    ]},
    301: { q: 'Compounding means…', options: [
      { t: 'Earning returns on your returns', correct: true },
      { t: 'Guaranteed profits with no risk' },
      { t: 'Only for the stock market' },
    ]},
  };

  const totalLessons = levels.reduce((a,l)=>a + l.lessons.length, 0);
  const progressPct = Math.min(100, Math.round((completed.size / totalLessons) * 100));

  // Unlock logic: next level unlocked if all previous level lessons completed
  const isLevelUnlocked = (levelIndex) => {
    if (levelIndex === 0) return true;
    const prev = levels[levelIndex - 1];
    return prev.lessons.every(les => completed.has(les.id));
  };

  // Badge after completing all three levels, based on total points
  let finalBadge = null; // shows only when all lessons completed
  if (completed.size === totalLessons) {
    if (points >= 50) finalBadge = '🥇 Gold FinHero';
    else if (points >= 40) finalBadge = '🥈 Silver FinHero';
    else finalBadge = '🥉 Bronze FinHero';
  }

  const startLesson = (id) => setActiveLesson(id);
  const answer = (isCorrect, id) => {
    if (isCorrect) {
      setPoints(p => p + 10);
      setCompleted(prev => new Set(prev).add(id));
    }
    setActiveLesson(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Financial Literacy Game Zone</h1>
      <p className="text-gray-600 mb-6">
        Learn smart finance habits through interactive mini-lessons and earn rewards as you progress!
      </p>

      <div className="card" style={{marginBottom:12}}>
        <div style={{display:'flex', gap:16, alignItems:'center', flexWrap:'wrap'}}>
          <div><b>Total Points:</b> {points} XP</div>
          <div><b>Progress:</b> {progressPct}%</div>
          {finalBadge && <div><b>Badge:</b> {finalBadge}</div>}
        </div>
        <div style={{marginTop:8}}>
          <div className="muted" style={{marginBottom:6}}>Overall Progress</div>
          <div style={{width:'100%', background:'#e5e7eb', height:10, borderRadius:6}}>
            <div style={{width:`${progressPct}%`, background:'#7c4dff', height:10, borderRadius:6}}></div>
          </div>
        </div>
      </div>

      {levels.map((lvl, idx) => {
        const unlocked = isLevelUnlocked(idx);
        const lvlDone = lvl.lessons.every(les => completed.has(les.id));
        return (
          <div key={lvl.id} className="card" style={{marginBottom:12, opacity: unlocked?1:0.6}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
              <h2 style={{fontWeight:800}}>{lvl.title}</h2>
              <div>
                {lvlDone ? <span className="badge">Level Complete ✓</span> : unlocked ? <span className="badge">Unlocked</span> : <span className="badge">Locked</span>}
              </div>
            </div>
            <div className="grid" style={{display:'grid', gridTemplateColumns:'1fr', gap:12}}>
              {lvl.lessons.map(lesson => (
                <div key={lesson.id} className="card" style={{display:'grid', gap:8}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h3 style={{fontWeight:700}}>{lesson.title}</h3>
                    {completed.has(lesson.id) && <span className="badge">Completed ✓</span>}
                  </div>
                  <p className="muted">{lesson.desc}</p>
                  <div style={{display:'flex', gap:8}}>
                    <button className="button" disabled={!unlocked} onClick={()=>startLesson(lesson.id)}>{unlocked? 'Start Lesson' : 'Locked'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Simple modal */}
      {activeLesson && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50}}>
          <div className="card" style={{maxWidth:520, width:'90%', background:'#fff'}}>
            <div style={{fontWeight:800, marginBottom:8}}>Lesson Quiz</div>
            <div style={{marginBottom:8}}>{questions[activeLesson]?.q}</div>
            <div style={{display:'grid', gap:8}}>
              {questions[activeLesson]?.options?.map((o, idx)=>(
                <button key={idx} className="button" onClick={()=>answer(!!o.correct, activeLesson)}>{o.t}</button>
              ))}
            </div>
            <div style={{marginTop:10}}>
              <button className="button ghost" onClick={()=>setActiveLesson(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
