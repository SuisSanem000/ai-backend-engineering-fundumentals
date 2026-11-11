/**
 * ContactSearchService: Executes multi-modal hybrid retrieval across contact notes
 * combined with L1/L2 multi-tier caching to slash search latency and cloud expenses.
 */

import { ContactRecord, ContactSearchResponse, SearchResultItem } from './ContactTypes.ts';
import { HybridSearchEngine } from '../../../stages/02-retrieval-rag/src/HybridSearchEngine.ts';
import { CostLatencyOptimizer } from '../../../stages/03-cost-and-latency/src/CostLatencyOptimizer.ts';

export class ContactSearchService {
  private readonly searchEngine: HybridSearchEngine;
  private readonly optimizer: CostLatencyOptimizer;
  private readonly getContactFn: (id: string) => ContactRecord | undefined;

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
   * wrapped in L1/L2 caching.
   * 
   * @param query - Natural language search query.
   * @param topK - Maximum results to return.
   * @returns ContactSearchResponse with ranked contact records and cache metrics.
   */
  public async search(query: string, topK = 5): Promise<ContactSearchResponse> {
    const start = Date.now();

    // 1. Check L1 / L2 caches via optimizer
    const optRes = await this.optimizer.execute(`search_contacts:${query}`);
    if (optRes.cacheHit !== 'NONE') {
      try {
        const cachedItems: SearchResultItem[] = JSON.parse(optRes.data);
        return {
          query,
          items: cachedItems,
          cacheHit: optRes.cacheHit,
          durationMs: Date.now() - start,
          costUsd: 0,
        };
      } catch {
        // Fallback to fresh retrieval if cached data format differs
      }
    }

    // 2. Fresh Hybrid Retrieval (Dense Vector + Sparse BM25 + Temporal Decay)
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

    return {
      query,
      items,
      cacheHit: 'NONE',
      durationMs: Date.now() - start,
      costUsd: optRes.costUsd,
    };
  }
}
