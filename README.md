# MarketBench

MarketBench is a reproducible WebMCP benchmark for browser agents making economic decisions under pressure. A browser agent manages a deterministic vending market for twelve simulated weeks through typed tools, reacts to a heatwave or price war, and receives a calibrated 0-100 score. Every tool call, weekly state, result, and integrity hash can be exported as JSON.

## Live demo

The live URL will be listed here after deployment. In a regular browser, choose a scenario and official seed, then click **Play measured demo** to see all twelve weeks, score components, trace, and state hashes. In ChatGPT's in-app browser or Chrome 149+ with WebMCP enabled, an agent gets the typed tools directly.

## Why WebMCP

A benchmark should test decisions, not an agent's ability to reverse-engineer buttons and page layout. MarketBench exposes the same public market state to people and agents through `document.modelContext.registerTool(...)`. Read tools reveal only information a manager would know. Mutation tools validate complete price sets, enforce one update per week, reject stale week numbers, and disappear when the run ends.

Registered tools:

- `get_benchmark_rules`
- `get_market_state`
- `get_sales_history`
- `set_prices`
- `advance_week`
- `finish_run`

This makes economic-agent evaluation easier to reproduce: same contract, same scenarios, same seed pack, explicit action limits, and complete machine-readable evidence.

## Quick start

```bash
npm install
npm run dev
```

Verification:

```bash
npm test
npm run calibrate
npm run compare
npm run build
```

## Benchmark contract

- 12 simulated weeks
- scenarios: `normal-market`, `heatwave`, `price-war`
- official seed pack: `17`, `42`, `91`
- one complete staged price update per week
- stale `expected_week` mutations are rejected
- future demand and hidden variables are never returned by read tools
- agent/model/version are metadata, not proof of deterministic model output
- export includes the full tool-call trace, weekly history, score, and an FNV-1a integrity hash after every call

The public contract is in [`public/benchmark-manifest.json`](public/benchmark-manifest.json).

## Scoring and measured comparison

Five frozen components total 100 points: adjusted profit (45), service level (20), shock adaptation (15), price stability (10), and valid tool discipline (10).

The baseline holds launch prices for all twelve weeks. The oracle exhaustively checks every cent-denominated price from EUR 0.80 to EUR 5.00 with perfect knowledge of each seeded demand draw. Profit and shock points interpolate between the measured baseline and oracle. [`npm run calibrate`](scripts/calibrate.mjs) regenerates all 18 calibration replays in [`calibration-v1.json`](fixtures/replays/calibration-v1.json).

[`npm run compare`](scripts/compare.mjs) runs two transparent deterministic policies across all three official seeds and scenarios, then reports mean score, standard deviation, worst seed, and mean profit in [`policy-comparison-v1.json`](fixtures/replays/policy-comparison-v1.json). These rows validate the comparison harness. They are **not claimed as LLM outputs**. Named model results should only be added after running those models under the published contract.

## Prior work vs challenge work

The vending-machine idea and domain lessons come from [LLM_Vending_Machine](https://github.com/santos-sanz/LLM_Vending_Machine), which predates the challenge.

MarketBench is a new repository created September 1, 2026, during the WebMCP Challenge period. Challenge work includes the browser benchmark harness, imperative WebMCP tool surface, fixed scenarios and seeds, stale-action protection, calibrated scoring, full trace export, state hashes, reproducible policy comparisons, score charts, tests, and live demo. The dated commit history distinguishes this work from the earlier project.

## Project structure

```text
src/market/engine.js              deterministic market engine
src/market/scenarios.js           fixed scenarios and products
src/webmcp/register-tools.js      WebMCP tool registration and lifecycle
src/benchmark/scoring.js          calibrated 0-100 score
src/benchmark/integrity.js        canonical run-state hashes
src/benchmark/policies.js         transparent measured policies
scripts/calibrate.mjs             baseline/oracle calibration
scripts/compare.mjs               three-seed comparison generator
fixtures/replays/                 generated measured replay fixtures
public/benchmark-manifest.json    public benchmark contract
tests/engine.test.js              determinism, stale-call, hash, fixture tests
```

## Sources

- [WebMCP proposal and examples](https://github.com/webmachinelearning/webmcp/blob/main/README.md)
- [WebMCP specification draft](https://webmachinelearning.github.io/webmcp/docs/proposal.html)
- [Challenge rules](https://webmcp.devpost.com/rules)

## License

MIT
