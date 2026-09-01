import test from 'node:test'; import assert from 'node:assert/strict'; import { createRun, stagePrices, advanceWeek } from '../src/market/engine.js';
const prices = { prices: [{ product_id: 'water', price: 1.5 }, { product_id: 'cola', price: 2 }, { product_id: 'chips', price: 1.8 }], rationale: 'baseline' };
test('same scenario, seed and actions produce the same market log', () => { const play = () => { const r = createRun({ scenarioId: 'heatwave', seed: 42 }); for (let w=1;w<=12;w++) { stagePrices(r, prices); advanceWeek(r, { expected_week: w }); } return r.history; }; assert.deepEqual(play(), play()); });
test('stale week is rejected without advancing state', () => { const r = createRun({ seed: 17 }); stagePrices(r, prices); assert.throws(() => advanceWeek(r, { expected_week: 2 }), /Stale call/); assert.equal(r.week, 1); });

test('published calibration references reproduce exactly', async () => {
  const { REFERENCES, OFFICIAL_SCENARIOS, OFFICIAL_SEEDS, baselinePrices, oraclePrice, seededNoise } = await import('../src/benchmark/calibration.js');
  const { PRODUCTS } = await import('../src/market/scenarios.js');
  for (const scenarioId of OFFICIAL_SCENARIOS) for (const seed of OFFICIAL_SEEDS) {
    for (const strategy of ['baseline', 'oracle']) {
      const r = createRun({ scenarioId, seed }); const noise = seededNoise(seed);
      for (let week=1; week<=12; week++) {
        const chosen = strategy === 'baseline' ? baselinePrices() : Object.fromEntries(PRODUCTS.map(p => [p.id, oraclePrice({ scenarioId, week, product: p, noise: noise() })]));
        stagePrices(r, { prices: PRODUCTS.map(p => ({ product_id:p.id, price:chosen[p.id] })), rationale: strategy }); advanceWeek(r, { expected_week:week });
      }
      const result = (await import('../src/market/engine.js')).finishRun(r, { expected_week:13 });
      assert.equal(result.profit, REFERENCES[scenarioId][seed][`${strategy}Profit`]);
      assert.ok(result.score >= 0 && result.score <= 100);
    }
  }
});
