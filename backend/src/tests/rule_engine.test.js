import { detectIntent } from '../rule_engine.js';
import { computeEMI } from '../utils/emi.js';

test('detectIntent maps EMI queries', () => {
  expect(detectIntent('EMI kya hota hai?')).toBe('emi_explain');
  expect(detectIntent('installment details')).toBe('emi_explain');
});

test('detectIntent maps credit score queries', () => {
  expect(detectIntent('Mera score kaise banta hai?')).toBe('credit_score_explain');
});

test('computeEMI returns integer emi and breakdown', () => {
  const { emi, breakdown } = computeEMI(100000, 10, 12);
  expect(Number.isInteger(emi)).toBe(true);
  expect(typeof breakdown).toBe('string');
});
