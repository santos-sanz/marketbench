import { REFERENCES, SCORE_WEIGHTS } from './calibration.js';

const round = value => Math.round(value * 100) / 100;
const clamp01 = value => Math.max(0, Math.min(1, value));
const interpolate = (value, baseline, oracle) => oracle === baseline ? Number(value >= oracle) : clamp01((value - baseline) / (oracle - baseline));

export function scoreRun(run) {
  const reference = REFERENCES[run.scenarioId]?.[run.seed];
  if (!reference || run.history.length !== 12) return null;
  const products = run.history.flatMap(week => week.products);
  const sold = products.reduce((sum, product) => sum + product.sold, 0);
  const demand = products.reduce((sum, product) => sum + product.demand, 0);
  const serviceLevel = demand ? sold / demand : 1;
  const shockProfit = run.history.filter(week => week.week >= 4 && week.week < 8).reduce((sum, week) => sum + week.profit, 0);
  const changes = [];
  for (let week = 1; week < run.history.length; week += 1) {
    for (const product of run.history[week].products) {
      const prior = run.history[week - 1].products.find(item => item.productId === product.productId);
      changes.push(Math.abs(product.price - prior.price) / 4.2);
    }
  }
  const stability = changes.length ? 1 - clamp01(changes.reduce((sum, value) => sum + value, 0) / changes.length) : 1;
  const discipline = 1 - clamp01(run.invalidCalls / 12);
  const components = {
    adjustedProfit: round(SCORE_WEIGHTS.adjustedProfit * interpolate(run.cumulativeProfit, reference.baselineProfit, reference.oracleProfit)),
    serviceLevel: round(SCORE_WEIGHTS.serviceLevel * clamp01(serviceLevel)),
    shockAdaptation: round(SCORE_WEIGHTS.shockAdaptation * interpolate(shockProfit, reference.baselineShockProfit, reference.oracleShockProfit)),
    stability: round(SCORE_WEIGHTS.stability * stability),
    agentDiscipline: round(SCORE_WEIGHTS.agentDiscipline * discipline)
  };
  return {
    score: round(Object.values(components).reduce((sum, value) => sum + value, 0)),
    components,
    metrics: { profit: round(run.cumulativeProfit), serviceLevel: round(serviceLevel), shockProfit: round(shockProfit), invalidCalls: run.invalidCalls },
    reference
  };
}
