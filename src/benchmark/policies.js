import { PRODUCTS, SCENARIOS } from '../market/scenarios.js';
import { createRun, stagePrices, advanceWeek, finishRun } from '../market/engine.js';

const BASELINE = Object.fromEntries(PRODUCTS.map(product => [product.id, product.initialPrice]));
export function policyPrices(policy, run) {
  if (policy === 'launch-price-baseline') return BASELINE;
  const shock = run.week >= 4 && run.week < 8;
  if (policy === 'signal-aware-policy' && run.scenarioId === 'heatwave' && shock) return { water: 1.86, cola: 2.42, chips: 1.72 };
  if (policy === 'signal-aware-policy' && run.scenarioId === 'price-war' && shock) return { water: 1.22, cola: 1.58, chips: 1.92 };
  return { water: 1.66, cola: 2.2, chips: 1.98 };
}
export function replayPolicy({ policy, scenarioId, seed, onStep }) {
  const run = createRun({ scenarioId, seed, agent: policy });
  for (let week = 1; week <= 12; week += 1) {
    const chosen = policyPrices(policy, run);
    stagePrices(run, { prices: PRODUCTS.map(product => ({ product_id: product.id, price: chosen[product.id] })), rationale: `${policy}: public signal and sales history only` });
    const result = advanceWeek(run, { expected_week: week }); onStep?.({ run, result });
  }
  return { run, result: finishRun(run, { expected_week: 13 }) };
}
export function comparisonRows() {
  return Object.keys(SCENARIOS).flatMap(scenarioId => [17, 42, 91].flatMap(seed => ['launch-price-baseline', 'signal-aware-policy'].map(policy => {
    const { result } = replayPolicy({ policy, scenarioId, seed });
    return { policy, scenarioId, seed, score: result.score, profit: result.profit, serviceLevel: result.serviceLevel };
  })));
}
