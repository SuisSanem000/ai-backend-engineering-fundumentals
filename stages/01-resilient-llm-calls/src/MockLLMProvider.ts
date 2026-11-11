/**
 * MockLLMProvider: Deterministic, high-fidelity LLM provider simulator.
 * Allows unit and integration testing of resilience primitives (timeouts, retries,
 * rate limits, circuit breakers, fallbacks, and streaming) without network flakiness
 * or costly paid API dependencies.
 */

export interface MockProviderOptions {
  modelName: string;
  simulatedLatencyMs?: number;
  failureRate?: number;
  failAttemptsCount?: number;
  failureStatus?: number; // e.g. 429 or 503
  defaultResponse?: string;
}

export class MockLLMProvider {
  private readonly modelName: string;
  private readonly latencyMs: number;
  private remainingFailures: number;
  private readonly failureStatus: number;
  private readonly defaultResponse: string;

  /**
   * Constructs a controllable mock provider instance.
   * 
   * @param options - Simulation control parameters.
   */
  constructor(options: MockProviderOptions) {
    this.modelName = options.modelName;
    this.latencyMs = options.simulatedLatencyMs ?? 10;
    this.remainingFailures = options.failAttemptsCount ?? 0;
    this.failureStatus = options.failureStatus ?? 500;
    this.defaultResponse = options.defaultResponse ?? '{"status":"success","data":"Mock LLM completion"}';
  }

  /**
   * Simulates a completion call with abort signal propagation and simulated errors.
   * 
   * @param prompt - Input prompt text.
   * @param signal - Standard AbortSignal for deadline cancellation.
   * @returns Generated text response.
   */
  public async generate(prompt: string, signal?: AbortSignal): Promise<string> {
    if (signal?.aborted) {
      throw new Error('AbortError: Request was aborted before execution');
    }

    // Simulate network delay respecting cancellation signal
    await this.sleepWithAbort(this.latencyMs, signal);

    if (this.remainingFailures > 0) {
      this.remainingFailures--;
      const error = new Error(`LLMProviderError: HTTP ${this.failureStatus} - Service Unavailable or Rate Limited`);
      // @ts-expect-error adding status code property
      error.status = this.failureStatus;
      throw error;
    }

    // Dynamic echo or default JSON completion
    if (prompt.includes('Respond in JSON') || prompt.includes('schema') || this.defaultResponse !== '{"status":"success","data":"Mock LLM completion"}') {
      return this.defaultResponse;
    }

    return `[${this.modelName}] Generated response for: ${prompt.slice(0, 30)}...`;
  }

  /**
   * Simulates streaming tokens chunk-by-chunk via an async generator.
   * 
   * @param prompt - Input prompt text.
   * @param signal - AbortSignal for stream cancellation.
   */
  public async *stream(prompt: string, signal?: AbortSignal): AsyncIterableIterator<string> {
    const fullText = await this.generate(prompt, signal);
    const words = fullText.split(' ');

    for (const word of words) {
      if (signal?.aborted) {
        throw new Error('AbortError: Stream aborted mid-flight');
      }
      await this.sleepWithAbort(5, signal);
      yield `${word} `;
    }
  }

  /**
   * Resets injected failure count for test isolation.
   */
  public setFailures(count: number, status = 429): void {
    this.remainingFailures = count;
    // @ts-expect-error update status
    this.failureStatus = status;
  }

  /**
   * Helper to sleep while listening to cancellation abort signal.
   */
  private sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        return reject(new Error('AbortError: Timeout or user cancellation'));
      }

      const timer = setTimeout(() => {
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
        resolve();
      }, ms);

      const onAbort = () => {
        clearTimeout(timer);
        reject(new Error('AbortError: Operation timed out or canceled'));
      };

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }
    });
  }
}

