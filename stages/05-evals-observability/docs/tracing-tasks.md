# Stage 5 Tracing Tasks: Evals & Observability

These tracing tasks demonstrate tracing hierarchical spans and catching prompt regressions in CI.

## Tracing Task 5.1: Hierarchical Trace Span Inspection
- **Goal:** Trace a complete AI transaction showing parent and child spans.
- **Trace Points:**
  1. Start root span: `POST /api/v1/query`.
  2. Start child span: `cache.l1_lookup`.
  3. Start child span: `rag.hybrid_search`.
  4. Start child span: `llm.generate` with attributes `llm.model`, `tokens`, `cost_usd`.
  5. Close all spans in order.
  6. Export trace DAG and verify parent-child relational tree and duration distribution.

---

## Tracing Task 5.2: LLM-as-a-Judge Rubric Evaluation
- **Goal:** Trace an automated judge scoring a generated response against a rubric.
- **Trace Points:**
  1. Input: Customer asking about account cancellation.
  2. Model response: Missing refund policy notice.
  3. Judge evaluates against golden rubric:
     - Dimension: Completeness (Score: 2/5 - failed to mention refund terms).
  4. Trace judge output rationale explaining the score deduction.

---

## Tracing Task 5.3: CI Regression Gating in Action
- **Goal:** Observe CI blocking a bad prompt change.
- **Trace Points:**
  1. Baseline Prompt: Produces 100% pass rate against Golden Dataset.
  2. Degraded Prompt: An engineer edits prompt to be "more casual", accidentally omitting mandatory JSON schema keys.
  3. Execute `CIEvalRunner`.
  4. Observe validation failures on test cases 2 and 4.
  5. Composite score drops to 60% (below 90% threshold).
  6. Verify runner sets exit code 1, blocking the CI build.
