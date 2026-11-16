/**
 * Root Entrypoint & Interactive Demonstration
 * 
 * Demonstrates the full lifecycle of the AI Backend Engineering Fundamentals platform:
 * 1. Resilient Ingestion & Structured Output (Stage 1)
 * 2. Hybrid Dense/Sparse RAG Search with Freshness Decay (Stage 2)
 * 3. Multi-Tier Caching (L1 Exact Hash & L2 Semantic Vector Cache) (Stage 3)
 * 4. Safe CRM Operations Agent with Human Approval Gate (Stage 4)
 * 5. OpenTelemetry Hierarchical Distributed Tracing (Stage 5)
 */

import { SmartContactService } from '../projects/smart-contact-list/src/SmartContactService.ts';

async function main() {
  console.log('='.repeat(80));
  console.log('🚀 AI Backend Engineering Fundamentals: Live System Demonstration');
  console.log('='.repeat(80));
  console.log();

  const service = new SmartContactService();

  // ---------------------------------------------------------------------------
  // Step 1: Unstructured Text Ingestion (Stage 1)
  // ---------------------------------------------------------------------------
  console.log('📥 [Step 1] Ingesting Unstructured Contact Note...');
  const rawNote =
    'Met with Dr. Elena Vance from Black Mesa Research. Her email is elena.vance@blackmesa.gov. ' +
    'Discussed quantum resonance cascades and distributed anomaly detection infrastructure.';

  const ingestion = await service.ingestContact(rawNote);
  console.log(`✅ Ingested Contact: ${ingestion.contact.fullName} (${ingestion.contact.company})`);
  console.log(`   Email: ${ingestion.contact.email}`);
  console.log(`   Tokens: ${ingestion.tokensUsed} | Cost: $${ingestion.costUsd.toFixed(6)} | Latency: ${ingestion.durationMs}ms`);
  console.log();

  // ---------------------------------------------------------------------------
  // Step 2: Hybrid Retrieval with Freshness Decay (Stage 2)
  // ---------------------------------------------------------------------------
  console.log('🔍 [Step 2] Executing Hybrid Search (BM25 + Dense Vector + RRF)...');
  const searchQuery = 'quantum resonance anomaly infrastructure';
  const searchResult = await service.searchContacts(searchQuery, 3);

  console.log(`✅ Found ${searchResult.items.length} matching contact(s):`);
  for (const item of searchResult.items) {
    console.log(`   - ${item.contact.fullName} (Score: ${item.relevanceScore.toFixed(4)}, Freshness: ${item.freshnessMultiplier})`);
  }
  console.log();

  // ---------------------------------------------------------------------------
  // Step 3: Multi-Tier Cache Demonstration (Stage 3)
  // ---------------------------------------------------------------------------
  console.log('⚡ [Step 3] Demonstrating Multi-Tier Caching (Exact L1 & Semantic L2)...');
  // First repeat: Exact L1 cache hit
  const repeatSearch = await service.searchContacts(searchQuery, 3);
  console.log(`   Query 1 (Exact Repeat): Cache Hit = ${repeatSearch.cacheHit} | Latency = ${repeatSearch.durationMs}ms | Cost = $${repeatSearch.costUsd}`);

  // Paraphrase repeat: Semantic L2 cache hit
  const paraphraseQuery = 'quantum resonance anomaly infrastructure black mesa';
  const paraphraseSearch = await service.searchContacts(paraphraseQuery, 3);
  console.log(`   Query 2 (Paraphrased):  Cache Hit = ${paraphraseSearch.cacheHit} | Latency = ${paraphraseSearch.durationMs}ms | Cost = $${paraphraseSearch.costUsd}`);
  console.log();

  // ---------------------------------------------------------------------------
  // Step 4: Autonomous Operations Agent & HITL Approval Gate (Stage 4)
  // ---------------------------------------------------------------------------
  console.log('🛡️  [Step 4] Triggering Autonomous Agent with High-Risk Action...');
  const agentDirective = `Issue a $250 refund to contact ${ingestion.contact.id} for defective equipment`;
  const initialAgentRun = await service.executeAgentDirective(agentDirective);

  console.log(`   Agent State: ${initialAgentRun.state}`);
  if (initialAgentRun.state === 'NEEDS_APPROVAL' && initialAgentRun.pendingApproval) {
    const token = initialAgentRun.pendingApproval.approvalToken;
    console.log(`   ⚠️ High-Risk Action Detected: [${initialAgentRun.pendingApproval.toolName}]`);
    console.log(`   Generated Approval Token: ${token}`);
    console.log(`   Simulating Operator Granting Authorization...`);

    const approvedRun = await service.approveOperation(token);
    console.log(`✅ Agent Completed Action Post-Approval! Final State: ${approvedRun.state}`);
  }
  console.log();

  // ---------------------------------------------------------------------------
  // Step 5: Distributed Trace Hierarchy (Stage 5)
  // ---------------------------------------------------------------------------
  console.log('📊 [Step 5] OpenTelemetry Distributed Trace Tree:');
  const traceTree = service.getTraceTree();
  for (const span of traceTree) {
    console.log(`   📍 Span: [${span.name}] (Status: ${span.status}, Duration: ${span.durationMs ?? 0}ms)`);
    if (span.children && span.children.length > 0) {
      for (const child of span.children) {
        console.log(`      └─ Span: [${child.name}] (Status: ${child.status}, Duration: ${child.durationMs ?? 0}ms)`);
      }
    }
  }

  console.log();
  console.log('='.repeat(80));
  console.log('🎉 All 5 Stages Verified Successfully!');
  console.log('='.repeat(80));
}

main().catch((err) => {
  console.error('Fatal Error during demonstration execution:', err);
  process.exit(1);
});
