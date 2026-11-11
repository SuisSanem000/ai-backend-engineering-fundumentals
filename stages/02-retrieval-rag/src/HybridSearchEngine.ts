/**
 * HybridSearchEngine: Fuses dense semantic vector search and sparse BM25 lexical search
 * using Reciprocal Rank Fusion (RRF), enhanced with temporal exponential freshness decay.
 */

import { Chunk } from './TextChunker.ts';
import { VectorStore, MetadataFilter } from './VectorStore.ts';
import { BM25Index } from './BM25Index.ts';

export interface HybridSearchResult {
  chunk: Chunk;
  rrfScore: number;
  freshnessMultiplier: number;
  finalScore: number;
  denseRank?: number;
  bm25Rank?: number;
}

export interface HybridSearchOptions {
  topK?: number;
  rrfConstant?: number;      // Standard smoothing k (default: 60)
  decayLambda?: number;      // Freshness decay velocity per day (default: 0.05)
  referenceTimeMs?: number;  // Reference time for age calculation
  filter?: MetadataFilter;
}

export class HybridSearchEngine {
  private readonly vectorStore: VectorStore;
  private readonly bm25Index: BM25Index;

  /**
   * Constructs the hybrid search engine wrapping dense and sparse indices.
   * 
   * @param vectorStore - The dense vector index.
   * @param bm25Index - The sparse BM25 inverted index.
   */
  constructor(vectorStore?: VectorStore, bm25Index?: BM25Index) {
    this.vectorStore = vectorStore ?? new VectorStore();
    this.bm25Index = bm25Index ?? new BM25Index();
  }

  /**
   * Indexes an array of chunks into both the vector store and BM25 index.
   * 
   * @param chunks - Array of document chunks.
   */
  public indexChunks(chunks: Chunk[]): void {
    this.vectorStore.addChunks(chunks);
    this.bm25Index.addChunks(chunks);
  }

  /**
   * Executes hybrid search using Reciprocal Rank Fusion and temporal decay filtering.
   * 
   * @param queryText - Search query string.
   * @param options - RRF parameters, topK limit, and freshness decay settings.
   * @returns Fused and decayed search results ranked descending by finalScore.
   */
  public search(
    queryText: string,
    options?: HybridSearchOptions
  ): HybridSearchResult[] {
    const topK = options?.topK ?? 5;
    const k = options?.rrfConstant ?? 60;
    const lambda = options?.decayLambda ?? 0.05;
    const now = options?.referenceTimeMs ?? Date.now();
    const filter = options?.filter;

    // Fetch candidate pools from both indices (retrieve 2x topK for fusion breadth)
    const candidatePoolSize = Math.max(topK * 2, 20);
    const denseMatches = this.vectorStore.search(queryText, candidatePoolSize, filter);
    const bm25Matches = this.bm25Index.search(queryText, candidatePoolSize, filter);

    const fusedMap = new Map<
      string,
      {
        chunk: Chunk;
        denseRank?: number;
        bm25Rank?: number;
        rrfScore: number;
      }
    >();

    // Process dense rankings
    for (let i = 0; i < denseMatches.length; i++) {
      const rank = i + 1;
      const match = denseMatches[i];
      const id = match.chunk.chunkId;
      const rrfContribution = 1 / (k + rank);

      fusedMap.set(id, {
        chunk: match.chunk,
        denseRank: rank,
        rrfScore: rrfContribution,
      });
    }

    // Process sparse BM25 rankings
    for (let i = 0; i < bm25Matches.length; i++) {
      const rank = i + 1;
      const match = bm25Matches[i];
      const id = match.chunk.chunkId;
      const rrfContribution = 1 / (k + rank);

      const existing = fusedMap.get(id);
      if (existing) {
        existing.bm25Rank = rank;
        existing.rrfScore += rrfContribution;
      } else {
        fusedMap.set(id, {
          chunk: match.chunk,
          bm25Rank: rank,
          rrfScore: rrfContribution,
        });
      }
    }

    // Apply temporal freshness exponential decay
    const results: HybridSearchResult[] = [];

    for (const entry of fusedMap.values()) {
      let freshnessMultiplier = 1.0;
      const ts = entry.chunk.metadata?.timestamp;

      if (typeof ts === 'number' && ts > 0) {
        const ageDays = Math.max(0, (now - ts) / (1000 * 60 * 60 * 24));
        freshnessMultiplier = Math.exp(-lambda * ageDays);
      }

      const finalScore = entry.rrfScore * freshnessMultiplier;

      results.push({
        chunk: entry.chunk,
        rrfScore: entry.rrfScore,
        freshnessMultiplier,
        finalScore,
        denseRank: entry.denseRank,
        bm25Rank: entry.bm25Rank,
      });
    }

    results.sort((a, b) => b.finalScore - a.finalScore);
    return results.slice(0, topK);
  }
}

