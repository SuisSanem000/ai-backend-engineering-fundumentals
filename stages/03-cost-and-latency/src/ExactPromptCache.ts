/**
 * ExactPromptCache: L1 cryptographic prompt cache using SHA-256 digests.
 * Implements Least Recently Used (LRU) memory eviction and Time-To-Live (TTL) expiration.
 */

import { createHash } from 'node:crypto';

export interface CacheEntry<T = string> {
  key: string;
  value: T;
  createdAt: number;
  lastAccessed: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRatio: number;
}

export class ExactPromptCache<T = string> {
  private readonly capacity: number;
  private readonly ttlMs: number;
  private readonly cache = new Map<string, CacheEntry<T>>();
  private hits = 0;
  private misses = 0;

  /**
   * Initializes L1 exact prompt cache.
   * 
   * @param capacity - Maximum number of entries before LRU eviction (default: 1000).
   * @param ttlMs - Time-to-live in milliseconds (default: 1 hour).
   */
  constructor(capacity = 1000, ttlMs = 3600000) {
    this.capacity = capacity;
    this.ttlMs = ttlMs;
  }

  /**
   * Generates a deterministic SHA-256 hash key from normalized prompt text.
   */
  public hashPrompt(prompt: string): string {
    return createHash('sha256').update(prompt.trim().toLowerCase()).digest('hex');
  }

  /**
   * Retrieves an entry by prompt text.
   * Returns null if key does not exist or has expired past TTL.
   * Updates LRU access ordering on hit.
   * 
   * @param prompt - Prompt string to query.
   * @returns Cached value or null on miss.
   */
  public get(prompt: string): T | null {
    const key = this.hashPrompt(prompt);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    if (now - entry.createdAt > this.ttlMs) {
      // Entry expired
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Refresh LRU ordering by deleting and re-inserting
    this.cache.delete(key);
    entry.lastAccessed = now;
    this.cache.set(key, entry);

    this.hits++;
    return entry.value;
  }

  /**
   * Stores a completion value for a prompt.
   * Evicts least recently used entry if capacity is exceeded.
   * 
   * @param prompt - Raw prompt string.
   * @param value - Completion response to cache.
   */
  public set(prompt: string, value: T): void {
    const key = this.hashPrompt(prompt);

    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict oldest (first key in map iteration order)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const now = Date.now();
    this.cache.set(key, {
      key,
      value,
      createdAt: now,
      lastAccessed: now,
    });
  }

  /**
   * Returns operational statistics for telemetry.
   */
  public getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRatio: total > 0 ? Number((this.hits / total).toFixed(4)) : 0,
    };
  }

  /**
   * Clears the cache.
   */
  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}
