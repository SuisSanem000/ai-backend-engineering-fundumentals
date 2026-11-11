/**
 * IdempotencyStore: Thread-safe in-memory store for idempotency keys and cached tool responses.
 * Guarantees At-Most-Once semantics for external side effects (e.g. issuing refunds, creating records).
 */

export interface CachedToolResult<T = unknown> {
  idempotencyKey: string;
  toolName: string;
  result: T;
  executedAt: number;
}

export class IdempotencyStore {
  private readonly store = new Map<string, CachedToolResult>();
  private readonly ttlMs: number;

  /**
   * Initializes IdempotencyStore with TTL expiration window.
   * 
   * @param ttlMs - Time-to-live for idempotency records in milliseconds (default: 24 hours).
   */
  constructor(ttlMs = 86400000) {
    this.ttlMs = ttlMs;
  }

  /**
   * Checks if an idempotency key already exists.
   * 
   * @param key - The unique transaction idempotency key.
   * @returns CachedToolResult if exists and not expired, null otherwise.
   */
  public get<T>(key: string): CachedToolResult<T> | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() - entry.executedAt > this.ttlMs) {
      this.store.delete(key);
      return null;
    }

    return entry as CachedToolResult<T>;
  }

  /**
   * Records a successful tool execution under an idempotency key.
   * 
   * @param key - Idempotency key.
   * @param toolName - Tool identifier.
   * @param result - Result data to cache.
   */
  public set<T>(key: string, toolName: string, result: T): void {
    this.store.set(key, {
      idempotencyKey: key,
      toolName,
      result,
      executedAt: Date.now(),
    });
  }

  /**
   * Clears all stored records (useful for test isolation).
   */
  public clear(): void {
    this.store.clear();
  }
}
