# 30-Hour AI Backend Engineering Curriculum for Senior Engineers

This curriculum is structured for a Senior Web Backend Developer. It translates machine learning abstractions into standard distributed systems primitives (RPC resilience, caching tiers, inverted indexes, state machine invariants, CI regression tests).

## Overview Schedule

| Phase | Module | Focus Area | Recommended Time | Cumulative |
| :--- | :--- | :--- | :--- | :--- |
| **01** | Harness Engineering | AI Management Harness & Context Budgeting | 3 Hours | 3 Hours |
| **02** | Stage 1: LLM Calls | Resilient RPCs, Retries, Jitter, Fallbacks, Schemas | 5 Hours | 8 Hours |
| **03** | Stage 2: Retrieval | Hybrid RAG, BM25, Embeddings, RRF, Provenance | 6 Hours | 14 Hours |
| **04** | Stage 3: Cost & Latency | Exact & Semantic Caching, Model Routing, Batching | 4 Hours | 18 Hours |
| **05** | Stage 4: Production Agents | State Machines, Step Budgets, Idempotency, HITL | 5 Hours | 23 Hours |
| **06** | Stage 5: Evals & Tracing | Golden Datasets, LLM-as-Judge, CI Gating, Spans | 4 Hours | 27 Hours |
| **07** | Master Project | Smart Contact Intelligence Backend Service | 3 Hours | 30 Hours |

---

## Detailed Module Breakdown

### Module 01: Harness Engineering Flow (Hours 1 - 3)
- **Objective:** Establish the foundation for controlling, budgeting, and safeguarding AI components in backend services.
- **Key Concepts:**
  - Prompt contract enforcement and schema validation.
  - Token budget allocations and sliding context windows.
  - Guardrail tripwires and deterministic error boundaries.
- **Practical Exercises:**
  - Inspecting token allocation across system prompts, tools, and user context.
  - Tracing context eviction when conversation history exceeds context limits.

### Module 02: Stage 1 - LLM Calls are Backend Calls (Hours 4 - 8)
- **Objective:** Treat LLM invocations not as magical oracles, but as high-latency, failure-prone downstream HTTP/gRPC dependencies.
- **Key Concepts:**
  - Token serialization and streaming protocols (Server-Sent Events).
  - Timeout budgeting (deadline propagation) across downstream calls.
  - Exponential backoff with full jitter to avoid thundering herds.
  - Circuit Breakers (Closed, Open, Half-Open) to fail fast when providers degrade.
  - Degradation strategy: Model fallback cascades (Primary -> Cheaper/Faster Fallback).
  - Structured output parsing with strict JSON schema validation.
- **Practical Exercises:**
  - Simulating provider 429 and 503 outages with retry backoff tracing.
  - Verifying fallback model invocation when latency deadlines are exceeded.
  - Per-request cost metering and token accounting.

### Module 03: Stage 2 - Retrieval & Hybrid RAG (Hours 9 - 14)
- **Objective:** Build a production retrieval engine combining dense vector search and sparse lexical search with rank fusion and temporal decay.
- **Key Concepts:**
  - Token chunking strategies: token bounds, sliding windows, boundary detection.
  - Dense representations: Vector embeddings, cosine similarity, dimensional geometry.
  - Sparse representations: Inverted indexes, TF-IDF, BM25 term weighting.
  - Reciprocal Rank Fusion (RRF): Merging heterogeneous scoring spaces.
  - Metadata filtering and temporal freshness exponential decay.
  - Grounded RAG with strict citation extraction and provenance verification.
- **Practical Exercises:**
  - Tracing ranking shifts between pure BM25, pure vector search, and hybrid RRF.
  - Measuring retrieval quality with outdated documents versus fresh documents.

### Module 04: Stage 3 - Cost and Latency Optimization (Hours 15 - 18)
- **Objective:** Halve cost and latency profiles without sacrificing response quality.
- **Key Concepts:**
  - Exact prompt hashing: Cryptographic SHA-256 cache with sub-millisecond retrieval.
  - Semantic vector cache: High-dimensional cosine similarity indexing with tunable threshold.
  - Intent-based model routing: Sending lightweight queries to low-cost models and complex reasoning queries to frontier models.
  - Micro-batching: Grouping concurrent background queries to optimize throughput.
- **Practical Exercises:**
  - Measuring cache hit rate on paraphrased questions.
  - Benchmarking P95 latency and total token expense across routed queries.

### Module 05: Stage 4 - Agents in Production (Hours 19 - 23)
- **Objective:** Deploy autonomous LLM agents that execute external actions safely without runaway loops or duplicate side-effects.
- **Key Concepts:**
  - ReAct state machine: Thought -> Action -> Observation cycle.
  - Hard step budgets and execution loop breakers.
  - Idempotent tool execution using unique idempotency keys to avoid duplicate mutations.
  - Human-in-the-Loop (HITL) approval gates: Suspending execution state, issuing approval tokens, and resuming upon authorization.
- **Practical Exercises:**
  - Tracing a multi-step financial refund workflow.
  - Triggering an approval token requirement for operations exceeding risk thresholds.
  - Verifying that repeated execution attempts with the same idempotency key return cached results.

### Module 06: Stage 5 - Evals and Observability (Hours 24 - 27)
- **Objective:** Establish continuous integration regression testing and distributed tracing for AI pipelines.
- **Key Concepts:**
  - Golden test datasets: Ground truth reference cases.
  - Deterministic evaluators: Exact match, regex, schema compliance, latency bounds.
  - LLM-as-a-Judge: Automated evaluation rubrics for tone, accuracy, and conciseness.
  - Distributed tracing: OpenTelemetry-compatible traces, spans, and metadata graphs.
  - CI gating: Automating pass/fail thresholds in pipeline execution to block degraded prompts.
- **Practical Exercises:**
  - Executing a CI eval benchmark against a golden dataset.
  - Observing a test pipeline fail when a prompt regression lowers precision.

### Module 07: Master Project - Smart Contact Intelligence Backend (Hours 28 - 30)
- **Objective:** Synthesize all five stages into a cohesive, realistic enterprise microservice.
- **Key Concepts:**
  - Contact parsing & enrichment via resilient structured LLM calls.
  - Hybrid RAG over contact notes, past interactions, and communication logs.
  - Semantic query caching and model routing for contact lookups.
  - Safe agent for contact operations (updating records, merging duplicates, issuing refunds) with approval gates and idempotency.
  - Full observability tracing and CI evaluation suite.
