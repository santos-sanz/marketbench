import './styles.css';
import { createRun, publicState } from './market/engine.js';
import { SCENARIOS } from './market/scenarios.js';
import { registerMarketTools } from './webmcp/register-tools.js';
import { scoreRun } from './benchmark/scoring.js';

let run = createRun(); let events = []; let tools = null;
const app = document.querySelector('#app');
const money = value => new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(value);

async function start() {
  tools?.dispose(); events = [];
  run = createRun({ scenarioId: document.querySelector('#scenario')?.value ?? 'normal-market', seed: Number(document.querySelector('#seed')?.value ?? 17), agent: document.querySelector('#agent')?.value || 'unlabelled-agent' });
  tools = await registerMarketTools({ getRun: () => run, onEvent: event => events.unshift({ at: new Date().toISOString(), ...event }), onChange: render });
  render();
}

function render() {
  const state = publicState(run);
  const result = run.status === 'completed' ? scoreRun(run) : null;
  app.innerHTML = `<header><p class="eyebrow">WEBMCP AGENT EVALUATION</p><h1>MarketBench</h1><p>Can a browser agent run a vending business when the market changes?</p></header>
  <main><section class="panel setup"><h2>Run setup</h2><label>Agent / model<input id="agent" value="${run.agent}"></label><label>Scenario<select id="scenario">${Object.values(SCENARIOS).map(s => `<option value="${s.id}" ${s.id === run.scenarioId ? 'selected' : ''}>${s.label}</option>`).join('')}</select></label><label>Seed<select id="seed">${[17,42,91].map(s => `<option ${s === run.seed ? 'selected' : ''}>${s}</option>`).join('')}</select></label><button id="start">Start fresh run</button><code>${tools?.available ? 'WebMCP tools registered' : 'UI mode: WebMCP unavailable in this browser'}</code></section>
  <section class="panel market"><div class="row"><div><p class="eyebrow">LIVE MARKET</p><h2>Week ${state.week} / 12</h2></div><strong>${money(state.cumulativeProfit)}</strong></div><p class="signal">${state.publicSignal}</p><div class="products">${state.products.map(p => `<article><span>${p.label}</span><b>${money(p.price)}</b><small>Competitor ${money(p.competitorPrice)} · ${p.inventory} in stock</small></article>`).join('')}</div></section>
  <section class="panel trace"><div class="row"><h2>Agent trace</h2><span>${events.length} calls</span></div>${events.length ? events.map(e => `<article class="${e.valid ? '' : 'invalid'}"><b>${e.name}</b><small>${e.at.slice(11,19)} · ${e.valid ? 'valid' : 'rejected'}</small><pre>${escapeHtml(JSON.stringify(e.result, null, 2))}</pre></article>`).join('') : '<p>No calls yet. Start an agent with the standard benchmark prompt.</p>'}</section>
  <section class="panel score"><p class="eyebrow">RUN RESULT</p><h2>${run.status === 'completed' ? 'Completed' : 'Awaiting 12 weeks'}</h2><p>Profit, service level, shock adaptation, stability, and tool discipline are scored against published measured references.</p><div class="scorebox">Score <b>${result ? result.score.toFixed(2) : '—'}</b></div></section></main>`;
  document.querySelector('#start').onclick = start;
}
function escapeHtml(value) { return value.replace(/[&<>]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[c])); }
render(); start();
