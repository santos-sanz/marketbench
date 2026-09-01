import { PRODUCTS, competitorPrice, scenarioMultipliers } from '../market/scenarios.js';

export const OFFICIAL_SEEDS = [17, 42, 91];
export const OFFICIAL_SCENARIOS = ['normal-market', 'heatwave', 'price-war'];
export const SCORE_WEIGHTS = Object.freeze({ adjustedProfit: 45, serviceLevel: 20, shockAdaptation: 15, stability: 10, agentDiscipline: 10 });

// Measured by scripts/calibrate.mjs. The baseline keeps launch prices for all 12 weeks.
// The oracle has perfect knowledge of each seeded demand draw and chooses the best
// cent-denominated price for each product/week. It is an upper reference, not an
// agent-accessible policy.
export const REFERENCES = Object.freeze({
  'normal-market': {
    17: { baselineProfit: 2992.35, oracleProfit: 3237.18, baselineShockProfit: 994.30, oracleShockProfit: 1076.43 },
    42: { baselineProfit: 3033.10, oracleProfit: 3273.12, baselineShockProfit: 1041.05, oracleShockProfit: 1123.35 },
    91: { baselineProfit: 2985.20, oracleProfit: 3229.86, baselineShockProfit: 1012.75, oracleShockProfit: 1094.03 }
  },
  heatwave: {
    17: { baselineProfit: 3377.15, oracleProfit: 3661.11, baselineShockProfit: 1379.10, oracleShockProfit: 1500.36 },
    42: { baselineProfit: 3375.55, oracleProfit: 3720.56, baselineShockProfit: 1383.50, oracleShockProfit: 1570.79 },
    91: { baselineProfit: 3351.65, oracleProfit: 3667.52, baselineShockProfit: 1379.20, oracleShockProfit: 1531.69 }
  },
  'price-war': {
    17: { baselineProfit: 2698.75, oracleProfit: 2942.35, baselineShockProfit: 700.70, oracleShockProfit: 781.60 },
    42: { baselineProfit: 2720.70, oracleProfit: 2963.14, baselineShockProfit: 728.65, oracleShockProfit: 813.37 },
    91: { baselineProfit: 2681.90, oracleProfit: 2927.83, baselineShockProfit: 709.45, oracleShockProfit: 792.00 }
  }
});

export function seededNoise(seed) {
  let state = Number(seed) >>> 0;
  return () => 0.9 + (((state = (1664525 * state + 1013904223) >>> 0) / 4294967296) * 0.2);
}

export function baselinePrices() {
  return Object.fromEntries(PRODUCTS.map(product => [product.id, product.initialPrice]));
}

export function oraclePrice({ scenarioId, week, product, noise }) {
  let best = null;
  for (let cents = 80; cents <= 500; cents += 1) {
    const price = cents / 100;
    const competitor = competitorPrice(scenarioId, week, product);
    const rawDemand = product.baseDemand * scenarioMultipliers(scenarioId, week, product.id) * Math.pow(competitor / price, product.elasticity) * noise;
    const demand = Math.max(0, Math.round(rawDemand));
    const sold = Math.min(product.capacity, demand);
    const profit = Math.round(sold * (price - product.cost) * 100) / 100;
    if (!best || profit > best.profit || (profit === best.profit && price < best.price)) best = { price, profit };
  }
  return best.price;
}
