# MarketBench

MarketBench is a reproducible browser-agent benchmark for economic decisions under pressure. The page exposes a deterministic vending market as typed WebMCP tools. An agent must inspect the market, set prices, and survive twelve weeks of stable demand, a heatwave, or a price war. MarketBench records each tool call and scores the completed run.

> Status: initial working scaffold for The WebMCP Challenge. The UI, seeded engine, scenario manifest, tool lifecycle, and determinism tests are present. The final scoring oracle, persistent replays, and hosted demo are still in progress. This repository does not contain benchmark claims or invented model results.

## Why WebMCP

MarketBench uses the current imperative API, `document.modelContext.registerTool(...)`, so a browser agent sees the same state as the human. Read tools are always available; mutation tools are registered only while a run is active and are removed when it ends.

Tools:

- `get_benchmark_rules`
- `get_market_state`
- `get_sales_history`
- `set_prices`
- `advance_week`
- `finish_run`

`set_prices` stages one complete price update per week. `advance_week` requires `expected_week`, rejecting stale calls instead of changing the wrong state.

## Quick start

```bash
npm install
npm run dev
```

Run the deterministic engine tests with:

```bash
npm test
```

For agent testing, open the page in a browser that supports the WebMCP proposal. In a regular browser, the UI still runs and reports that WebMCP is unavailable.

## Benchmark contract

- 12 simulated weeks
- scenarios: `normal-market`, `heatwave`, `price-war`
- official seed pack: `17`, `42`, `91`
- one staged update per week
- stale `expected_week` mutations are rejected
- future demand and hidden variables are never returned by read tools
- agent/model/version are metadata, not proof of deterministic LLM output

A fixed seed makes the market deterministic, not the model. Fair comparisons should use the same scenario and seed pack, record model/version/configuration, and report mean, standard deviation, and worst seed.

The public contract is in [`public/benchmark-manifest.json`](public/benchmark-manifest.json).

## Project structure

```text
src/market/engine.js        deterministic market engine
src/market/scenarios.js     fixed scenario definitions
src/webmcp/register-tools.js WebMCP tool registration and lifecycle
src/app.js                  UI state and run harness
public/benchmark-manifest.json
fixtures/replays/           replay fixtures, once measured
 tests/engine.test.js        determinism and stale-call tests
```

## Prior work vs. challenge work

MarketBench is a fresh repository created on September 1, 2026. It reuses the vending-market idea and domain lessons from [LLM_Vending_Machine](https://github.com/santos-sanz/LLM_Vending_Machine), which predates the challenge. The browser harness, WebMCP surface, fixed scenarios, run integrity rules, UI, trace, and benchmark contract in this repository are new work for The WebMCP Challenge after August 25, 2026. Git history is the dated record of that work.

## Roadmap before submission

- complete and freeze the 0-100 scoring constants and oracle
- persist full run logs and state hashes
- add measured replay A/B fixtures without storing hidden reasoning
- add score charts and aggregate three-seed comparisons
- deploy and test the live URL in a WebMCP-capable browser

## Sources

- [WebMCP proposal and examples](https://github.com/webmachinelearning/webmcp/blob/main/README.md)
- [WebMCP specification draft](https://webmachinelearning.github.io/webmcp/docs/proposal.html)
- [Challenge rules](https://webmcp.devpost.com/rules)

## License

MIT
