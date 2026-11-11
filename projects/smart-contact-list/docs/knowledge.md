# Master Project Knowledge: Production Contact Intelligence Architecture

## 1. Real-World Challenges in AI CRM Systems
Conventional CRM systems (like Salesforce or HubSpot) suffer from low adoption because sales and support reps hate filling out structured forms. AI backends solve this by accepting unstructured input (email threads, messy meeting notes, voice transcripts) and automatically structuring, enriching, and deduplicating contacts.
- **Extraction Challenge:** Converting freeform text into strongly typed records without hallucinating missing fields.
- **Search Challenge:** Answering conceptual questions ("Who can help with enterprise payments?") using hybrid search across past notes rather than basic substring queries.
- **Safety Challenge:** Performing CRM mutations (e.g., merging duplicates or deleting accounts) without allowing hallucinated agent loops to corrupt enterprise records.

---

## 2. End-to-End Request Lifecycles

### Ingestion Flow
1. Client posts raw email text to `ingestFromText()`.
2. A distributed tracing span is opened: `contact.ingest`.
3. The prompt is validated and budgeted via the Harness.
4. `ResilientLLMClient` executes with schema parsing, deadline budgeting, and circuit breaker protection.
5. Emitted structured data is validated against the Zod schema.
6. The contact and notes are chunked and indexed into the dense VectorStore and sparse BM25Index.
7. An immutable cost receipt is recorded.

### Hybrid Query & Cache Flow
1. Client queries: "Show me contacts working in payment systems".
2. `ContactSearchService` checks L1 exact SHA-256 prompt cache.
3. On miss, it evaluates L2 semantic vector similarity against recent queries.
4. On miss, `HybridSearchEngine` runs simultaneous BM25 keyword matching and dense vector search.
5. Candidate scores are combined via Reciprocal Rank Fusion (RRF).
6. Temporal exponential decay filters out stale meeting notes from years ago.
7. Top-ranked contacts are returned, and results are cached across L1 and L2.

### Safe Agent Operation Flow
1. Client instructs agent: "Delete contact rec_123 and issue them a \$100 refund".
2. The agent activates the ReAct loop under a strict step budget (max 5 steps).
3. The agent attempts to call `delete_contact` and `issue_refund`.
4. The `ApprovalGate` catches the high-risk classification and halts execution.
5. The agent issues a secure `ApprovalToken` and serializes state as `NEEDS_APPROVAL`.
6. An authorized admin approves the token.
7. The agent resumes, passes the idempotency key, executes the mutation safely, and returns `COMPLETED`.
