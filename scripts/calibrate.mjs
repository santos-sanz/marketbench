import { createRun, stagePrices, advanceWeek, finishRun } from '../src/market/engine.js';
import { PRODUCTS } from '../src/market/scenarios.js';
import { OFFICIAL_SCENARIOS, OFFICIAL_SEEDS, baselinePrices, oraclePrice, seededNoise } from '../src/benchmark/calibration.js';

function replay(scenarioId, seed, strategy) {
  const run = createRun({ scenarioId, seed, agent: `${strategy}-reference` });
  const noise = seededNoise(seed);
  for (let week = 1; week <= 12; week += 1) {
    const prices = strategy === 'baseline'
      ? baselinePrices()
      : Object.fromEntries(PRODUCTS.map(product => [product.id, oraclePrice({ scenarioId, week, product, noise: noise() })]));
    stagePrices(run, { prices: PRODUCTS.map(product => ({ product_id: product.id, price: prices[product.id] })), rationale: `${strategy} reference` });
    advanceWeek(run, { expected_week: week });
  }
  const result = finishRun(run, { expected_week: 13 });
  return { scenarioId, seed, strategy, profit: result.profit, serviceLevel: result.serviceLevel, shockProfit: result.metrics.shockProfit, score: result.score };
}
const rows = OFFICIAL_SCENARIOS.flatMap(scenarioId => OFFICIAL_SEEDS.flatMap(seed => ['baseline', 'oracle'].map(strategy => replay(scenarioId, seed, strategy))));
console.log(JSON.stringify({ generatedBy: 'npm run calibrate', benchmarkVersion: '0.1.0', rows }, null, 2));
