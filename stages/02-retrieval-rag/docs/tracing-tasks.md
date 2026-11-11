# Stage 2 Tracing Tasks: Hybrid Search & Grounding

These practical tracing tasks demonstrate how hybrid ranking and temporal decay resolve retrieval edge cases.

## Tracing Task 2.1: Semantic Match vs. Keyword Match
- **Goal:** Observe rank difference between pure BM25, pure vector search, and hybrid RRF.
- **Trace Points:**
  1. Index two documents:
     - Doc A: Exact error code string `ERR_NETWORK_DISCONNECTED_V2`.
     - Doc B: General discussion about internet connection drops without the error code.
  2. Query for `ERR_NETWORK_DISCONNECTED_V2`.
  3. Observe: BM25 ranks Doc A #1, vector search might rank Doc B #1 due to broad language semantics.
  4. Inspect hybrid RRF output: Doc A emerges as #1 with highest fused score.

---

## Tracing Task 2.2: Freshness Decay in Action
- **Goal:** Trace temporal decay penalizing stale documentation.
- **Trace Points:**
  1. Document 1: "Refund policy allows 14 days" (timestamp: 365 days ago).
  2. Document 2: "Updated refund policy allows 30 days" (timestamp: 2 days ago).
  3. Query: "What is our refund window?".
  4. Trace the decay calculation: Document 1's score is penalized by exponential time decay, promoting Document 2 to the top citation.

---

## Tracing Task 2.3: Citation Extraction & Provenance Audit
- **Goal:** Audit LLM generation against retrieved chunks.
- **Trace Points:**
  1. Inspect retrieved chunks injected into prompt.
  2. Parse citation tokens `[doc_id:chunk_idx]` from LLM completion.
  3. Trace citation validation check: verify that all cited chunks exist in the retrieved context set.

