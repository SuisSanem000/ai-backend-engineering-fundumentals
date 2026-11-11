/**
 * CircuitBreaker: Distributed systems stability pattern for external LLM dependencies.
 * Prevents cascade failures by short-circuiting calls to degraded or failing providers.
 * 
 * States:
 * - CLOSED: Normal flow. Requests proceed to the upstream provider.
 * - OPEN: Provider is failing. Requests immediately fail fast with CircuitBreakerOpenError.
 * - HALF_OPEN: Trial period. Allows a single canary request to test provider recovery.
 */

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of consecutive failures to trip open
  resetTimeoutMs: number;    // Time to wait before attempting recovery (HALF_OPEN)
}

export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private consecutiveFailures = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;

  /**
   * Initializes a CircuitBreaker with failure thresholds and sleep windows.
   * 
   * @param options - Failure threshold count and recovery timeout in milliseconds.
   */
  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold;
    this.resetTimeoutMs = options.resetTimeoutMs;
  }

  /**
   * Returns current internal state of the breaker.
   */
  public getState(): CircuitBreakerState {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      }
    }
    return this.state;
  }

  /**
   * Executes an asynchronous operation through the circuit breaker.
   * Fails fast if the circuit is currently OPEN.
   * 
   * @param action - Async function making the remote dependency call.
   * @returns Resolved promise value from the action.
   */
  public async execute<T>(action: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === 'OPEN') {
      throw new CircuitBreakerOpenError(
        `CircuitBreaker is OPEN. Provider degraded. Fails fast without network call.`
      );
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handles successful call: resets failure counters and transitions HALF_OPEN back to CLOSED.
   */
  private onSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = 'CLOSED';
  }

  /**
   * Handles call failure: increments failure count and trips circuit OPEN if threshold is breached.
   */
  private onFailure(): void {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();

    if (this.consecutiveFailures >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
    }
  }

  /**
   * Explicit manual reset for operational recovery or test isolation.
   */
  public reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.lastFailureTime = 0;
  }
}
