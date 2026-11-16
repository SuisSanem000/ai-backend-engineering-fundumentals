/**
 * ContactSearchService: Executes multi-modal hybrid retrieval across contact notes
 * combined with L1/L2 multi-tier caching to slash search latency and cloud expenses.
 */

import { ContactRecord, ContactSearchResponse, SearchResultItem } from './ContactTypes.ts';
import { HybridSearchEngine } from '../../../stages/02-retrieval-rag/src/HybridSearchEngine.ts';
import { ExactPromptCache } from '../../../stages/03-cost-and-latency/src/ExactPromptCache.ts';
import { SemanticCache } from '../../../stages/03-cost-and-latency/src/SemanticCache.ts';
import { CostLatencyOptimizer } from '../../../stages/03-cost-and-latency/src/CostLatencyOptimizer.ts';

export class ContactSearchService {
  private readonly searchEngine: HybridSearchEngine;
  private readonly optimizer: CostLatencyOptimizer;
  private readonly getContactFn: (id: string) => ContactRecord | undefined;
  private readonly l1ResultsCache = new ExactPromptCache<SearchResultItem[]>(500);
  private readonly l2ResultsCache = new SemanticCache<SearchResultItem[]>(0.82, 500);

  /**
   * Constructs ContactSearchService with hybrid retrieval engine, optimizer, and contact resolver.
   */
  constructor(
    searchEngine: HybridSearchEngine,
    optimizer: CostLatencyOptimizer,
    getContactFn: (id: string) => ContactRecord | undefined
  ) {
    this.searchEngine = searchEngine;
    this.optimizer = optimizer;
    this.getContactFn = getContactFn;
  }

  /**
   * Searches contacts using hybrid BM25 + Vector RRF ranking with freshness decay,
   * wrapped in L1 Exact Hash and L2 Semantic Vector caching.
   * 
   * @param query - Natural language search query.
   * @param topK - Maximum results to return.
   * @returns ContactSearchResponse with ranked contact records and cache metrics.
   */
  public async search(query: string, topK = 5): Promise<ContactSearchResponse> {
    const start = Date.now();
    const cacheKey = `${query.trim()}::k=${topK}`;

    // 1. Check L1 Exact Hash Cache
    const l1Hit = this.l1ResultsCache.get(cacheKey);
    if (l1Hit !== null) {
      return {
        query,
        items: l1Hit,
        cacheHit: 'EXACT',
        durationMs: Date.now() - start,
        costUsd: 0,
      };
    }

    // 2. Check L2 Semantic Vector Cache
    const l2Match = this.l2ResultsCache.get(query.trim());
    if (l2Match !== null) {
      this.l1ResultsCache.set(cacheKey, l2Match.value);
      return {
        query,
        items: l2Match.value.slice(0, topK),
        cacheHit: 'SEMANTIC',
        durationMs: Date.now() - start,
        costUsd: 0,
      };
    }

    // 3. Fresh Hybrid Retrieval (Dense Vector + Sparse BM25 + Temporal Decay)
    const hybridMatches = this.searchEngine.search(query, {
      topK,
      decayLambda: 0.05,
      referenceTimeMs: Date.now(),
    });

    const items: SearchResultItem[] = [];
    for (const match of hybridMatches) {
      const contactId = match.chunk.docId;
      const contact = this.getContactFn(contactId);
      if (contact) {
        items.push({
          contact,
          relevanceScore: Number(match.finalScore.toFixed(4)),
          matchedSnippet: match.chunk.content,
          freshnessMultiplier: Number(match.freshnessMultiplier.toFixed(4)),
        });
      }
    }

    // Sort descending by relevance score
    items.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Populate both cache tiers for future identical or paraphrased queries
    if (items.length > 0) {
      this.l1ResultsCache.set(cacheKey, items);
      this.l2ResultsCache.set(query.trim(), items);
    }

    // Account for query embedding / routing overhead via optimizer
    const optRes = await this.optimizer.execute(`search_contacts:${query}`);

    return {
      query,
      items,
      cacheHit: 'NONE',
      durationMs: Date.now() - start,
      costUsd: optRes.costUsd,
    };
  }
}
