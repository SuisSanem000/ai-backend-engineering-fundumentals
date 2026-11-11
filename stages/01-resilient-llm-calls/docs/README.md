# Stage 1: LLM Calls Are Backend Calls

In production AI backend engineering, an LLM API is not an infallible conversational oracle; it is an untrusted, high-latency, network-bound external Remote Procedure Call (RPC) with significant latency variance and non-deterministic cost.

## Architectural Objectives
- Treat LLM calls with the same resilience patterns used for third-party payment gateways and distributed microservices.
- Enforce strict wall-clock timeout deadlines via cancellation signals.
- Mitigate transient network and rate-limit errors using exponential backoff with full randomized jitter.
- Implement a three-state Circuit Breaker (Closed, Open, Half-Open) to fail fast when a downstream provider suffers an outage.
- Provide automated fallback degradation to secondary or local models.
- Guarantee type safety and downstream system contracts via runtime structured schema parsing.
- Meter every request with precise token accounting and USD cost calculation.

## Directory Structure & Component Map

| Component | Responsibility | Implementation |
| :--- | :--- | :--- |
| **Circuit Breaker** | Fails fast during provider outages; prevents resource exhaustion | [CircuitBreaker.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/src/CircuitBreaker.ts) |
| **Token Counter** | Calculates input/output tokens and context limits | [TokenCounter.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/src/TokenCounter.ts) |
| **Cost Calculator** | Calculates real-time financial cost per request | [CostCalculator.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/src/CostCalculator.ts) |
| **Mock LLM Provider** | Simulates latency, streaming, 429s, and 500s deterministically | [MockLLMProvider.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/src/MockLLMProvider.ts) |
| **Resilient Client** | Orchestrates retries, jitter, fallbacks, streaming, and schemas | [ResilientLLMClient.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/src/ResilientLLMClient.ts) |

## Documentation & Exercises
- [Knowledge Guide](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/docs/knowledge.md)
- [Tracing Tasks](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/docs/tracing-tasks.md)
- [Code Tasks & Acceptance Criteria](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/docs/code-tasks.md)
- [Stage Status](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/status.md)
