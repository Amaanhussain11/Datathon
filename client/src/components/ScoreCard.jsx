import React from 'react'

export default function ScoreCard({ result }) {
  const { score, tier, prob_good, contributions = [] } = result

  const maxAbs = Math.max(10, ...contributions.map(c => Math.abs(c.value || c.points)))

  return (
    <div className="score-card">
      <div className="score">{score}</div>
      <div className={`tier ${tier.toLowerCase()}`}>{tier}</div>
      <div className="prob">Prob good: {(prob_good * 100).toFixed(1)}%</div>
      <h3>Contributions</h3>
      <div className="bars">
        {contributions.map((c, idx) => {
          const val = c.value ?? c.points ?? 0
          const width = Math.round((Math.abs(val) / maxAbs) * 100)
          return (
            <div key={idx} className={`bar-row ${val >= 0 ? 'pos' : 'neg'}`}>
              <span className="label">{c.feature}</span>
              <div className="bar"><div className="fill" style={{ width: `${width}%` }} /></div>
              <span className="val">{val >= 0 ? '+' : ''}{val}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
