/**
 * Browser Bundle Entrypoint for GitHub Pages Deployment
 * 
 * Exposes interactive playgrounds for all 5 Stages + the Master Project (Smart Contact List)
 * directly in the browser runtime.
 */

import { ResilientLLMClient } from '../stages/01-resilient-llm-calls/src/ResilientLLMClient.ts';
import { MockLLMProvider } from '../stages/01-resilient-llm-calls/src/MockLLMProvider.ts';
import { HybridSearchEngine } from '../stages/02-retrieval-rag/src/HybridSearchEngine.ts';
import { RAGPipeline } from '../stages/02-retrieval-rag/src/RAGPipeline.ts';
import { CostLatencyOptimizer } from '../stages/03-cost-and-latency/src/CostLatencyOptimizer.ts';
import { ModelRouter } from '../stages/03-cost-and-latency/src/ModelRouter.ts';
import { ToolRegistry } from '../stages/04-production-agents/src/ToolRegistry.ts';
import { IdempotencyStore } from '../stages/04-production-agents/src/IdempotencyStore.ts';
import { ApprovalGate } from '../stages/04-production-agents/src/ApprovalGate.ts';
import { SafeAgentRunner } from '../stages/04-production-agents/src/SafeAgentRunner.ts';
import { CIEvalRunner } from '../stages/05-evals-observability/src/CIEvalRunner.ts';
import { SmartContactService } from '../projects/smart-contact-list/src/SmartContactService.ts';
import { z } from 'zod';

// -----------------------------------------------------------------------------
// Stage 2 Lab Setup (Pre-indexed fresh vs stale docs)
// -----------------------------------------------------------------------------
const stage2Engine = new HybridSearchEngine();
const now = Date.now();
stage2Engine.indexChunks([
  {
    chunkId: 'policy_2022:chunk_0',
    docId: 'policy_2022',
    index: 0,
    content: 'Legacy refund policy (2022): Customers have 14 calendar days to request a refund.',
    estimatedTokens: 16,
    metadata: { timestamp: now - 365 * 24 * 60 * 60 * 1000, year: 2022 },
  },
  {
    chunkId: 'policy_2026:chunk_0',
    docId: 'policy_2026',
    index: 0,
    content: 'Updated refund policy (2026): Customers have 30 calendar days for a full refund.',
    estimatedTokens: 16,
    metadata: { timestamp: now - 2 * 24 * 60 * 60 * 1000, year: 2026 },
  },
  {
    chunkId: 'error_codes:chunk_0',
    docId: 'error_codes',
    index: 0,
    content: 'Troubleshooting ERR_SOCKET_HANGUP_V2: Increase timeoutMs and enable exponential backoff.',
    estimatedTokens: 15,
    metadata: { timestamp: now - 5 * 24 * 60 * 60 * 1000, category: 'runbook' },
  },
]);

const stage2Rag = new RAGPipeline(
  stage2Engine,
  new ResilientLLMClient(
    { primaryModel: 'gemini-1.5-pro', timeoutMs: 2000, maxRetries: 1, baseBackoffMs: 10 },
    new MockLLMProvider({
      modelName: 'gemini-1.5-pro',
      simulatedLatencyMs: 10,
      defaultResponse: 'Based on current policy, customers have 30 calendar days for a full refund [policy_2026:chunk_0].',
    })
  )
);

// -----------------------------------------------------------------------------
// Stage 3 Lab Setup (Optimizer & Router)
// -----------------------------------------------------------------------------
const stage3Optimizer = new CostLatencyOptimizer();
const stage3Router = new ModelRouter({
  economyModel: 'gemini-1.5-flash',
  frontierModel: 'gemini-1.5-pro',
  tokenComplexityThreshold: 60,
});

// -----------------------------------------------------------------------------
// Stage 4 Lab Setup (Idempotency & HITL Refund Agent)
// -----------------------------------------------------------------------------
const stage4IdempStore = new IdempotencyStore();
const stage4Registry = new ToolRegistry(stage4IdempStore);
const stage4Gate = new ApprovalGate();
let stage4GatewayCalls = 0;

stage4Registry.registerTool({
  name: 'issue_refund',
  description: 'Issues a monetary refund safely with idempotency protection',
  riskLevel: 'REQUIRES_APPROVAL',
  requiresIdempotencyKey: true,
  schema: z.object({ orderId: z.string(), amountUsd: z.number().positive() }),
  execute: async ({ orderId, amountUsd }) => {
    stage4GatewayCalls++;
    return {
      refundId: `ref_${Math.random().toString(36).slice(2, 8)}`,
      orderId,
      amountUsd,
      gatewayExecutionNumber: stage4GatewayCalls,
      status: 'PROCESSED',
    };
  },
});

const stage4Runner = new SafeAgentRunner(
  { maxSteps: 4, agentName: 'RefundSafetyAgent' },
  stage4Registry,
  stage4Gate,
  new ResilientLLMClient(
    { primaryModel: 'gemini-1.5-pro', timeoutMs: 2000, maxRetries: 0, baseBackoffMs: 10 },
    new MockLLMProvider({ modelName: 'gemini-1.5-pro', simulatedLatencyMs: 5 })
  )
);

// -----------------------------------------------------------------------------
// Master Project Setup (Smart Contact List)
// -----------------------------------------------------------------------------
const masterService = new SmartContactService();

async function init() {
  await masterService.ingestContact(
    'Met with Dr. Gordon Freeman from Black Mesa Anomalous Materials. Email: gordon.freeman@blackmesa.gov. ' +
    'Specializes in quantum displacement and resonance hazard mitigation.'
  );
  await masterService.ingestContact(
    'Conference sync with Sarah Connor at Cyberdyne Systems. Email: sarah@cyberdyne.com. ' +
    'Leading defense infrastructure and neural network safeguards.'
  );
}

const readyPromise = init();

declare global {
  interface Window {
    __smartContactApp: any;
  }
}

window.__smartContactApp = {
  ready: readyPromise,

  // Stage 1: Resilience Lab
  runStage1Lab: async (opts: {
    prompt: string;
    failCount: number;
    latencyMs: number;
    timeoutMs: number;
    useFallback: boolean;
  }) => {
    const primary = new MockLLMProvider({
      modelName: 'gemini-1.5-pro',
      simulatedLatencyMs: opts.latencyMs,
      failAttemptsCount: opts.failCount,
      failureStatus: 429,
    });
    const fallback = opts.useFallback
      ? new MockLLMProvider({ modelName: 'gemini-1.5-flash', simulatedLatencyMs: 8 })
      : undefined;

    const client = new ResilientLLMClient(
      {
        primaryModel: 'gemini-1.5-pro',
        fallbackModel: opts.useFallback ? 'gemini-1.5-flash' : undefined,
        timeoutMs: opts.timeoutMs,
        maxRetries: 2,
        baseBackoffMs: 25,
        circuitBreakerThreshold: 2,
      },
      primary,
      fallback
    );

    try {
      const res = await client.execute(opts.prompt);
      return { ok: true, breakerState: client.getCircuitBreaker().getState(), ...res };
    } catch (err: any) {
      return { ok: false, error: err.message, breakerState: client.getCircuitBreaker().getState() };
    }
  },

  // Stage 2: Hybrid RAG Lab
  runStage2Lab: async (query: string, decayLambda: number) => {
    const matches = stage2Engine.search(query, { topK: 3, decayLambda, referenceTimeMs: Date.now() });
    const ragAnswer = await stage2Rag.answerQuestion(query, { topK: 3, decayLambda, referenceTimeMs: Date.now() });
    return { matches, ragAnswer };
  },

  // Stage 3: Cost & Latency Lab
  runStage3Lab: async (prompt: string) => {
    const routingPreview = stage3Router.route(prompt);
    const result = await stage3Optimizer.execute(prompt);
    const metrics = stage3Optimizer.getMetrics();
    return { routingPreview, result, metrics };
  },

  // Stage 4: Safe Agents Lab
  runStage4Idempotency: async (key: string) => {
    return await stage4Registry.executeTool('issue_refund', { orderId: 'ord_999', amountUsd: 75 }, key);
  },
  runStage4Agent: async (goal: string) => {
    return await stage4Runner.run(goal);
  },
  approveStage4Agent: async (token: string) => {
    return await stage4Runner.resumeWithApproval(token);
  },

  // Stage 5: CI Evals Lab
  runStage5Eval: async (mode: 'good' | 'degraded') => {
    const runner = new CIEvalRunner({ passThreshold: 0.85 });
    const candidateFn = async (prompt: string): Promise<string> => {
      if (mode === 'good') {
        if (prompt.includes('Alice Henderson')) return 'Contact: Alice Henderson, Company: Stripe, Email: alice@stripe.com.';
        if (prompt.includes('refund window')) return 'Customers have 30 days to request a full refund.';
        if (prompt.includes('SLA')) return 'Enterprise tier includes a 99.99% uptime SLA.';
      } else {
        if (prompt.includes('Alice Henderson')) return 'Found someone named Alice Henderson.';
        if (prompt.includes('refund window')) return 'The policy allows 14 days only.';
        if (prompt.includes('SLA')) return 'Enterprise uptime is about 95% with no guarantee.';
      }
      return 'Unknown';
    };
    return await runner.runBenchmark(candidateFn);
  },

  // Master Project: Smart Contact List
  ingestContact: (text: string) => masterService.ingestContact(text),
  searchContacts: (query: string, topK = 5) => masterService.searchContacts(query, topK),
  executeAgentDirective: (directive: string) => masterService.executeAgentDirective(directive),
  approveOperation: (token: string) => masterService.approveOperation(token),
  getTraceTree: () => masterService.getTraceTree(),
  getAllContacts: () => masterService.getAllContacts(),
};
