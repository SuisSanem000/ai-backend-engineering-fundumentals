/**
 * Build script for static GitHub Pages deployment.
 * Compiles the TypeScript SmartContactService into a browser-executable bundle
 * and generates dist-web/index.html for zero-server live execution.
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
  <title>AI Backend Engineering Fundamentals — Live Interactive Release</title>
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
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      background: rgba(17, 24, 39, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--card-border);
      padding: 16px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-logo {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #3b82f6, #10b981);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
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
    .badge-dot {
      width: 6px; height: 6px; background: #10b981; border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }

    main {
      flex: 1; max-width: 1400px; margin: 0 auto; width: 100%;
      padding: 24px 32px 48px;
      display: grid; grid-template-columns: 280px 1fr; gap: 24px;
    }

    .sidebar { display: flex; flex-direction: column; gap: 8px; }
    .tab-btn {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px;
      background: transparent; border: 1px solid transparent; border-radius: 8px;
      color: var(--text-muted); font-family: var(--font-sans); font-size: 14px; font-weight: 600;
      text-align: left; cursor: pointer; transition: all 0.15s ease;
    }
    .tab-btn:hover { background: rgba(255, 255, 255, 0.04); color: var(--text); }
    .tab-btn.active {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.4);
      color: #60a5fa;
    }
    .tab-icon { font-size: 18px; }

    .content-card {
      background: var(--card-bg); border: 1px solid var(--card-border);
      border-radius: 12px; padding: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    }
    .card-header { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--card-border); }
    .card-title { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; display: flex; align-items: center; gap: 10px; }
    .card-desc { color: var(--text-muted); font-size: 13px; margin-top: 4px; }

    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--text); }
    textarea, input[type="text"] {
      width: 100%; background: var(--code-bg); border: 1px solid var(--card-border);
      border-radius: 8px; padding: 12px; color: var(--text);
      font-family: var(--font-sans); font-size: 14px; outline: none; transition: border-color 0.15s ease;
    }
    textarea:focus, input[type="text"]:focus { border-color: var(--card-border-focus); }
    textarea { min-height: 110px; resize: vertical; line-height: 1.5; }

    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 10px 18px; background: var(--primary); color: white; border: none;
      border-radius: 8px; font-family: var(--font-sans); font-size: 14px; font-weight: 600;
      cursor: pointer; transition: background 0.15s ease; text-decoration: none;
    }
    .btn:hover { background: var(--primary-hover); }
    .btn-secondary { background: rgba(255, 255, 255, 0.08); color: var(--text); }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.14); }

    .metric-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px; margin: 16px 0;
    }
    .metric-box {
      background: rgba(255, 255, 255, 0.03); border: 1px solid var(--card-border);
      border-radius: 8px; padding: 12px;
    }
    .metric-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }
    .metric-val { font-size: 18px; font-weight: 700; margin-top: 4px; font-family: var(--font-mono); color: #60a5fa; }

    .output-card {
      background: var(--code-bg); border: 1px solid var(--card-border); border-radius: 8px;
      padding: 16px; margin-top: 16px; font-family: var(--font-mono); font-size: 13px; overflow-x: auto;
    }

    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 6px; }
    .tag-blue { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
    .tag-green { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }

    .approval-banner {
      background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 8px; padding: 16px; margin: 16px 0;
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
    }

    .trace-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }
    .trace-table th { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--card-border); color: var(--text-muted); font-weight: 600; font-size: 12px; }
    .trace-table td { padding: 10px 12px; border-bottom: 1px solid rgba(31, 41, 55, 0.6); font-family: var(--font-mono); }

    @media (max-width: 768px) {
      main { grid-template-columns: 1fr; padding: 16px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-logo">AI</div>
      <div>
        <div class="brand-title">AI Backend Engineering Fundamentals</div>
        <div class="brand-sub">Live Interactive Release (Stages 1–5 in TypeScript)</div>
      </div>
    </div>
    <div class="nav-links">
      <div class="badge">
        <span class="badge-dot"></span>
        <span>Live Browser Runtime</span>
      </div>
      <a href="https://github.com/SuisSanem000/ai-backend-engineering-fundumentals" target="_blank" class="btn btn-secondary" style="font-size:12px; padding:6px 12px;">GitHub Repo</a>
    </div>
  </header>

  <main>
    <div class="sidebar">
      <button class="tab-btn active" onclick="switchTab('ingest', this)">
        <span class="tab-icon">📥</span>
        <span>1. Resilient Ingest</span>
      </button>
      <button class="tab-btn" onclick="switchTab('search', this)">
        <span class="tab-icon">🔍</span>
        <span>2 & 3. Hybrid Search</span>
      </button>
      <button class="tab-btn" onclick="switchTab('agent', this)">
        <span class="tab-icon">🛡️</span>
        <span>4. Safe Agent & HITL</span>
      </button>
      <button class="tab-btn" onclick="switchTab('traces', this)">
        <span class="tab-icon">📊</span>
        <span>5. OpenTelemetry</span>
      </button>
    </div>

    <!-- TAB 1: INGEST -->
    <div id="tab-ingest" class="content-card">
      <div class="card-header">
        <div class="card-title">📥 Stage 1: Resilient Contact Extraction</div>
        <div class="card-desc">Converts messy, unstructured text into strongly-typed ContactRecords with timeouts, circuit breakers, and cost metering.</div>
      </div>

      <div class="form-group">
        <label>Unstructured Input Text (Email, Notes, Call Log)</label>
        <textarea id="ingest-input">Met with Dr. Alex Vance at Aperture Labs. Email is alex.vance@aperture.com. Discussed portal telemetry pipelines and gravitational flux isolation.</textarea>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn" onclick="handleIngest()">Extract & Ingest</button>
        <button class="btn btn-secondary" onclick="loadSampleText(1)">Sample 1</button>
        <button class="btn btn-secondary" onclick="loadSampleText(2)">Sample 2</button>
      </div>

      <div id="ingest-metrics" class="metric-grid" style="display:none;">
        <div class="metric-box">
          <div class="metric-label">Execution Time</div>
          <div id="m-ingest-time" class="metric-val">-</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Tokens Used</div>
          <div id="m-ingest-tokens" class="metric-val">-</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Cost (USD)</div>
          <div id="m-ingest-cost" class="metric-val">-</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Circuit Status</div>
          <div id="m-ingest-circuit" class="metric-val" style="color:#34d399">CLOSED</div>
        </div>
      </div>

      <div id="ingest-result" class="output-card" style="display:none;">
        <pre><code id="ingest-json"></code></pre>
      </div>
    </div>

    <!-- TAB 2: SEARCH -->
    <div id="tab-search" class="content-card" style="display:none;">
      <div class="card-header">
        <div class="card-title">🔍 Stage 2 & 3: Hybrid Search & Multi-Tier Caching</div>
        <div class="card-desc">Reciprocal Rank Fusion (BM25 + Dense Vectors) with Freshness Decay, intercepted by L1 Exact Hash and L2 Semantic Vector caches.</div>
      </div>

      <div class="form-group">
        <label>Search Query</label>
        <div style="display:flex; gap:8px;">
          <input type="text" id="search-input" value="quantum displacement resonance" placeholder="Enter keywords or semantic questions...">
          <button class="btn" onclick="handleSearch()">Search</button>
        </div>
      </div>

      <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;">
        <button class="btn btn-secondary" style="font-size:12px; padding:4px 10px;" onclick="quickSearch('quantum displacement resonance')">Query A (Original)</button>
        <button class="btn btn-secondary" style="font-size:12px; padding:4px 10px;" onclick="quickSearch('quantum displacement resonance')">Query A (Exact L1 Hit)</button>
        <button class="btn btn-secondary" style="font-size:12px; padding:4px 10px;" onclick="quickSearch('quantum displacement resonance mitigation')">Query B (Semantic L2 Hit)</button>
      </div>

      <div id="search-metrics" class="metric-grid" style="display:none;">
        <div class="metric-box">
          <div class="metric-label">Cache Level</div>
          <div id="m-search-cache" class="metric-val">-</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Latency</div>
          <div id="m-search-time" class="metric-val">-</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Cost</div>
          <div id="m-search-cost" class="metric-val">-</div>
        </div>
      </div>

      <div id="search-results-list" style="margin-top:16px;"></div>
    </div>

    <!-- TAB 3: AGENT -->
    <div id="tab-agent" class="content-card" style="display:none;">
      <div class="card-header">
        <div class="card-title">🛡️ Stage 4: Safe Agent with Approval Gate</div>
        <div class="card-desc">ReAct agent bound by strict step budgets, idempotency keys, and Human-in-the-Loop approval tokens for high-risk mutations.</div>
      </div>

      <div class="form-group">
        <label>Agent Directive</label>
        <input type="text" id="agent-input" value="Issue a $250 refund to contact Sarah Connor for defective equipment">
      </div>

      <button class="btn" onclick="handleAgentRun()">Execute Agent Directive</button>

      <div id="approval-box" class="approval-banner" style="display:none;">
        <div>
          <div style="font-weight:700; color:#fbbf24;">⚠️ Action Requires Human Authorization</div>
          <div id="approval-reason" style="font-size:13px; color:var(--text); margin-top:4px;"></div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:4px; font-family:var(--font-mono);">
            Token: <span id="approval-token-text">-</span>
          </div>
        </div>
        <button class="btn" style="background:#10b981;" onclick="handleApprove()">Approve & Resume</button>
      </div>

      <div id="agent-output" class="output-card" style="display:none;">
        <pre><code id="agent-log"></code></pre>
      </div>
    </div>

    <!-- TAB 4: TRACES -->
    <div id="tab-traces" class="content-card" style="display:none;">
      <div class="card-header">
        <div class="card-title">📊 Stage 5: OpenTelemetry Distributed Traces</div>
        <div class="card-desc">Hierarchical trace tree recording start/end timestamps, duration, tokens, cost, and lifecycle states.</div>
      </div>

      <button class="btn btn-secondary" onclick="loadTraces()">Refresh Trace Tree</button>

      <table class="trace-table">
        <thead>
          <tr>
            <th>Span Name</th>
            <th>Trace ID</th>
            <th>Status</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody id="trace-rows">
          <tr><td colspan="4" style="color:var(--text-muted); text-align:center;">Loading traces...</td></tr>
        </tbody>
      </table>
    </div>
  </main>

  <script src="./browser-app.js"></script>
  <script>
    let activeToken = null;

    function switchTab(tabId, btnEl) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.content-card').forEach(c => c.style.display = 'none');
      if (btnEl) btnEl.classList.add('active');
      document.getElementById('tab-' + tabId).style.display = 'block';
      if (tabId === 'traces') loadTraces();
    }

    function loadSampleText(num) {
      const samples = {
        1: "Met with Sarah Connor from Cyberdyne Systems today. Email: sarah@cyberdyne.com. Discussed neural network defense architecture and infrastructure security.",
        2: "Sync with Dr. Gordon Freeman at Black Mesa. Email: gordon.freeman@blackmesa.gov. Reviewed quantum displacement safeguards and hazard mitigation."
      };
      document.getElementById('ingest-input').value = samples[num] || '';
    }

    async function handleIngest() {
      await window.__smartContactApp.ready;
      const text = document.getElementById('ingest-input').value;
      const data = await window.__smartContactApp.ingestContact(text);

      document.getElementById('ingest-metrics').style.display = 'grid';
      document.getElementById('m-ingest-time').innerText = data.durationMs + 'ms';
      document.getElementById('m-ingest-tokens').innerText = data.tokensUsed;
      document.getElementById('m-ingest-cost').innerText = '$' + Number(data.costUsd).toFixed(6);

      document.getElementById('ingest-result').style.display = 'block';
      document.getElementById('ingest-json').innerText = JSON.stringify(data.contact, null, 2);
    }

    async function handleSearch() {
      await window.__smartContactApp.ready;
      const q = document.getElementById('search-input').value;
      const data = await window.__smartContactApp.searchContacts(q, 5);

      document.getElementById('search-metrics').style.display = 'grid';
      document.getElementById('m-search-cache').innerText = data.cacheHit;
      document.getElementById('m-search-cache').style.color = data.cacheHit === 'NONE' ? '#9ca3af' : '#34d399';
      document.getElementById('m-search-time').innerText = data.durationMs + 'ms';
      document.getElementById('m-search-cost').innerText = '$' + Number(data.costUsd).toFixed(6);

      const list = document.getElementById('search-results-list');
      list.innerHTML = '';

      if (data.items.length === 0) {
        list.innerHTML = '<div style="color:var(--text-muted); font-size:13px;">No matching contacts found.</div>';
        return;
      }

      data.items.forEach(item => {
        const card = document.createElement('div');
        card.style.cssText = 'background:var(--code-bg);border:1px solid var(--card-border);border-radius:8px;padding:14px;margin-bottom:10px;';
        card.innerHTML = \`
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:700; font-size:15px; color:#60a5fa;">\${item.contact.fullName}</div>
            <div>
              <span class="tag tag-blue">Score: \${item.relevanceScore}</span>
              <span class="tag tag-green">Freshness: \${item.freshnessMultiplier}</span>
            </div>
          </div>
          <div style="font-size:13px; color:var(--text-muted); margin-top:4px;">\${item.contact.company} • \${item.contact.email}</div>
          <div style="font-size:12px; color:var(--text); margin-top:8px; line-height:1.4;">\${item.matchedSnippet}</div>
        \`;
        list.appendChild(card);
      });
    }

    function quickSearch(q) {
      document.getElementById('search-input').value = q;
      handleSearch();
    }

    async function handleAgentRun() {
      await window.__smartContactApp.ready;
      const directive = document.getElementById('agent-input').value;
      document.getElementById('approval-box').style.display = 'none';

      const data = await window.__smartContactApp.executeAgentDirective(directive);
      document.getElementById('agent-output').style.display = 'block';
      document.getElementById('agent-log').innerText = JSON.stringify(data, null, 2);

      if (data.state === 'NEEDS_APPROVAL' && data.pendingApproval) {
        activeToken = data.pendingApproval.approvalToken;
        document.getElementById('approval-box').style.display = 'flex';
        document.getElementById('approval-token-text').innerText = activeToken;
        document.getElementById('approval-reason').innerText = data.pendingApproval.reason;
      }
    }

    async function handleApprove() {
      if (!activeToken) return;
      const data = await window.__smartContactApp.approveOperation(activeToken);
      document.getElementById('approval-box').style.display = 'none';
      document.getElementById('agent-log').innerText = JSON.stringify(data, null, 2);
    }

    async function loadTraces() {
      await window.__smartContactApp.ready;
      const traces = window.__smartContactApp.getTraceTree();
      const tbody = document.getElementById('trace-rows');
      tbody.innerHTML = '';

      if (!traces || traces.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:var(--text-muted); text-align:center;">No traces recorded yet.</td></tr>';
        return;
      }

      traces.forEach(span => {
        const row = document.createElement('tr');
        row.innerHTML = \`
          <td style="color:#60a5fa; font-weight:600;">\${span.name}</td>
          <td style="color:var(--text-muted); font-size:11px;">\${span.traceId.slice(0, 16)}...</td>
          <td><span class="tag tag-green">\${span.status}</span></td>
          <td>\${span.durationMs ?? 0}ms</td>
        \`;
        tbody.appendChild(row);
      });
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf-8');
console.log('✅ Static GitHub Pages site built successfully in dist-web/');
