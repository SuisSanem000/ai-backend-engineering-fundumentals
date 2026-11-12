# Master Project Tracing Tasks: End-to-End Walkthroughs

These tracing tasks allow you to follow the complete lifecycle of a real-world AI microservice.

## Tracing Task M.1: Unstructured Ingestion with Telemetry
- **Goal:** Trace raw text ingestion into structured database records with OpenTelemetry spans.
- **Trace Points:**
  1. Input: "Met with Sarah Connor from Cyberdyne Systems today. Her email is sarah@cyberdyne.com. Discussed neural network migration."
  2. Open span: `contact.ingest`.
  3. LLM executes structured extraction with schema parsing.
  4. Trace emitted tokens and cost receipt ($USD).
  5. Index contact note into VectorStore and BM25Index.
  6. Confirm contact record created with `company: 'Cyberdyne Systems'` and `email: 'sarah@cyberdyne.com'`.

---

## Tracing Task M.2: Cached Search & Freshness Reranking
- **Goal:** Observe hybrid retrieval with freshness decay and semantic cache hits.
- **Trace Points:**
  1. Query: "Who works on neural network architecture?".
  2. First query: Cache miss; hybrid RRF executes, returning Sarah Connor.
  3. Second query (paraphrase): "Find people specializing in neural networks".
  4. Trace L2 semantic cache match ($\ge 0.88$ similarity).
  5. Verify response returned in $<1\text{ms}$ at $\$0.00$ cost without querying the LLM.

---

## Tracing Task M.3: Gated Contact Deletion
- **Goal:** Trace agent attempting to delete a contact record requiring human sign-off.
- **Trace Points:**
  1. Directive: "Permanently delete contact for spammer Dave".
  2. Agent decides to call `delete_contact`.
  3. `ApprovalGate` suspends agent in `NEEDS_APPROVAL` state.
  4. Inspect generated `approvalToken`.
  5. Operator invokes `service.approveOperation(token)`.
  6. Verify contact is removed and agent returns `COMPLETED` confirmation.

