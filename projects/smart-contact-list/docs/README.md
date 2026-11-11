# Master Project: Smart Contact List (Context & Contact Intelligence Service)

The **Smart Contact List** is an enterprise contact and context intelligence microservice. It synthesizes all five core pillars of production AI backend engineering into a unified, battle-tested system.

## Architectural Synthesis

```mermaid
flowchart TD
    Client["Client / API Gateway"] --> Facade["SmartContactService (Unified Facade)"]
    Facade --> Tracer["Distributed Tracer (Stage 5)"]
    
    subgraph Ingestion["Stage 1: Resilient Extraction"]
        Facade --> IngestionService["ContactIngestionService"]
        IngestionService --> ResilientClient["ResilientLLMClient + Schema Validator"]
    end

    subgraph SearchOptimization["Stage 2 & 3: Hybrid Retrieval & Caching"]
        Facade --> SearchService["ContactSearchService"]
        SearchService --> Optimizer["CostLatencyOptimizer (L1/L2 Cache + Router)"]
        SearchService --> HybridEngine["HybridSearchEngine (BM25 + Dense + RRF + Decay)"]
    end

    subgraph AgentOperations["Stage 4: Safe Operations Agent"]
        Facade --> OpsAgent["ContactOperationsAgent"]
        OpsAgent --> SafeRunner["SafeAgentRunner (Step Budget + Idempotency)"]
        SafeRunner --> Gate["ApprovalGate (HITL Tokens for Deletions & Refunds)"]
    end
```

---

## Component Map

| Component | Role | Implementation |
| :--- | :--- | :--- |
| **Domain Types & Contracts** | Contact, interaction note, and query data contracts | [ContactTypes.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/src/ContactTypes.ts) |
| **Ingestion Service** | Extracts structured contacts from messy unstructured text with schema validation | [ContactIngestionService.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/src/ContactIngestionService.ts) |
| **Search Service** | Semantic + lexical hybrid search with freshness decay and two-tier caching | [ContactSearchService.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/src/ContactSearchService.ts) |
| **Operations Agent** | Autonomous CRM agent handling safe lookups and gated mutations (deletions, refunds) | [ContactOperationsAgent.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/src/ContactOperationsAgent.ts) |
| **Master Service Facade** | Unifies ingestion, search, safe agent ops, and OpenTelemetry tracing | [SmartContactService.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/src/SmartContactService.ts) |

## Documentation & Exercises
- [Knowledge Guide](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/docs/knowledge.md)
- [Tracing Tasks](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/docs/tracing-tasks.md)
- [Code Tasks & Acceptance Criteria](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/docs/code-tasks.md)
- [Project Status](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/status.md)
