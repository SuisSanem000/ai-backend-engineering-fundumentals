# Master Project Code Tasks: Implementation Specifications

This document outlines the implementation specifications and acceptance criteria for the Master Project.

## Task M.1: Domain Contracts
- **Source File:**
  - [ContactTypes.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/src/ContactTypes.ts)
- **Acceptance Criteria:**
  - Define `ContactRecord` schema (ID, name, company, email, role, tags, notes, createdAt).
  - Define `InteractionNote` schema (noteId, contactId, content, timestamp).
  - Define search request and response interfaces.

---

## Task M.2: Ingestion Service
- **Source File:**
  - [ContactIngestionService.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/src/ContactIngestionService.ts)
- **Acceptance Criteria:**
  - Integrates `ResilientLLMClient` with structured Zod schema parsing.
  - Chunks contact interaction notes via `TextChunker`.
  - Indexes chunks into `HybridSearchEngine`.

---

## Task M.3: Search Service
- **Source File:**
  - [ContactSearchService.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/src/ContactSearchService.ts)
- **Acceptance Criteria:**
  - Wraps hybrid RRF search with freshness decay.
  - Integrates L1 and L2 caching tiers via `CostLatencyOptimizer`.

---

## Task M.4: Operations Agent
- **Source File:**
  - [ContactOperationsAgent.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/src/ContactOperationsAgent.ts)
- **Acceptance Criteria:**
  - Safe tools: `search_contacts`, `get_contact_details`.
  - Mutating tools: `update_contact_notes` (with idempotency key).
  - High-risk tools: `delete_contact`, `issue_contact_refund` (`REQUIRES_APPROVAL`).
  - Halts with `NEEDS_APPROVAL` and resumes on operator authorization.

---

## Task M.5: Unified Master Service Facade
- **Source File:**
  - [SmartContactService.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/src/SmartContactService.ts)
- **Acceptance Criteria:**
  - Ties all services together under a clean, unified API.
  - Traces every request with OpenTelemetry-compatible `Tracer`.
