# Stage 1 Tracing Tasks: LLM Resilience in Action

These tracing tasks guide you through observing and debugging failure modes in LLM calls using real telemetry and logs.

## Tracing Task 1.1: Fast-Path Request Lifecycle
- **Goal:** Trace a successful structured LLM invocation from client invocation to cost ledger.
- **Trace Points:**
  1. Record request initiation timestamp and model ID.
  2. Inspect input token estimation vs. final provider-reported prompt tokens.
  3. Verify Zod schema validation pass.
  4. Verify per-request financial cost entry in the cost ledger.
- **Verification Target:** Inspect emitted logs in [ResilientLLMClient.test.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/tests/ResilientLLMClient.test.ts).

---

## Tracing Task 1.2: Timeout Tripwire & Abort Signal
- **Goal:** Observe the execution boundary when a model provider hangs.
- **Trace Points:**
  1. Set client timeout budget to 100ms.
  2. Inject simulated provider latency of 500ms.
  3. Verify that `AbortSignal` fires at ~100ms.
  4. Ensure socket is closed and resources are released without memory leak.

---

## Tracing Task 1.3: Rate-Limit (429) Backoff & Full Jitter
- **Goal:** Trace the exponential delay curve when hitting rate limits.
- **Trace Points:**
  1. Configure provider to return HTTP 429 on attempts 1 and 2, and success on attempt 3.
  2. Observe the delay timestamps across attempts:
     - Attempt 1: Initial failure.
     - Attempt 2: Sleep duration bounded by random jitter between 0 and `baseDelay * 2^1`.
     - Attempt 3: Sleep duration bounded by random jitter between 0 and `baseDelay * 2^2`.
  3. Confirm request succeeds on attempt 3 without surfacing an error to the caller.

---

## Tracing Task 1.4: Circuit Breaker Trip & Fallback Failover
- **Goal:** Observe primary circuit opening and transparent fallback execution.
- **Trace Points:**
  1. Trigger 3 consecutive 503 errors on the primary model.
  2. Verify circuit breaker state changes from `CLOSED` to `OPEN`.
  3. Verify that subsequent request completely bypasses the primary provider.
  4. Trace invocation routed directly to the fallback model.
  5. Inspect telemetry payload showing `fallback: true` and fallback model identifier.

