/**
 * ExactPromptCache: L1 prompt cache using deterministic cryptographic-style digests.
 * Implements Least Recently Used (LRU) memory eviction and Time-To-Live (TTL) expiration.
 * Pure TypeScript implementation compatible with Node, Bun, and Browser runtimes.
 */

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
   * Generates a deterministic 128-bit hex digest from normalized prompt text.
   */
  public hashPrompt(prompt: string): string {
    const normalized = prompt.trim().toLowerCase();
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    let h3 = 0x85ebca6b;
    let h4 = 0xc2b2ae35;

    for (let i = 0; i < normalized.length; i++) {
      const c = normalized.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ (c + i), 0x85ebca6b) >>> 0;
      h3 = Math.imul(h3 ^ (c << 1), 0xc2b2ae35) >>> 0;
      h4 = Math.imul(h4 ^ (c + (i << 2)), 0x27d4eb2f) >>> 0;
    }

    return [h1, h2, h3, h4].map((h) => h.toString(16).padStart(8, '0')).join('');
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

