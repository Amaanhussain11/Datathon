// Simple EMI calculator (rule-based, deterministic)
// P: principal (number)
// r_percent: annual interest rate in percent (number)
// n_months: tenure in months (number)
export function computeEMI(P = 50000, r_percent = 10, n_months = 12) {
  const monthlyRate = (r_percent / 12) / 100;
  if (monthlyRate === 0) {
    const emi = Math.round(P / n_months);
    return { emi, breakdown: `Principal only, no interest. Monthly = ${emi}` };
  }
  const pow = Math.pow(1 + monthlyRate, n_months);
  const emiRaw = (P * monthlyRate * pow) / (pow - 1);
  const emi = Math.round(emiRaw);
  const total = emi * n_months;
  const interest = Math.round(total - P);
  const breakdown = `P=${P}, r=${r_percent}%, n=${n_months} months → EMI≈${emi} (Total≈${total}, Interest≈${interest})`;
  return { emi, breakdown };
}

export default computeEMI;
