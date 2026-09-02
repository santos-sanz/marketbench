import { PRODUCTS, SCENARIOS, competitorPrice, scenarioMultipliers } from './scenarios.js';
import { scoreRun } from '../benchmark/scoring.js';

const round = value => Math.round(value * 100) / 100;
function rng(seed) { let state = seed >>> 0; return () => ((state = (1664525 * state + 1013904223) >>> 0) / 4294967296); }

export function createRun({ scenarioId = 'normal-market', seed = 17, agent = 'unlabelled-agent' } = {}) {
  if (!SCENARIOS[scenarioId]) throw new Error('Unknown scenario');
  if (![17, 42, 91].includes(Number(seed))) throw new Error('Seed is not in the official pack');
  return {
    benchmarkVersion: '0.2.0', runId: crypto.randomUUID(), scenarioId, seed: Number(seed), agent,
    week: 1, status: 'active', cash: 0, cumulativeProfit: 0, stagedPrices: null, priceUpdatedWeek: null,
    callsThisWeek: 0, invalidCalls: 0, history: [], random: rng(Number(seed)),
    products: PRODUCTS.map(p => ({ ...p, price: p.initialPrice, inventory: p.capacity }))
  };
}

export function publicState(run) {
  return {
    runId: run.runId, benchmarkVersion: run.benchmarkVersion, scenarioId: run.scenarioId, seed: run.seed,
    week: run.week, status: run.status, callsRemaining: Math.max(0, 4 - run.callsThisWeek),
    cash: round(run.cash), cumulativeProfit: round(run.cumulativeProfit), publicSignal: SCENARIOS[run.scenarioId].signal(run.week),
    products: run.products.map(p => ({ id: p.id, label: p.label, price: p.price, competitorPrice: round(competitorPrice(run.scenarioId, run.week, p)), inventory: p.inventory, unitCost: p.cost })),
    lastWeek: run.history.at(-1) ?? null
  };
}

export function stagePrices(run, { prices, rationale = '' }) {
  requireActive(run); countCall(run);
  if (run.priceUpdatedWeek === run.week) return invalid(run, 'Prices can only be staged once per week');
  const ids = prices?.map(x => x.product_id).sort().join(',');
  if (ids !== 'chips,cola,water') return invalid(run, 'Submit one price for every product');
  for (const item of prices) if (!Number.isFinite(item.price) || item.price < 0.8 || item.price > 5) return invalid(run, 'Prices must be between 0.80 and 5.00');
  run.stagedPrices = Object.fromEntries(prices.map(x => [x.product_id, round(x.price)]));
  run.priceUpdatedWeek = run.week;
  return { staged: run.stagedPrices, rationale: String(rationale).slice(0, 240), week: run.week };
}

export function advanceWeek(run, { expected_week }) {
  requireActive(run); countCall(run);
  if (expected_week !== run.week) return invalid(run, `Stale call: expected week ${run.week}`);
  if (!run.stagedPrices) return invalid(run, 'Stage prices before advancing');
  const week = run.week;
  const productResults = run.products.map(product => {
    product.price = run.stagedPrices[product.id];
    const competitor = competitorPrice(run.scenarioId, week, product);
    const relative = competitor / product.price;
    const noise = 0.9 + run.random() * 0.2;
    const rawDemand = product.baseDemand * scenarioMultipliers(run.scenarioId, week, product.id) * Math.pow(relative, product.elasticity) * noise;
    const demand = Math.max(0, Math.round(rawDemand));
    const sold = Math.min(product.capacity, demand);
    const revenue = sold * product.price;
    const profit = revenue - sold * product.cost;
    product.inventory = product.capacity - sold;
    return { productId: product.id, price: product.price, competitorPrice: round(competitor), demand, sold, stockout: sold < demand, revenue: round(revenue), profit: round(profit) };
  });
  const profit = round(productResults.reduce((sum, p) => sum + p.profit, 0));
  const summary = { week, publicSignal: SCENARIOS[run.scenarioId].signal(week), products: productResults, profit };
  run.history.push(summary); run.cash = round(run.cash + profit); run.cumulativeProfit = round(run.cumulativeProfit + profit);
  run.week += 1; run.stagedPrices = null; run.callsThisWeek = 0;
  if (run.week > 12) run.status = 'ready-to-finish';
  return { completedWeek: week, nextWeek: run.week, profit, cumulativeProfit: run.cumulativeProfit };
}

export function finishRun(run, { expected_week }) {
  if (run.status !== 'ready-to-finish') return invalid(run, 'Complete all 12 weeks before finishing');
  if (expected_week !== 13) return invalid(run, 'Finish expects week 13');
  run.status = 'completed';
  const service = run.history.flatMap(w => w.products).reduce((a, p) => ({ sold: a.sold + p.sold, demand: a.demand + p.demand }), { sold: 0, demand: 0 });
  const scored = scoreRun(run);
  return { runId: run.runId, status: run.status, profit: run.cumulativeProfit, serviceLevel: round(service.sold / service.demand), invalidCalls: run.invalidCalls, ...scored, scoreStatus: scored ? 'calibrated-v1' : 'unscored' };
}

function countCall(run) { run.callsThisWeek += 1; if (run.callsThisWeek > 4) throw new Error('Weekly action-call budget exceeded'); }
function requireActive(run) { if (run.status !== 'active') throw new Error('Run is not active'); }
function invalid(run, message) { run.invalidCalls += 1; throw new Error(message); }
