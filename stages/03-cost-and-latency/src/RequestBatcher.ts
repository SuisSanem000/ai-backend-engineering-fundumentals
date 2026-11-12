/**
 * RequestBatcher: Windowed micro-batching queue for high-concurrency workloads.
 * Gathers individual prompt calls within a sliding time window and executes them in bulk,
 * amortizing network handshake overhead and taking advantage of batch pricing.
 */

export interface QueuedRequest<T = string> {
  id: string;
  prompt: string;
  resolve: (value: T) => void;
  reject: (err: unknown) => void;
}

export interface BatcherOptions {
  maxBatchSize: number;
  maxWaitMs: number;
}

export class RequestBatcher<T = string> {
  private readonly maxBatchSize: number;
  private readonly maxWaitMs: number;
  private readonly queue: QueuedRequest<T>[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly batchExecutor: (prompts: string[]) => Promise<T[]>;

  /**
   * Initializes RequestBatcher with window thresholds and batch execution handler.
   * 
   * @param batchExecutor - Async function executing a list of prompts together.
   * @param options - Batch size and window wait limits.
   */
  constructor(
    batchExecutor: (prompts: string[]) => Promise<T[]>,
    options?: Partial<BatcherOptions>
  ) {
    this.batchExecutor = batchExecutor;
    this.maxBatchSize = options?.maxBatchSize ?? 5;
    this.maxWaitMs = options?.maxWaitMs ?? 20;
  }

  /**
   * Enqueues an individual prompt request, returning a promise that resolves when its batch completes.
   * 
   * @param prompt - Individual prompt text.
   * @returns Promise resolving with the completion response for this specific prompt.
   */
  public enqueue(prompt: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = `req_${Math.random().toString(36).slice(2, 8)}`;
      this.queue.push({ id, prompt, resolve, reject });

      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.maxWaitMs);
      }
    });
  }

  /**
   * Dispatches currently queued requests immediately.
   */
  public async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const currentBatch = this.queue.splice(0, this.maxBatchSize);
    const prompts = currentBatch.map((item) => item.prompt);

    try {
      const results = await this.batchExecutor(prompts);
      for (let i = 0; i < currentBatch.length; i++) {
        currentBatch[i].resolve(results[i]);
      }
    } catch (batchErr) {
      for (const item of currentBatch) {
        item.reject(batchErr);
      }
    }
  }

  /**
   * Returns current pending queue length.
   */
  public pendingCount(): number {
    return this.queue.length;
  }
}

