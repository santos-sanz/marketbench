function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function stateHash(run) {
  const snapshot = { benchmarkVersion: run.benchmarkVersion, runId: run.runId, scenarioId: run.scenarioId, seed: run.seed, agent: run.agent, week: run.week, status: run.status, cumulativeProfit: run.cumulativeProfit, stagedPrices: run.stagedPrices, invalidCalls: run.invalidCalls, products: run.products.map(({ id, price, inventory }) => ({ id, price, inventory })), history: run.history };
  const text = canonical(snapshot); let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 0x01000193); }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
