# Stage 1 Code Tasks: Implementation Specifications

This document defines the implementation requirements and acceptance criteria for Stage 1.

## Task 1.1: Token Accounting & Cost Metering
- **Source Files:**
  - [TokenCounter.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/src/TokenCounter.ts)
  - [CostCalculator.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/src/CostCalculator.ts)
- **Acceptance Criteria:**
  - Token counter estimates English text accurately based on character and word heuristics.
  - Cost calculator supports model pricing tiers (input vs. output USD per 1M tokens).
  - Emits an immutable cost receipt object per request containing prompt tokens, completion tokens, model name, and total cost USD.

---

## Task 1.2: Three-State Circuit Breaker
- **Source File:**
  - [CircuitBreaker.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/src/CircuitBreaker.ts)
- **Acceptance Criteria:**
  - States: `CLOSED`, `OPEN`, `HALF_OPEN`.
  - Configurable failure threshold (e.g., 3 consecutive failures trips to `OPEN`).
  - Configurable reset timeout (e.g., 5000ms before moving to `HALF_OPEN`).
  - When `OPEN`, immediately throws `CircuitBreakerOpenError` without invoking target function.
  - In `HALF_OPEN`, successful single probe resets to `CLOSED`; failure immediately reverts to `OPEN`.

---

## Task 1.3: Resilient LLM Client Orchestrator
- **Source File:**
  - [ResilientLLMClient.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/src/ResilientLLMClient.ts)
- **Acceptance Criteria:**
  - Wraps downstream provider calls with strict `timeoutMs`.
  - Implements retry loop with exponential backoff and randomized full jitter.
  - Automatically delegates to a configured `fallbackModel` when primary circuit is open or exhausted.
  - Supports async generator streaming yielding chunks progressively.
  - Validates outputs against Zod schemas, returning strongly-typed data.

