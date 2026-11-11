/**
 * ResilientLLMClient: Enterprise-grade RPC wrapper for LLM provider APIs.
 * Implements deadline propagation, exponential backoff with full jitter,
 * three-state circuit breakers, model fallback cascades, structured JSON schema parsing,
 * and immutable per-request cost receipts.
 */

import { z } from 'zod';
import { CircuitBreaker, CircuitBreakerOpenError } from './CircuitBreaker.ts';
import { TokenCounter } from './TokenCounter.ts';
import { CostCalculator, CostReceipt } from './CostCalculator.ts';
import { MockLLMProvider } from './MockLLMProvider.ts';

export interface ResilientClientConfig {
  primaryModel: string;
  fallbackModel?: string;
  timeoutMs: number;
  maxRetries: number;
  baseBackoffMs: number;
  circuitBreakerThreshold?: number;
  circuitBreakerResetMs?: number;
}

export interface InvocationResult<T = string> {
  data: T;
  rawText: string;
  modelUsed: string;
  fallbackUsed: boolean;
  retriesAttempted: number;
  receipt: CostReceipt;
  durationMs: number;
}

export class ResilientLLMClient {
  private readonly config: ResilientClientConfig;
  private readonly primaryBreaker: CircuitBreaker;
  private readonly primaryProvider: MockLLMProvider;
  private readonly fallbackProvider?: MockLLMProvider;

  /**
   * Constructs a ResilientLLMClient configured with timeout, retry, and failover bounds.
   * 
   * @param config - Resilience settings and model parameters.
   * @param primaryProvider - Upstream provider instance for primary model.
   * @param fallbackProvider - Optional auxiliary provider instance for fallback model.
   */
  constructor(
    config: ResilientClientConfig,
    primaryProvider?: MockLLMProvider,
    fallbackProvider?: MockLLMProvider
  ) {
    this.config = config;
    this.primaryBreaker = new CircuitBreaker({
      failureThreshold: config.circuitBreakerThreshold ?? 3,
      resetTimeoutMs: config.circuitBreakerResetMs ?? 10000,
    });
    this.primaryProvider =
      primaryProvider ?? new MockLLMProvider({ modelName: config.primaryModel });
    this.fallbackProvider =
      fallbackProvider ??
      (config.fallbackModel
        ? new MockLLMProvider({ modelName: config.fallbackModel })
        : undefined);
  }

  /**
   * Invokes the LLM with full resilience policies (timeout, retry with jitter, circuit breaker, fallback).
   * 
   * @param prompt - The formatted input prompt.
   * @param schema - Optional Zod schema to enforce structured output validation.
   * @returns Strongly-typed InvocationResult containing response data, provenance, and cost receipt.
   */
  public async execute<T = string>(
    prompt: string,
    schema?: z.ZodSchema<T>
  ): Promise<InvocationResult<T>> {
    const startTime = Date.now();
    const requestId = `req_${Math.random().toString(36).slice(2, 10)}`;
    const promptTokens = TokenCounter.count(prompt);

    let retries = 0;
    let fallbackUsed = false;
    let modelUsed = this.config.primaryModel;
    let rawText = '';

    try {
      // 1. Attempt execution against primary provider through circuit breaker
      rawText = await this.executeWithRetry(async (signal) => {
        return await this.primaryBreaker.execute(async () => {
          return await this.primaryProvider.generate(prompt, signal);
        });
      }, (attempt) => {
        retries = attempt;
      });
    } catch (primaryError) {
      // 2. Failover to fallback model if configured
      if (this.fallbackProvider && this.config.fallbackModel) {
        fallbackUsed = true;
        modelUsed = this.config.fallbackModel;

        rawText = await this.executeWithRetry(async (signal) => {
          return await this.fallbackProvider!.generate(prompt, signal);
        }, (attempt) => {
          retries += attempt;
        });
      } else {
        throw primaryError;
      }
    }

    const completionTokens = TokenCounter.count(rawText);
    const receipt = CostCalculator.calculateCost(
      requestId,
      modelUsed,
      promptTokens,
      completionTokens
    );

    // 3. Structured output validation if schema provided
    let data: T;
    if (schema) {
      try {
        const parsedJson = JSON.parse(rawText);
        data = schema.parse(parsedJson);
      } catch (validationErr) {
        throw new Error(
          `StructuredOutputError: Response failed schema parsing: ${(validationErr as Error).message}`
        );
      }
    } else {
      data = rawText as unknown as T;
    }

    return {
      data,
      rawText,
      modelUsed,
      fallbackUsed,
      retriesAttempted: retries,
      receipt,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Streams completion tokens asynchronously, wrapped in an overall timeout deadline.
   * 
   * @param prompt - Formatted input prompt.
   * @returns Async generator yielding progressive token chunks.
   */
  public async *stream(prompt: string): AsyncIterableIterator<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const streamIterator = this.primaryProvider.stream(prompt, controller.signal);
      for await (const chunk of streamIterator) {
        yield chunk;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Wraps an asynchronous action in an exponential backoff loop with randomized full jitter.
   */
  private async executeWithRetry<R>(
    fn: (signal: AbortSignal) => Promise<R>,
    onRetry?: (attempt: number) => void
  ): Promise<R> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => {
        controller.abort();
      }, this.config.timeoutMs);

      try {
        const result = await fn(controller.signal);
        clearTimeout(timeoutHandle);
        return result;
      } catch (err) {
        clearTimeout(timeoutHandle);
        lastError = err;

        // If circuit breaker is explicitly OPEN, immediately bail out to allow fallback
        if (err instanceof CircuitBreakerOpenError) {
          throw err;
        }

        if (attempt < this.config.maxRetries) {
          if (onRetry) onRetry(attempt + 1);
          // Exponential backoff with full jitter: UniformRandom(0, base * 2^attempt)
          const maxDelay = this.config.baseBackoffMs * Math.pow(2, attempt);
          const jitteredDelay = Math.floor(Math.random() * maxDelay);
          await new Promise((res) => setTimeout(res, jitteredDelay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Provides direct access to the underlying circuit breaker instance.
   */
  public getCircuitBreaker(): CircuitBreaker {
    return this.primaryBreaker;
  }
}

