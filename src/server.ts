/**
 * Interactive Local Web Server & Dashboard for AI Backend Engineering Fundamentals
 * 
 * Provides an interactive UI and REST API endpoints to explore all 5 stages:
 * - Stage 1: Ingestion & Resilient Extraction with Cost Logging
 * - Stage 2 & 3: Hybrid Search (BM25 + Dense + RRF + Decay) & Multi-Tier Caching
 * - Stage 4: Safe Autonomous CRM Agent with HITL Approval Gate
 * - Stage 5: OpenTelemetry Distributed Trace Tree Viewer
 */

import http from 'node:http';
import { SmartContactService } from '../projects/smart-contact-list/src/SmartContactService.ts';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const service = new SmartContactService();

/**
 * Pre-populates initial contact data so the UI is immediately ready to query.
 */
async function seedInitialData() {
  await service.ingestContact(
    'Met with Dr. Gordon Freeman from Black Mesa Anomalous Materials. Email: gordon.freeman@blackmesa.gov. ' +
    'Specializes in quantum displacement and resonance hazard mitigation.'
  );
  await service.ingestContact(
    'Conference sync with Sarah Connor at Cyberdyne Systems. Email: sarah@cyberdyne.com. ' +
    'Leading defense infrastructure and neural network safeguards.'
  );
}

// Seed data in background
seedInitialData().catch(console.error);

/**
 * Helper to parse incoming JSON request body.
 */
function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Helper to send JSON responses with CORS headers.
 */
function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // ---------------------------------------------------------------------------
  // REST API Routes
  // ---------------------------------------------------------------------------
  try {
    if (pathname === '/api/contacts' && req.method === 'GET') {
      const contacts = service.getAllContacts();
      return sendJson(res, 200, { contacts });
    }

    if (pathname === '/api/ingest' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.text || typeof body.text !== 'string') {
        return sendJson(res, 400, { error: 'Missing required field: text' });
      }
      const result = await service.ingestContact(body.text);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/search' && req.method === 'GET') {
      const query = url.searchParams.get('q') || '';
      const topK = parseInt(url.searchParams.get('topK') || '5', 10);
      const result = await service.searchContacts(query, topK);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/agent' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.directive || typeof body.directive !== 'string') {
        return sendJson(res, 400, { error: 'Missing required field: directive' });
      }
      const result = await service.executeAgentDirective(body.directive);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/approve' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.token || typeof body.token !== 'string') {
        return sendJson(res, 400, { error: 'Missing required field: token' });
      }
      const result = await service.approveOperation(body.token);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/traces' && req.method === 'GET') {
      const traces = service.getTraceTree();
      return sendJson(res, 200, { traces });
    }

    // -------------------------------------------------------------------------
    // HTML Dashboard Route
    // -------------------------------------------------------------------------
    if (pathname === '/' && (req.method === 'GET' || req.method === 'HEAD')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end(getDashboardHtml());
      }
      return;
    }

    // 404 for unknown paths
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  } catch (error: any) {
    console.error('API Error:', error);
    sendJson(res, 500, { error: error.message || 'Internal Server Error' });
  }
});

/**
 * Returns self-contained modern HTML/CSS/JS single-page application.
 */
function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Backend Engineering Fundamentals — Interactive UI</title>
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

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #3b82f6, #10b981);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
      color: white;
    }

    .brand-title {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .brand-sub {
      font-size: 12px;
      color: var(--text-muted);
    }

    .nav-links {
      display: flex;
      gap: 12px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.85); }
    }

    main {
      flex: 1;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      padding: 24px 32px 48px;
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;
    }

    /* Sidebar Navigation */
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 8px;
      color: var(--text-muted);
      font-family: var(--font-sans);
      font-size: 14px;
      font-weight: 600;
      text-align: left;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tab-btn:hover {
      background: rgba(255, 255, 255, 0.04);
      color: var(--text);
    }

    .tab-btn.active {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.4);
      color: #60a5fa;
    }

    .tab-icon {
      font-size: 18px;
    }

    /* Content Area */
    .content-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    }

    .card-header {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--card-border);
    }

    .card-title {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .card-desc {
      color: var(--text-muted);
      font-size: 13px;
      margin-top: 4px;
    }

    /* Form Elements */
    .form-group {
      margin-bottom: 16px;
    }

    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--text);
    }

    textarea, input[type="text"] {
      width: 100%;
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 12px;
      color: var(--text);
      font-family: var(--font-sans);
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s ease;
    }

    textarea:focus, input[type="text"]:focus {
      border-color: var(--card-border-focus);
    }

    textarea {
      min-height: 110px;
      resize: vertical;
      line-height: 1.5;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 18px;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 8px;
      font-family: var(--font-sans);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .btn:hover {
      background: var(--primary-hover);
    }

    .btn-danger {
      background: var(--danger);
    }
    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.14);
    }

    /* Metrics & Output display */
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin: 16px 0;
    }

    .metric-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 12px;
    }

    .metric-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .metric-val {
      font-size: 18px;
      font-weight: 700;
      margin-top: 4px;
      font-family: var(--font-mono);
      color: #60a5fa;
    }

    .output-card {
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
      font-family: var(--font-mono);
      font-size: 13px;
      overflow-x: auto;
    }

    .tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-right: 6px;
    }
    .tag-blue { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
    .tag-green { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
    .tag-amber { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }

    /* Approval Banner */
    .approval-banner {
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    /* Trace list table */
    .trace-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 16px;
    }

    .trace-table th {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--card-border);
      color: var(--text-muted);
      font-weight: 600;
      font-size: 12px;
    }

    .trace-table td {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(31, 41, 55, 0.6);
      font-family: var(--font-mono);
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-logo">AI</div>
      <div>
        <div class="brand-title">AI Backend Engineering Fundamentals</div>
        <div class="brand-sub">Local Interactive Verification Dashboard</div>
      </div>
    </div>
    <div class="nav-links">
      <div class="badge">
        <span class="badge-dot"></span>
        <span>Local Backend Ready</span>
      </div>
      <a href="https://github.com/SuisSanem000/ai-backend-engineering-fundumentals" target="_blank" class="btn btn-secondary" style="font-size:12px; padding:6px 12px;">GitHub Repo</a>
    </div>
  </header>

  <main>
    <div class="sidebar">
      <button class="tab-btn active" onclick="switchTab('ingest')">
        <span class="tab-icon">📥</span>
        <span>1. Resilient Ingest</span>
      </button>
      <button class="tab-btn" onclick="switchTab('search')">
        <span class="tab-icon">🔍</span>
        <span>2 & 3. Hybrid Search</span>
      </button>
      <button class="tab-btn" onclick="switchTab('agent')">
        <span class="tab-icon">🛡️</span>
        <span>4. Safe Agent & HITL</span>
      </button>
      <button class="tab-btn" onclick="switchTab('traces')">
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

      <div style="display:flex; gap:10px;">
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
        <pre><code id="ingest-json">// Extraction output will render here</code></pre>
      </div>
    </div>

    <!-- TAB 2: SEARCH -->
    <div id="tab-search" class="content-card" style="display:none;">
      <div class="card-header">
        <div class="card-title">🔍 Stage 2 & 3: Hybrid Search & Multi-Tier Caching</div>
        <div class="card-desc">Reciprocal Rank Fusion (BM25 + Dense Vectors) with Freshness Decay, intercepted by L1 Exact SHA-256 and L2 Semantic Vector caches.</div>
      </div>

      <div class="form-group">
        <label>Search Query</label>
        <div style="display:flex; gap:8px;">
          <input type="text" id="search-input" value="quantum displacement resonance" placeholder="Enter keywords or semantic questions...">
          <button class="btn" onclick="handleSearch()">Search</button>
        </div>
      </div>

      <div style="display:flex; gap:8px; margin-bottom:16px;">
        <button class="btn btn-secondary" style="font-size:12px; padding:4px 10px;" onclick="quickSearch('quantum displacement resonance')">Query A (Original)</button>
        <button class="btn btn-secondary" style="font-size:12px; padding:4px 10px;" onclick="quickSearch('quantum displacement resonance')">Query A (Exact L1 Cache Hit)</button>
        <button class="btn btn-secondary" style="font-size:12px; padding:4px 10px;" onclick="quickSearch('quantum resonance mitigation black mesa')">Query B (Semantic L2 Cache Hit)</button>
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
          <div style="font-weight:700; color:#fbbf24; display:flex; align-items:center; gap:6px;">
            <span>⚠️ Action Requires Human Authorization</span>
          </div>
          <div id="approval-reason" style="font-size:13px; color:var(--text); margin-top:4px;">
            Tool <code>issue_contact_refund</code> is gated.
          </div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:4px; font-family:var(--font-mono);">
            Token: <span id="approval-token-text">-</span>
          </div>
        </div>
        <button class="btn" style="background:#10b981;" onclick="handleApprove()">Approve & Resume</button>
      </div>

      <div id="agent-output" class="output-card" style="display:none;">
        <pre><code id="agent-log">// Execution steps will render here</code></pre>
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
          <tr><td colspan="4" style="color:var(--text-muted); text-align:center;">No traces recorded yet. Execute an action to record spans.</td></tr>
        </tbody>
      </table>
    </div>
  </main>

  <script>
    let activeToken = null;

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.content-card').forEach(c => c.style.display = 'none');
      
      const btn = event.currentTarget || document.querySelector(\`[onclick="switchTab('\${tabId}')"]\`);
      if (btn) btn.classList.add('active');
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
      const text = document.getElementById('ingest-input').value;
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();

      document.getElementById('ingest-metrics').style.display = 'grid';
      document.getElementById('m-ingest-time').innerText = data.durationMs + 'ms';
      document.getElementById('m-ingest-tokens').innerText = data.tokensUsed;
      document.getElementById('m-ingest-cost').innerText = '$' + Number(data.costUsd).toFixed(6);

      document.getElementById('ingest-result').style.display = 'block';
      document.getElementById('ingest-json').innerText = JSON.stringify(data.contact, null, 2);
    }

    async function handleSearch() {
      const q = document.getElementById('search-input').value;
      const res = await fetch('/api/search?q=' + encodeURIComponent(q));
      const data = await res.json();

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
        card.style.background = 'var(--code-bg)';
        card.style.border = '1px solid var(--card-border)';
        card.style.borderRadius = '8px';
        card.style.padding = '14px';
        card.style.marginBottom = '10px';

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
      const directive = document.getElementById('agent-input').value;
      document.getElementById('approval-box').style.display = 'none';

      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directive })
      });
      const data = await res.json();

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
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: activeToken })
      });
      const data = await res.json();

      document.getElementById('approval-box').style.display = 'none';
      document.getElementById('agent-log').innerText = JSON.stringify(data, null, 2);
    }

    async function loadTraces() {
      const res = await fetch('/api/traces');
      const data = await res.json();
      const tbody = document.getElementById('trace-rows');
      tbody.innerHTML = '';

      if (!data.traces || data.traces.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:var(--text-muted); text-align:center;">No traces recorded yet.</td></tr>';
        return;
      }

      data.traces.forEach(span => {
        const row = document.createElement('tr');
        row.innerHTML = \`
          <td style="color:#60a5fa; font-weight:600;">\${span.name}</td>
          <td style="color:var(--text-muted); font-size:11px;">\${span.traceId.slice(0, 16)}...</td>
          <td><span class="tag tag-green">\${span.status}</span></td>
          <td>\${span.durationMs ?? 0}ms</td>
        \`;
        tbody.appendChild(row);

        if (span.children) {
          span.children.forEach(child => {
            const childRow = document.createElement('tr');
            childRow.innerHTML = \`
              <td style="padding-left:32px; color:#93c5fd;">└─ \${child.name}</td>
              <td style="color:var(--text-muted); font-size:11px;">\${child.traceId.slice(0, 16)}...</td>
              <td><span class="tag tag-green">\${child.status}</span></td>
              <td>\${child.durationMs ?? 0}ms</td>
            \`;
            tbody.appendChild(childRow);
          });
        }
      });
    }
  </script>
</body>
</html>`;
}

server.listen(PORT, () => {
  console.log(`\n============================================================`);
  console.log(`🌐 AI Backend Engineering UI Dashboard running on:`);
  console.log(`   👉 http://localhost:${PORT}`);
  console.log(`============================================================\n`);
});
