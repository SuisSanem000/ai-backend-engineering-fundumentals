import { describe, it, expect, beforeEach } from 'bun:test';
import { ExactPromptCache } from '../src/ExactPromptCache.ts';
import { SemanticCache } from '../src/SemanticCache.ts';
import { ModelRouter } from '../src/ModelRouter.ts';
import { RequestBatcher } from '../src/RequestBatcher.ts';
import { CostLatencyOptimizer } from '../src/CostLatencyOptimizer.ts';

describe('Stage 3: Cost & Latency Optimization', () => {
  describe('ExactPromptCache', () => {
    it('returns cached response and increments hit counter on identical prompt', () => {
      const cache = new ExactPromptCache<string>(10);
      cache.set('What is our API rate limit?', '100 requests per minute');

      const hit = cache.get('What is our API rate limit?');
      expect(hit).toBe('100 requests per minute');
      expect(cache.getStats().hits).toBe(1);

      const miss = cache.get('Unrelated question');
      expect(miss).toBeNull();
      expect(cache.getStats().misses).toBe(1);
    });
  });

  describe('SemanticCache', () => {
    it('intercepts paraphrased query via cosine similarity match', () => {
      const cache = new SemanticCache<string>(0.85);
      cache.set('Who founded Stripe payment platform?', 'Patrick and John Collison');

      // Paraphrased query with similar semantic intent
      const match = cache.get('Who are the founders of Stripe payment platform?');
      expect(match).not.toBeNull();
      expect(match?.value).toBe('Patrick and John Collison');
      expect(match?.similarity).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('ModelRouter', () => {
    const router = new ModelRouter({
      economyModel: 'gemini-1.5-flash',
      frontierModel: 'gemini-1.5-pro',
      tokenComplexityThreshold: 50,
    });

    it('routes low-complexity lookup to economy tier', () => {
      const decision = router.route('What is the contact email for billing?');
      expect(decision.selectedModel).toBe('gemini-1.5-flash');
      expect(decision.isFrontier).toBe(false);
      expect(decision.estimatedComplexity).toBe('LOW');
    });

    it('routes deep synthesis and reasoning to frontier tier', () => {
      const decision = router.route(
        'Analyze and synthesize the trade-offs between Paxos and Raft consensus algorithms.'
      );
      expect(decision.selectedModel).toBe('gemini-1.5-pro');
      expect(decision.isFrontier).toBe(true);
      expect(decision.estimatedComplexity).toBe('HIGH');
    });
  });

  describe('RequestBatcher', () => {
    it('batches concurrent requests within a sliding time window', async () => {
      let batchExecutionCount = 0;
      const batcher = new RequestBatcher<string>(
        async (prompts) => {
          batchExecutionCount++;
          return prompts.map((p) => `Completed: ${p}`);
        },
        { maxBatchSize: 3, maxWaitMs: 30 }
      );

      const p1 = batcher.enqueue('Query A');
      const p2 = batcher.enqueue('Query B');
      const p3 = batcher.enqueue('Query C');

      const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

      expect(r1).toBe('Completed: Query A');
      expect(r2).toBe('Completed: Query B');
      expect(r3).toBe('Completed: Query C');
      // All 3 executed in a single batch
      expect(batchExecutionCount).toBe(1);
    });
  });

  describe('CostLatencyOptimizer (Composite Benchmark)', () => {
    let optimizer: CostLatencyOptimizer;

    beforeEach(() => {
      optimizer = new CostLatencyOptimizer();
    });

    it('cuts total workload cost by over 50% through caching and routing', async () => {
      const workload = [
        // 1. Initial lookup -> miss, routed to economy
        'Get support email address.',
        // 2. Exact repeat -> L1 cache hit ($0 cost)
        'Get support email address.',
        // 3. Paraphrase -> L2 semantic cache hit ($0 cost)
        'What is the support email address?',
        // 4. Another lookup -> miss, routed to economy
        'What is company headquarters city?',
        // 5. Repeat -> L1 cache hit ($0 cost)
        'What is company headquarters city?',
      ];

      let totalOptimizedCost = 0;
      let naiveFrontierCost = 0;

      for (const query of workload) {
        const res = await optimizer.execute(query);
        totalOptimizedCost += res.costUsd;

        // Baseline cost: if every query were sent to Frontier model ($3.50/M input + $10.50/M output)
        const tokens = Math.ceil(query.length / 4) + 30;
        naiveFrontierCost += (tokens / 1_000_000) * 10.5;
      }

      // Verify that total optimized cost is less than 50% of the naive frontier baseline
      expect(totalOptimizedCost).toBeLessThan(naiveFrontierCost * 0.5);
      const metrics = optimizer.getMetrics();
      expect(metrics.l1.hits + metrics.l2.hits).toBeGreaterThanOrEqual(3);
    });
  });
});
