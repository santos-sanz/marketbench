import './styles.css';
import { createRun, publicState, stagePrices, advanceWeek, finishRun } from './market/engine.js';
import { SCENARIOS, PRODUCTS } from './market/scenarios.js';
import { registerMarketTools } from './webmcp/register-tools.js';
import { scoreRun } from './benchmark/scoring.js';
import { stateHash } from './benchmark/integrity.js';
import { policyPrices } from './benchmark/policies.js';

let run = createRun(); let events = []; let tools = null; let comparison = null;
const app = document.querySelector('#app');
const money = value => new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(value);
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

async function start() {
  tools?.dispose(); events = [];
  run = createRun({ scenarioId: document.querySelector('#scenario')?.value ?? 'normal-market', seed: Number(document.querySelector('#seed')?.value ?? 17), agent: document.querySelector('#agent')?.value || 'unlabelled-agent' });
  tools = await registerMarketTools({ getRun: () => run, onEvent: event => { events.unshift({ sequence: events.length + 1, at: new Date().toISOString(), ...event }); persist(); }, onChange: render });
  persist(); render();
}
function persist() {
  const artifact = { schemaVersion:'marketbench-run-v1', exportedAt:new Date().toISOString(), runId:run.runId, benchmarkVersion:run.benchmarkVersion, scenarioId:run.scenarioId, seed:run.seed, agent:run.agent, status:run.status, finalStateHash:stateHash(run), result:run.history.length===12?scoreRun(run):null, fullHistory:run.history, toolCalls:[...events].reverse() };
  localStorage.setItem('marketbench:last-run', JSON.stringify(artifact));
}
function downloadRun() {
  persist(); const blob = new Blob([localStorage.getItem('marketbench:last-run')], {type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`marketbench-${run.runId}.json`; a.click(); URL.revokeObjectURL(a.href);
}
async function playMeasuredDemo() {
  tools?.dispose(); events=[]; run=createRun({scenarioId:document.querySelector('#scenario').value, seed:Number(document.querySelector('#seed').value), agent:'signal-aware-policy'});
  for(let week=1;week<=12;week+=1){ const chosen=policyPrices('signal-aware-policy',run); const args={prices:PRODUCTS.map(p=>({product_id:p.id,price:chosen[p.id]})),rationale:'Measured policy uses public signal and prior sales only'}; const staged=stagePrices(run,args); events.unshift({sequence:events.length+1,at:new Date().toISOString(),name:'set_prices',args,result:staged,valid:true,stateHash:stateHash(run),state:publicState(run)}); const advanced=advanceWeek(run,{expected_week:week}); events.unshift({sequence:events.length+1,at:new Date().toISOString(),name:'advance_week',args:{expected_week:week},result:advanced,valid:true,stateHash:stateHash(run),state:publicState(run)}); }
  const done=finishRun(run,{expected_week:13}); events.unshift({sequence:events.length+1,at:new Date().toISOString(),name:'finish_run',args:{expected_week:13},result:done,valid:true,stateHash:stateHash(run),state:publicState(run)}); persist(); render();
}
function aggregateCards(){ if(!comparison) return '<p class="muted">Loading measured three-seed comparison…</p>'; const names={'launch-price-baseline':'Launch-price baseline','signal-aware-policy':'Signal-aware policy'}; return comparison.aggregates.map(x=>`<article class="aggregate"><span>${escapeHtml(SCENARIOS[x.scenarioId].label)}</span><b>${x.meanScore.toFixed(2)}</b><small>${names[x.policy]} · σ ${x.standardDeviation.toFixed(2)} · worst ${x.worstSeedScore.toFixed(2)}</small><div class="bar"><i style="width:${x.meanScore}%"></i></div></article>`).join(''); }
function render() {
  const state=publicState(run), result=run.status==='completed'?scoreRun(run):null;
  app.innerHTML=`<header><p class="eyebrow">WEBMCP AGENT EVALUATION</p><h1>MarketBench</h1><p>A reproducible benchmark for agents making economic decisions under pressure.</p><nav><a href="#benchmark">Run benchmark</a><a href="#comparison">Measured comparison</a><a href="https://github.com/santos-sanz/marketbench">Source & methods</a></nav></header>
  <main id="benchmark"><section class="panel setup"><h2>Run setup</h2><label>Agent / model<input id="agent" value="${escapeHtml(run.agent)}"></label><label>Scenario<select id="scenario">${Object.values(SCENARIOS).map(s=>`<option value="${s.id}" ${s.id===run.scenarioId?'selected':''}>${s.label}</option>`).join('')}</select></label><label>Seed<select id="seed">${[17,42,91].map(s=>`<option ${s===run.seed?'selected':''}>${s}</option>`).join('')}</select></label><button id="start">Start fresh agent run</button><button id="demo" class="secondary">Play measured demo</button><code>${tools?.available?'WebMCP tools registered':'UI mode · open in a WebMCP browser for agent tools'}</code></section>
  <section class="panel market"><div class="row"><div><p class="eyebrow">LIVE MARKET</p><h2>Week ${Math.min(state.week,12)} / 12</h2></div><strong>${money(state.cumulativeProfit)}</strong></div><p class="signal">${state.publicSignal}</p><div class="products">${state.products.map(p=>`<article><span>${p.label}</span><b>${money(p.price)}</b><small>Competitor ${money(p.competitorPrice)} · ${p.inventory} in stock</small></article>`).join('')}</div><p class="hash">State ${escapeHtml(stateHash(run))}</p></section>
  <section class="panel trace"><div class="row"><h2>Verifiable trace</h2><span>${events.length} calls</span></div>${events.length?events.map(e=>`<article class="${e.valid?'':'invalid'}"><b>${e.sequence}. ${e.name}</b><small>${e.at.slice(11,19)} · ${e.valid?'valid':'rejected'} · ${e.stateHash}</small><pre>${escapeHtml(JSON.stringify(e.result,null,2))}</pre></article>`).join(''):'<p>No calls yet. Start an agent with the benchmark prompt, or play the measured demo.</p>'}</section>
  <section class="panel score"><p class="eyebrow">RUN RESULT</p><h2>${run.status==='completed'?'Completed':'Awaiting 12 weeks'}</h2><p>Profit, service, shock adaptation, stability, and tool discipline are scored against frozen measured references.</p><div class="scorebox">Score <b>${result?result.score.toFixed(2):'—'}</b></div>${result?`<div class="components">${Object.entries(result.components).map(([k,v])=>`<span>${k}<b>${v}</b></span>`).join('')}</div><button id="download" class="secondary">Download full run JSON</button>`:''}</section>
  <section class="panel comparison" id="comparison"><div><p class="eyebrow">THREE OFFICIAL SEEDS</p><h2>Measured comparison</h2><p>Deterministic policy replays validate the harness. They are not presented as LLM results. Every number is regenerated with <code>npm run compare</code>.</p></div><div class="aggregates">${aggregateCards()}</div></section>
  <section class="panel contract"><p class="eyebrow">REPRODUCIBLE BY DESIGN</p><h2>Same task. Same seeds. Complete evidence.</h2><ul><li>Typed WebMCP reads and guarded mutations</li><li>Full tool-call log, weekly market history, and state hashes</li><li>Frozen baseline/oracle calibration and three-seed aggregates</li></ul></section></main>`;
  document.querySelector('#start').onclick=start; document.querySelector('#demo').onclick=playMeasuredDemo; document.querySelector('#download')?.addEventListener('click',downloadRun);
}
render(); start(); fetch('/policy-comparison-v1.json').then(r=>r.json()).then(data=>{comparison=data;render();});
