/**
 * SemanticCache: L2 high-dimensional vector semantic cache.
 * Evaluates semantic cosine similarity between incoming queries and cached entries,
 * intercepting semantically identical or paraphrased prompts without requiring downstream LLM calls.
 */

import { EmbeddingEngine } from '../../02-retrieval-rag/src/EmbeddingEngine.ts';
import { CacheStats } from './ExactPromptCache.ts';

export interface SemanticCacheEntry<T = string> {
  promptText: string;
  vector: Float64Array;
  value: T;
  createdAt: number;
  lastAccessed: number;
}

export interface SemanticMatch<T = string> {
  value: T;
  similarity: number;
  matchedPrompt: string;
}

export class SemanticCache<T = string> {
  private readonly capacity: number;
  private readonly similarityThreshold: number;
  private readonly embedder: EmbeddingEngine;
  private readonly entries: SemanticCacheEntry<T>[] = [];
  private hits = 0;
  private misses = 0;

  /**
   * Initializes L2 semantic cache with similarity threshold and capacity limits.
   * 
   * @param similarityThreshold - Minimum cosine similarity to declare a hit (default: 0.88).
   * @param capacity - Maximum number of vector entries before LRU eviction (default: 500).
   * @param embedder - Optional custom embedding engine.
   */
  constructor(
    similarityThreshold = 0.88,
    capacity = 500,
    embedder?: EmbeddingEngine
  ) {
    this.similarityThreshold = similarityThreshold;
    this.capacity = capacity;
    this.embedder = embedder ?? new EmbeddingEngine();
  }

  /**
   * Queries the cache for semantically equivalent prompts.
   * Returns a match if the highest cosine similarity meets or exceeds the threshold.
   * 
   * @param prompt - Inbound query string.
   * @returns SemanticMatch with cached value and similarity score, or null on miss.
   */
  public get(prompt: string): SemanticMatch<T> | null {
    if (this.entries.length === 0) {
      this.misses++;
      return null;
    }

    const queryVector = this.embedder.embed(prompt);
    let bestEntry: SemanticCacheEntry<T> | null = null;
    let highestSim = -1.0;

    for (const entry of this.entries) {
      const sim = this.embedder.cosineSimilarity(queryVector, entry.vector);
      if (sim > highestSim) {
        highestSim = sim;
        bestEntry = entry;
      }
    }

    if (bestEntry && highestSim >= this.similarityThreshold) {
      bestEntry.lastAccessed = Date.now();
      this.hits++;
      return {
        value: bestEntry.value,
        similarity: Number(highestSim.toFixed(4)),
        matchedPrompt: bestEntry.promptText,
      };
    }

    this.misses++;
    return null;
  }

  /**
   * Caches a prompt and its completion response as a dense embedding vector.
   * Evicts least recently accessed entry if capacity ceiling is reached.
   * 
   * @param prompt - Prompt string.
   * @param value - Generated response payload.
   */
  public set(prompt: string, value: T): void {
    if (this.entries.length >= this.capacity) {
      // Find and evict entry with oldest lastAccessed timestamp
      let oldestIdx = 0;
      let oldestTime = Infinity;
      for (let i = 0; i < this.entries.length; i++) {
        if (this.entries[i].lastAccessed < oldestTime) {
          oldestTime = this.entries[i].lastAccessed;
          oldestIdx = i;
        }
      }
      this.entries.splice(oldestIdx, 1);
    }

    const vector = this.embedder.embed(prompt);
    const now = Date.now();
    this.entries.push({
      promptText: prompt,
      vector,
      value,
      createdAt: now,
      lastAccessed: now,
    });
  }

  /**
   * Returns telemetry performance metrics.
   */
  public getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.entries.length,
      hitRatio: total > 0 ? Number((this.hits / total).toFixed(4)) : 0,
    };
  }

  /**
   * Clears all cached vectors.
   */
  public clear(): void {
    this.entries.length = 0;
    this.hits = 0;
    this.misses = 0;
  }
}

