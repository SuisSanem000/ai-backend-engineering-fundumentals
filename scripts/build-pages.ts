/**
 * Build script for static GitHub Pages deployment.
 * Compiles all 5 Stages + Master Project into dist-web/browser-app.js
 * and generates an interactive multi-stage dashboard at dist-web/index.html.
 */

import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist-web');
fs.mkdirSync(distDir, { recursive: true });

const buildResult = await Bun.build({
  entrypoints: ['src/browser-app.ts'],
  outdir: distDir,
  target: 'browser',
  minify: true,
});

if (!buildResult.success) {
  console.error('Build failed:', buildResult.logs);
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Backend Engineering Fundamentals — All 5 Stages & Master Project</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #111827;
      --card-border: #1f2937;
      --card-border-focus: #3b82f6;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --accent: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --code-bg: #050811;
      --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg); color: var(--text); font-family: var(--font-sans);
      min-height: 100vh; display: flex; flex-direction: column;
    }

    header {
      background: rgba(17, 24, 39, 0.85); backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--card-border); padding: 16px 32px;
      display: flex; align-items: center; justify-content: space-between;
      position: sticky; top: 0; z-index: 50;
    }

    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-logo {
      width: 34px; height: 34px; background: linear-gradient(135deg, #3b82f6, #10b981);
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 16px; color: white;
    }
    .brand-title { font-size: 16px; font-weight: 700; letter-spacing: -0.02em; }
    .brand-sub { font-size: 12px; color: var(--text-muted); }
    .nav-links { display: flex; gap: 12px; align-items: center; }

    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(16, 185, 129, 0.15); color: #34d399;
      padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    main {
      flex: 1; max-width: 1400px; margin: 0 auto; width: 100%;
      padding: 24px 32px 48px; display: grid; grid-template-columns: 280px 1fr; gap: 24px;
    }

    .sidebar { display: flex; flex-direction: column; gap: 6px; }
    .sidebar-section {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--text-muted); font-weight: 700; padding: 12px 12px 4px;
    }

    .tab-btn {
      display: flex; align-items: center; gap: 10px; padding: 11px 14px;
      background: transparent; border: 1px solid transparent; border-radius: 8px;
      color: var(--text-muted); font-family: var(--font-sans); font-size: 13px; font-weight: 600;
      text-align: left; cursor: pointer; transition: all 0.15s ease;
    }
    .tab-btn:hover { background: rgba(255, 255, 255, 0.04); color: var(--text); }
    .tab-btn.active { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.4); color: #60a5fa; }

    .content-card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 12px; padding: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    }
    .card-header { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--card-border); }
    .card-title { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
    .card-desc { color: var(--text-muted); font-size: 13px; margin-top: 4px; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
    .form-group { margin-bottom: 14px; }
    label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: var(--text-muted); }
    textarea, input[type="text"], input[type="number"], select {
      width: 100%; background: var(--code-bg); border: 1px solid var(--card-border);
      border-radius: 8px; padding: 10px 12px; color: var(--text);
      font-family: var(--font-sans); font-size: 13px; outline: none;
    }
    textarea:focus, input:focus, select:focus { border-color: var(--card-border-focus); }
    textarea { min-height: 90px; resize: vertical; }

    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 10px 16px; background: var(--primary); color: white; border: none;
      border-radius: 8px; font-family: var(--font-sans); font-size: 13px; font-weight: 600;
      cursor: pointer; transition: background 0.15s ease; text-decoration: none;
    }
    .btn:hover { background: var(--primary-hover); }
    .btn-secondary { background: rgba(255, 255, 255, 0.08); color: var(--text); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.14); }
    .btn-danger { background: var(--danger); }
    .btn-success { background: var(--accent); }

    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin: 16px 0; }
    .metric-box { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--card-border); border-radius: 8px; padding: 12px; }
    .metric-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
    .metric-val { font-size: 16px; font-weight: 700; margin-top: 4px; font-family: var(--font-mono); color: #60a5fa; }

    .output-card {
      background: var(--code-bg); border: 1px solid var(--card-border); border-radius: 8px;
      padding: 14px; margin-top: 14px; font-family: var(--font-mono); font-size: 12px; overflow-x: auto;
      line-height: 1.5;
    }

    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 6px; }
    .tag-blue { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
    .tag-green { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
    .tag-red { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
    .tag-amber { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }

    .approval-banner {
      background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 8px; padding: 16px; margin: 16px 0;
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
    }

    .trace-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
    .trace-table th { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--card-border); color: var(--text-muted); }
    .trace-table td { padding: 8px 10px; border-bottom: 1px solid rgba(31, 41, 55, 0.6); font-family: var(--font-mono); }

    @media (max-width: 768px) {
      main { grid-template-columns: 1fr; padding: 16px; }
      .grid-2 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-logo">AI</div>
      <div>
        <div class="brand-title">AI Backend Engineering Fundamentals</div>
        <div class="brand-sub">All 5 Stages + Master Project (100% Free Local/Browser Simulation)</div>
      </div>
    </div>
    <div class="nav-links">
      <div class="badge"><span class="badge-dot"></span><span>Zero Paid APIs</span></div>
      <a href="https://github.com/SuisSanem000/ai-backend-engineering-fundumentals" target="_blank" class="btn btn-secondary" style="font-size:12px; padding:6px 12px;">GitHub Repo</a>
    </div>
  </header>

  <main>
    <div class="sidebar">
      <div class="sidebar-section">Core 5 Stages</div>
      <button class="tab-btn active" onclick="switchTab('stage1', this)">⚡ Stage 1: Resilient LLM RPC</button>
      <button class="tab-btn" onclick="switchTab('stage2', this)">📚 Stage 2: Hybrid RAG & Decay</button>
      <button class="tab-btn" onclick="switchTab('stage3', this)">💰 Stage 3: Cost & Latency</button>
      <button class="tab-btn" onclick="switchTab('stage4', this)">🛡️ Stage 4: Safe Agents & HITL</button>
      <button class="tab-btn" onclick="switchTab('stage5', this)">🧪 Stage 5: CI Evals & Tracing</button>

      <div class="sidebar-section">Master Project</div>
      <button class="tab-btn" onclick="switchTab('master', this)">📇 Smart Contact List App</button>
    </div>

    <!-- STAGE 1 -->
    <div id="tab-stage1" class="content-card">
      <div class="card-header">
        <div class="card-title">⚡ Stage 1: LLM Calls Are Backend Calls</div>
        <div class="card-desc">Simulate HTTP 429 rate limits, latency timeouts, circuit breakers, fallback failover, and per-request cost receipts.</div>
      </div>

      <div class="form-group">
        <label>Prompt</label>
        <input type="text" id="s1-prompt" value="Summarize distributed consensus protocols in 2 sentences.">
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label>Injected Failures (HTTP 429 Count)</label>
          <input type="number" id="s1-fails" value="2" min="0" max="5">
        </div>
        <div class="form-group">
          <label>Provider Latency (ms) vs Timeout Budget (ms)</label>
          <div style="display:flex; gap:8px;">
            <input type="number" id="s1-latency" value="15" title="Provider Latency">
            <input type="number" id="s1-timeout" value="500" title="Timeout Budget">
          </div>
        </div>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px;">
        <button class="btn" onclick="runS1(2, 15, 500, true)">Run With 2 Retries (Recovers)</button>
        <button class="btn btn-secondary" onclick="runS1(5, 15, 500, true)">Trigger Fallback Model</button>
        <button class="btn btn-danger" onclick="runS1(0, 300, 50, false)">Trigger Timeout Abort</button>
      </div>

      <div id="s1-metrics" class="metric-grid" style="display:none;">
        <div class="metric-box"><div class="metric-label">Model Used</div><div id="s1-m-model" class="metric-val">-</div></div>
        <div class="metric-box"><div class="metric-label">Retries</div><div id="s1-m-retries" class="metric-val">-</div></div>
        <div class="metric-box"><div class="metric-label">Fallback Used</div><div id="s1-m-fallback" class="metric-val">-</div></div>
        <div class="metric-box"><div class="metric-label">Simulated Cost</div><div id="s1-m-cost" class="metric-val">-</div></div>
      </div>

      <div id="s1-out" class="output-card" style="display:none;"><pre><code id="s1-json"></code></pre></div>
    </div>

    <!-- STAGE 2 -->
    <div id="tab-stage2" class="content-card" style="display:none;">
      <div class="card-header">
        <div class="card-title">📚 Stage 2: Hybrid Retrieval (BM25 + Vectors + RRF + Freshness)</div>
        <div class="card-desc">Compare keyword + semantic retrieval over 2022 legacy docs vs 2026 updated docs with exponential freshness decay and citations.</div>
      </div>

      <div class="grid-2">
        <div class="form-group">
          <label>Query</label>
          <input type="text" id="s2-query" value="refund policy calendar days">
        </div>
        <div class="form-group">
          <label>Freshness Decay (lambda)</label>
          <select id="s2-lambda">
            <option value="0.05">0.05 (Penalize Old Docs)</option>
            <option value="0.0">0.00 (No Freshness Filter)</option>
          </select>
        </div>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn" onclick="runS2()">Run Hybrid RAG</button>
        <button class="btn btn-secondary" onclick="document.getElementById('s2-query').value='ERR_SOCKET_HANGUP_V2'; runS2();">Test Exact Error Code (BM25)</button>
      </div>

      <div id="s2-out" class="output-card" style="display:none;"><pre><code id="s2-json"></code></pre></div>
    </div>

    <!-- STAGE 3 -->
    <div id="tab-stage3" class="content-card" style="display:none;">
      <div class="card-header">
        <div class="card-title">💰 Stage 3: Cost & Latency Optimization</div>
        <div class="card-desc">Observe L1 Exact SHA-256 caching, L2 Semantic cosine vector caching, and Economy vs Frontier model routing.</div>
      </div>

      <div class="form-group">
        <label>Prompt</label>
        <input type="text" id="s3-prompt" value="What is the customer support email?">
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
        <button class="btn" onclick="runS3()">Execute Optimized Call</button>
        <button class="btn btn-secondary" onclick="document.getElementById('s3-prompt').value='What is the customer support email?'; runS3();">Repeat (L1 Exact Hit)</button>
        <button class="btn btn-secondary" onclick="document.getElementById('s3-prompt').value='Can you give me the customer support email?'; runS3();">Paraphrase (L2 Semantic Hit)</button>
        <button class="btn btn-secondary" onclick="document.getElementById('s3-prompt').value='Analyze and compare Paxos vs Raft consensus algorithms step-by-step.'; runS3();">Complex Prompt (Frontier Route)</button>
      </div>

      <div id="s3-metrics" class="metric-grid" style="display:none;">
        <div class="metric-box"><div class="metric-label">Cache Hit</div><div id="s3-m-cache" class="metric-val">-</div></div>
        <div class="metric-box"><div class="metric-label">Routed Model</div><div id="s3-m-model" class="metric-val">-</div></div>
        <div class="metric-box"><div class="metric-label">Latency</div><div id="s3-m-time" class="metric-val">-</div></div>
        <div class="metric-box"><div class="metric-label">Simulated Cost</div><div id="s3-m-cost" class="metric-val">-</div></div>
      </div>

      <div id="s3-out" class="output-card" style="display:none;"><pre><code id="s3-json"></code></pre></div>
    </div>

    <!-- STAGE 4 -->
    <div id="tab-stage4" class="content-card" style="display:none;">
      <div class="card-header">
        <div class="card-title">🛡️ Stage 4: Agents in Production (Idempotency & HITL Approval)</div>
        <div class="card-desc">Test Stripe-style idempotency keys preventing duplicate refunds, and Human-in-the-Loop approval gates for high-risk actions.</div>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px;">
        <button class="btn" onclick="runS4Agent()">Run Refund Agent (Needs Human Approval)</button>
        <button class="btn btn-secondary" onclick="runS4Idemp()">Test Idempotent Replay (Key: idemp_999)</button>
      </div>

      <div id="s4-approval-box" class="approval-banner" style="display:none;">
        <div>
          <div style="font-weight:700; color:#fbbf24;">⚠️ Agent Suspended: Human Approval Required</div>
          <div id="s4-reason" style="font-size:12px; margin-top:4px;"></div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:4px; font-family:var(--font-mono);">Token: <span id="s4-token">-</span></div>
        </div>
        <button class="btn btn-success" onclick="approveS4()">Approve & Resume</button>
      </div>

      <div id="s4-out" class="output-card" style="display:none;"><pre><code id="s4-json"></code></pre></div>
    </div>

    <!-- STAGE 5 -->
    <div id="tab-stage5" class="content-card" style="display:none;">
      <div class="card-header">
        <div class="card-title">🧪 Stage 5: CI Evals & OpenTelemetry Observability</div>
        <div class="card-desc">Run Golden Dataset benchmarks to see CI pass good prompts and block degraded prompts automatically.</div>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px;">
        <button class="btn btn-success" onclick="runS5('good')">Run CI Eval: Good Prompt (Passes)</button>
        <button class="btn btn-danger" onclick="runS5('degraded')">Run CI Eval: Bad Prompt (Blocks CI)</button>
      </div>

      <div id="s5-metrics" class="metric-grid" style="display:none;">
        <div class="metric-box"><div class="metric-label">CI Gate</div><div id="s5-m-gate" class="metric-val">-</div></div>
        <div class="metric-box"><div class="metric-label">Pass Rate</div><div id="s5-m-rate" class="metric-val">-</div></div>
        <div class="metric-box"><div class="metric-label">Avg Score</div><div id="s5-m-score" class="metric-val">-</div></div>
      </div>

      <div id="s5-out" class="output-card" style="display:none;"><pre><code id="s5-json"></code></pre></div>
    </div>

    <!-- MASTER PROJECT -->
    <div id="tab-master" class="content-card" style="display:none;">
      <div class="card-header">
        <div class="card-title">📇 Master Project: Smart Contact List (All 5 Stages Combined)</div>
        <div class="card-desc">Ingest unstructured contact notes, search via Hybrid RAG + L1/L2 Cache, and inspect OpenTelemetry traces.</div>
      </div>

      <div class="form-group">
        <label>1. Ingest Unstructured Note (Stage 1)</label>
        <textarea id="m-ingest-txt">Met with Dr. Alex Vance at Aperture Labs. Email is alex.vance@aperture.com. Discussed portal telemetry pipelines.</textarea>
        <button class="btn" style="margin-top:8px;" onclick="runMasterIngest()">Extract & Index Contact</button>
      </div>

      <div class="form-group" style="margin-top:20px;">
        <label>2. Search Contacts (Stage 2 & 3)</label>
        <div style="display:flex; gap:8px;">
          <input type="text" id="m-search-txt" value="quantum displacement resonance">
          <button class="btn" onclick="runMasterSearch()">Search</button>
        </div>
      </div>

      <div id="m-out" class="output-card" style="display:none;"><pre><code id="m-json"></code></pre></div>

      <div style="margin-top:20px;">
        <button class="btn btn-secondary" onclick="loadMasterTraces()">Refresh OpenTelemetry Trace Tree (Stage 5)</button>
        <table class="trace-table">
          <thead><tr><th>Span Name</th><th>Trace ID</th><th>Status</th><th>Duration</th></tr></thead>
          <tbody id="m-traces"></tbody>
        </table>
      </div>
    </div>
  </main>

  <script src="./browser-app.js"></script>
  <script>
    let s4Token = null;

    function switchTab(tabId, btnEl) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.content-card').forEach(c => c.style.display = 'none');
      if (btnEl) btnEl.classList.add('active');
      document.getElementById('tab-' + tabId).style.display = 'block';
      if (tabId === 'master') loadMasterTraces();
    }

    async function runS1(fails, latency, timeout, fallback) {
      await window.__smartContactApp.ready;
      const prompt = document.getElementById('s1-prompt').value;
      const res = await window.__smartContactApp.runStage1Lab({
        prompt, failCount: fails, latencyMs: latency, timeoutMs: timeout, useFallback: fallback
      });
      document.getElementById('s1-metrics').style.display = 'grid';
      document.getElementById('s1-m-model').innerText = res.modelUsed || 'NONE';
      document.getElementById('s1-m-retries').innerText = res.retriesAttempted ?? 0;
      document.getElementById('s1-m-fallback').innerText = res.fallbackUsed ? 'YES' : 'NO';
      document.getElementById('s1-m-cost').innerText = res.receipt ? ('$' + res.receipt.totalCostUsd.toFixed(6)) : '$0';
      document.getElementById('s1-out').style.display = 'block';
      document.getElementById('s1-json').innerText = JSON.stringify(res, null, 2);
    }

    async function runS2() {
      await window.__smartContactApp.ready;
      const q = document.getElementById('s2-query').value;
      const lambda = parseFloat(document.getElementById('s2-lambda').value);
      const res = await window.__smartContactApp.runStage2Lab(q, lambda);
      document.getElementById('s2-out').style.display = 'block';
      document.getElementById('s2-json').innerText = JSON.stringify(res, null, 2);
    }

    async function runS3() {
      await window.__smartContactApp.ready;
      const p = document.getElementById('s3-prompt').value;
      const res = await window.__smartContactApp.runStage3Lab(p);
      document.getElementById('s3-metrics').style.display = 'grid';
      document.getElementById('s3-m-cache').innerText = res.result.cacheHit;
      document.getElementById('s3-m-cache').style.color = res.result.cacheHit === 'NONE' ? '#9ca3af' : '#34d399';
      document.getElementById('s3-m-model').innerText = res.result.routing.selectedModel;
      document.getElementById('s3-m-time').innerText = res.result.durationMs + 'ms';
      document.getElementById('s3-m-cost').innerText = '$' + res.result.costUsd.toFixed(6);
      document.getElementById('s3-out').style.display = 'block';
      document.getElementById('s3-json').innerText = JSON.stringify(res, null, 2);
    }

    async function runS4Agent() {
      await window.__smartContactApp.ready;
      const res = await window.__smartContactApp.runStage4Agent('Issue a $150 refund for defective order ord_123');
      document.getElementById('s4-out').style.display = 'block';
      document.getElementById('s4-json').innerText = JSON.stringify(res, null, 2);
      if (res.state === 'NEEDS_APPROVAL' && res.pendingApproval) {
        s4Token = res.pendingApproval.approvalToken;
        document.getElementById('s4-approval-box').style.display = 'flex';
        document.getElementById('s4-token').innerText = s4Token;
        document.getElementById('s4-reason').innerText = res.pendingApproval.reason;
      }
    }

    async function approveS4() {
      if (!s4Token) return;
      const res = await window.__smartContactApp.approveStage4Agent(s4Token);
      document.getElementById('s4-approval-box').style.display = 'none';
      document.getElementById('s4-json').innerText = JSON.stringify(res, null, 2);
    }

    async function runS4Idemp() {
      await window.__smartContactApp.ready;
      const res = await window.__smartContactApp.runStage4Idempotency('idemp_999');
      document.getElementById('s4-out').style.display = 'block';
      document.getElementById('s4-json').innerText = JSON.stringify(res, null, 2);
    }

    async function runS5(mode) {
      await window.__smartContactApp.ready;
      const res = await window.__smartContactApp.runStage5Eval(mode);
      document.getElementById('s5-metrics').style.display = 'grid';
      document.getElementById('s5-m-gate').innerText = res.passed ? 'PASSED' : 'BLOCKED';
      document.getElementById('s5-m-gate').style.color = res.passed ? '#34d399' : '#ef4444';
      document.getElementById('s5-m-rate').innerText = (res.passRate * 100).toFixed(0) + '%';
      document.getElementById('s5-m-score').innerText = res.averageScore;
      document.getElementById('s5-out').style.display = 'block';
      document.getElementById('s5-json').innerText = JSON.stringify(res, null, 2);
    }

    async function runMasterIngest() {
      await window.__smartContactApp.ready;
      const txt = document.getElementById('m-ingest-txt').value;
      const res = await window.__smartContactApp.ingestContact(txt);
      document.getElementById('m-out').style.display = 'block';
      document.getElementById('m-json').innerText = JSON.stringify(res, null, 2);
      loadMasterTraces();
    }

    async function runMasterSearch() {
      await window.__smartContactApp.ready;
      const q = document.getElementById('m-search-txt').value;
      const res = await window.__smartContactApp.searchContacts(q, 5);
      document.getElementById('m-out').style.display = 'block';
      document.getElementById('m-json').innerText = JSON.stringify(res, null, 2);
      loadMasterTraces();
    }

    async function loadMasterTraces() {
      await window.__smartContactApp.ready;
      const traces = window.__smartContactApp.getTraceTree();
      const tbody = document.getElementById('m-traces');
      tbody.innerHTML = '';
      traces.forEach(s => {
        const row = document.createElement('tr');
        row.innerHTML = \`<td style="color:#60a5fa;">\${s.name}</td><td>\${s.traceId.slice(0,12)}...</td><td><span class="tag tag-green">\${s.status}</span></td><td>\${s.durationMs ?? 0}ms</td>\`;
        tbody.appendChild(row);
      });
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf-8');
console.log('✅ Static GitHub Pages site (All 5 Stages + Master Project) built successfully in dist-web/');
