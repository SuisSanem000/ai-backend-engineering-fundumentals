# Architecture Blueprint: Production AI Backend Engineering

This document specifies the technical architecture, component boundaries, and interaction flows across the entire platform.

## 1. High-Level System Architecture

```mermaid
flowchart TD
    Client["Client / API Gateway"] --> Router["Model Router & Cache Layer (Stage 3)"]
    
    subgraph OptimizationTier["Stage 3: Optimization Tier"]
        Router --> CacheExact["Exact SHA-256 Prompt Cache"]
        Router --> CacheSemantic["Semantic Vector Cache"]
        Router --> BatchQueue["Micro-Batching Queue"]
    end

    subgraph CoreAITier["Stage 1: Resilient LLM Tier"]
        BatchQueue --> ResilientClient["Resilient LLM Client"]
        CacheSemantic -- "Miss" --> ResilientClient
        ResilientClient --> CircuitBreaker["Circuit Breaker (Closed/Open/Half-Open)"]
        CircuitBreaker --> PrimaryProvider["Primary LLM Provider"]
        CircuitBreaker -- "Failover" --> FallbackProvider["Fallback LLM Provider"]
        ResilientClient --> CostMeter["Token & Cost Meter"]
    end

    subgraph RetrievalTier["Stage 2: Hybrid RAG Tier"]
        RAG["RAG Pipeline"] --> DenseIndex["Dense Vector Store"]
        RAG --> SparseIndex["Sparse BM25 Index"]
        DenseIndex --> RRF["Reciprocal Rank Fusion (RRF)"]
        SparseIndex --> RRF
        RRF --> DecayFilter["Freshness & Metadata Decay Filter"]
        DecayFilter --> ResilientClient
    end

    subgraph AgentTier["Stage 4: Safe Agent Tier"]
        Agent["Safe Agent Runner (ReAct)"] --> BudgetGuard["Step Budget Guard"]
        Agent --> IdempotencyManager["Idempotency Manager"]
        Agent --> ApprovalGate["Human-in-the-Loop Approval Gate"]
        IdempotencyManager --> Tools["External APIs & Side-Effects"]
    end

    subgraph ObservabilityTier["Stage 5: Observability & CI"]
        Tracer["Lightweight Distributed Tracer"] -.-> CoreAITier
        Tracer -.-> RetrievalTier
        Tracer -.-> AgentTier
        EvalSuite["CI Golden Dataset Eval Harness"] --> ResilientClient
    end
```

---

## 2. Component Specifications

### 2.1 Resilient LLM Layer (Stage 1)
- **Role:** Guarantees fault tolerance for non-deterministic and flaky LLM providers.
- **Key Invariants:**
  - Every external call is bounded by an explicit timeout deadline (`AbortSignal`).
  - Retries apply exponential backoff with randomized full jitter to prevent synchronized retry spikes.
  - Failures trigger circuit breaker state transitions (3 failures -> OPEN state for 30 seconds).
  - Unrecoverable primary errors fall back to an auxiliary, lightweight model.
  - Responses are parsed against strict runtime schemas with deterministic error handling.

### 2.2 Hybrid Retrieval Engine (Stage 2)
- **Role:** High-accuracy document and context retrieval combining semantic intent with exact keyword matching.
- **Key Invariants:**
  - Token chunking enforces sliding windows with token boundaries to prevent context fragmentation.
  - Hybrid scoring uses Reciprocal Rank Fusion: rank score is computed as `1 / (k + rank)`.
  - Freshness filtering applies exponential decay based on document timestamp age: `decay = exp(-lambda * deltaDays)`.
  - Generation outputs include strict provenance citations pointing to source chunk IDs.

### 2.3 Optimization & Caching Engine (Stage 3)
- **Role:** Minimizes operational cost and response latency through multi-tier caching and intelligent routing.
- **Key Invariants:**
  - Tier 1 Exact Cache: Fast in-memory SHA-256 hash lookup with microsecond access.
  - Tier 2 Semantic Cache: High-dimensional vector cosine similarity lookup. If similarity is greater than or equal to the threshold (e.g., 0.92), returns cached result without downstream LLM call.
  - Dynamic Router: Classifies prompts into low-complexity (routed to small, cost-efficient model) and high-complexity (routed to frontier model).

### 2.4 Safe Agent Execution Engine (Stage 4)
- **Role:** Orchestrates autonomous agent tool calling while maintaining deterministic control boundaries.
- **Key Invariants:**
  - Maximum iteration budget: The ReAct loop terminates if the step budget (e.g., 6 steps) is exceeded.
  - Idempotent tool execution: Mutations take an `idempotencyKey`. Repeated tool calls return the cached execution result without re-executing side-effects.
  - Sensitive operations (e.g., issuing monetary refunds or deleting entities) halt agent execution and generate an `ApprovalToken` pending human review.

### 2.5 Observability & CI Evaluation Harness (Stage 5)
- **Role:** Continuous verification and distributed tracing across all AI interactions.
- **Key Invariants:**
  - Hierarchical tracing spans record start/end timestamps, token counts, cost, and metadata attributes.
  - Golden test datasets are evaluated across deterministic and LLM-as-judge rubrics.
  - The CI eval runner enforces score thresholds (e.g. minimum 90% accuracy) and fails the build on regression.

