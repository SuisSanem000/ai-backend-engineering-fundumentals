import { describe, it, expect, beforeEach } from 'bun:test';
import { z } from 'zod';
import { ResilientLLMClient } from '../src/ResilientLLMClient.ts';
import { MockLLMProvider } from '../src/MockLLMProvider.ts';
import { CircuitBreakerOpenError } from '../src/CircuitBreaker.ts';

describe('Stage 1: Resilient LLM Calls', () => {
  let primaryProvider: MockLLMProvider;
  let fallbackProvider: MockLLMProvider;

  beforeEach(() => {
    primaryProvider = new MockLLMProvider({
      modelName: 'gemini-1.5-pro',
      simulatedLatencyMs: 10,
    });
    fallbackProvider = new MockLLMProvider({
      modelName: 'gemini-1.5-flash',
      simulatedLatencyMs: 5,
    });
  });

  it('executes fast-path request and returns cost receipt', async () => {
    const client = new ResilientLLMClient(
      {
        primaryModel: 'gemini-1.5-pro',
        fallbackModel: 'gemini-1.5-flash',
        timeoutMs: 1000,
        maxRetries: 2,
        baseBackoffMs: 20,
      },
      primaryProvider,
      fallbackProvider
    );

    const result = await client.execute('Summarize distributed consensus.');
    expect(result.modelUsed).toBe('gemini-1.5-pro');
    expect(result.fallbackUsed).toBe(false);
    expect(result.retriesAttempted).toBe(0);
    expect(result.receipt.promptTokens).toBeGreaterThan(0);
    expect(result.receipt.totalCostUsd).toBeGreaterThan(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(10);
  });

  it('times out when provider exceeds deadline budget', async () => {
    const slowProvider = new MockLLMProvider({
      modelName: 'gemini-1.5-pro',
      simulatedLatencyMs: 200, // 200ms exceeds 50ms budget
    });

    const client = new ResilientLLMClient(
      {
        primaryModel: 'gemini-1.5-pro',
        timeoutMs: 50,
        maxRetries: 0,
        baseBackoffMs: 10,
      },
      slowProvider
    );

    expect(client.execute('Query with strict deadline')).rejects.toThrow(/AbortError|timed out/);
  });

  it('recovers from transient 429 rate-limit via retry with jitter', async () => {
    // Fail first 2 attempts with 429, succeed on attempt 3
    primaryProvider.setFailures(2, 429);

    const client = new ResilientLLMClient(
      {
        primaryModel: 'gemini-1.5-pro',
        timeoutMs: 1000,
        maxRetries: 3,
        baseBackoffMs: 15,
      },
      primaryProvider
    );

    const result = await client.execute('Retryable query');
    expect(result.retriesAttempted).toBe(2);
    expect(result.fallbackUsed).toBe(false);
    expect(result.modelUsed).toBe('gemini-1.5-pro');
  });

  it('fails over to fallback model when primary provider fails repeatedly', async () => {
    // Primary fails completely (3 errors, exceeding retries)
    primaryProvider.setFailures(5, 503);

    const client = new ResilientLLMClient(
      {
        primaryModel: 'gemini-1.5-pro',
        fallbackModel: 'gemini-1.5-flash',
        timeoutMs: 500,
        maxRetries: 1,
        baseBackoffMs: 10,
      },
      primaryProvider,
      fallbackProvider
    );

    const result = await client.execute('High availability mission-critical query');
    expect(result.fallbackUsed).toBe(true);
    expect(result.modelUsed).toBe('gemini-1.5-flash');
    expect(result.rawText).toContain('gemini-1.5-flash');
  });

  it('trips circuit breaker to OPEN after threshold failures', async () => {
    primaryProvider.setFailures(10, 500);

    const client = new ResilientLLMClient(
      {
        primaryModel: 'gemini-1.5-pro',
        timeoutMs: 500,
        maxRetries: 0,
        baseBackoffMs: 10,
        circuitBreakerThreshold: 2,
        circuitBreakerResetMs: 5000,
      },
      primaryProvider
    );

    // Call 1: fails
    await expect(client.execute('Query 1')).rejects.toThrow();
    // Call 2: fails -> trips breaker to OPEN
    await expect(client.execute('Query 2')).rejects.toThrow();

    expect(client.getCircuitBreaker().getState()).toBe('OPEN');

    // Call 3: should fail fast immediately with CircuitBreakerOpenError
    await expect(client.execute('Query 3')).rejects.toThrow(CircuitBreakerOpenError);
  });

  it('validates structured outputs against Zod schema', async () => {
    const structuredProvider = new MockLLMProvider({
      modelName: 'gemini-1.5-pro',
      simulatedLatencyMs: 10,
      defaultResponse: JSON.stringify({
        contactName: 'Alice Henderson',
        company: 'Stripe',
        email: 'alice@stripe.com',
      }),
    });

    const contactSchema = z.object({
      contactName: z.string(),
      company: z.string(),
      email: z.string().email(),
    });

    const client = new ResilientLLMClient(
      {
        primaryModel: 'gemini-1.5-pro',
        timeoutMs: 1000,
        maxRetries: 1,
        baseBackoffMs: 10,
      },
      structuredProvider
    );

    const result = await client.execute(
      'Respond in JSON matching schema for contact Alice Henderson at Stripe',
      contactSchema
    );

    expect(result.data.contactName).toBe('Alice Henderson');
    expect(result.data.company).toBe('Stripe');
    expect(result.data.email).toBe('alice@stripe.com');
  });

  it('streams completion tokens chunk-by-chunk', async () => {
    const client = new ResilientLLMClient(
      {
        primaryModel: 'gemini-1.5-pro',
        timeoutMs: 1000,
        maxRetries: 1,
        baseBackoffMs: 10,
      },
      primaryProvider
    );

    const chunks: string[] = [];
    for await (const chunk of client.stream('Stream response test')) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(0);
    const joined = chunks.join('');
    expect(joined).toContain('gemini-1.5-pro');
  });
});
