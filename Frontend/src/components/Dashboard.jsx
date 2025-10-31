import React from 'react';
import FinancialHealthCard from './FinancialHealthCard.jsx';
import SavingsCard from './SavingsCard.jsx';
import RiskScoreCard from './RiskScoreCard.jsx';
import AlternativeCreditChart from './AlternativeCreditChart.jsx';
import MonthlySpendingChart from './MonthlySpendingChart.jsx';
import SecuritySection from './SecuritySection.jsx';
import GamesSection from './GamesSection.jsx';
import DeveloperAPIConsole from './DeveloperAPIConsole.jsx';
import AIMentorCard from './AIMentorCard.jsx';
import CreditScoreCard from './CreditScoreCard.jsx';

export default function Dashboard({ data, onOpenMentor }){
  const { creditScore, healthIndex, monthlySavings, savingsGoal, riskScore, altCreditTrends, spendingBreakdown, summary } = data;
  // Derive props for Security & Games from available data
  const volatility = summary?.volatility ?? 0;
  const cashRatio = summary?.cash_ratio ?? 0;
  const upiPct = summary?.upi_pct ?? 0;
  const riskTier = riskScore || 'Medium';
  const alertsCount = riskTier === 'High' || volatility >= 1 ? 1 : 0;

  const goal = savingsGoal || 20000;
  const p = Math.max(0, Math.min(1, (monthlySavings || 0) / goal));
  const level = Math.max(1, Math.min(5, Math.ceil(p * 5)));
  const xp = Math.max(50, Math.round(p * 500));
  const tip = p < 0.3
    ? 'Try setting aside 10% of monthly inflows as savings auto-transfer.'
    : p < 0.7
      ? 'Good progress! Consolidate subscriptions and optimize food spends.'
      : 'Great job! Consider short-term debt payoff or emergency fund boost.';
  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
      <CreditScoreCard score={creditScore} />
      <FinancialHealthCard healthIndex={healthIndex}/>
      <SavingsCard monthlySavings={monthlySavings} savingsGoal={savingsGoal}/>
      <RiskScoreCard riskScore={riskScore}/>
      <AlternativeCreditChart trends={altCreditTrends}/>
      {summary && (
        <div className="card" style={{gridColumn:'1 / span 3', display:'flex', gap:24, flexWrap:'wrap'}}>
          <div><b>Avg Income:</b> ₹{(summary.avg_income||0).toLocaleString()}</div>
          <div><b>Volatility:</b> {summary.volatility}</div>
          <div><b>UPI %:</b> {summary.upi_pct}%</div>
          <div><b>Cash Ratio:</b> {summary.cash_ratio}%</div>
          <div><b>Merchant Diversity:</b> {summary.merchant_diversity}</div>
        </div>
      )}
      <AIMentorCard onChat={onOpenMentor} />
      <MonthlySpendingChart data={spendingBreakdown}/>
      <SecuritySection style={{color:'#111'}} riskTier={riskTier} volatility={volatility} cashRatio={cashRatio} upiPct={upiPct} alertsCount={alertsCount} />
      <GamesSection style={{color:'#111'}} level={level} xp={xp} tip={tip} />
      <DeveloperAPIConsole />
    </div>
  );
}
