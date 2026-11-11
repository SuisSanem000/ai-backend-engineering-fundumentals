# AI Assistant Operating Context & Engineering Standards

## 1. Persona & Target Audience
- **Target Audience:** Senior Web Backend Developer (Distributed systems, microservices, databases, RPC, high availability).
- **Tone & Style:** Pragmatic, architectural, zero-fluff, production-grounded.
- **Goal:** Provide a comprehensive ~30-hour review curriculum and battle-tested TypeScript reference implementation for Production AI Backend Engineering.

## 2. Strict Architectural Constraints
1. **Separation of Concerns:** 
   - Markdown (`.md`) documentation files MUST NEVER contain code blocks or inline implementations. They explain concepts, state machines, tradeoffs, algorithms, and provide markdown links to the source files.
   - Code files (`.ts`) contain full, working implementations with clear architectural comments placed directly above classes, methods, and functions.
2. **Co-location per Stage:**
   - Every stage is self-contained in a dedicated folder containing `docs/`, `src/`, `tests/`, and an atomic `status.md`.
3. **Execution Environment:**
   - Node.js runtime / TypeScript.
   - Zero external paid API key requirement for offline testing (deterministic mock and simulation providers provided with zero external network flakiness, plus standard OpenAI/Anthropic compatible interfaces).
4. **Git Workflow:**
   - Atomic commits per stage.
   - Pushed directly to GitHub: `git@github.com:SuisSanem000/ai-backend-engineering-fundumentals.git`.

## 3. Curriculum Scope (The 5 Stages + Master Project)
- **Stage 1:** LLM calls as backend calls (Tokens, streaming, timeouts, retries with jitter, circuit breakers, fallback models, structured JSON schema).
- **Stage 2:** Retrieval & RAG (Dense embeddings, sparse BM25, hybrid Reciprocal Rank Fusion, metadata & freshness filters, citation provenance).
- **Stage 3:** Cost & Latency Optimization (Exact SHA-256 prompt cache, semantic vector cache, model routing, request batching).
- **Stage 4:** Agents in Production (ReAct loop, step budgets, idempotent tools, human approval tokens for critical actions).
- **Stage 5:** Evals & Observability (Golden datasets, LLM-as-judge, OpenTelemetry-compatible tracing, CI regression gating).
- **Master Project:** "Smart Contact List" - an intelligent backend service synthesizing all 5 stages.

