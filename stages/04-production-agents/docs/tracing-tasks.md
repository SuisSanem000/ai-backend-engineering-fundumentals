# Stage 4 Tracing Tasks: Safe Agent Operations

These tracing tasks guide you through observing agent loop bounds, idempotency guarantees, and human authorization checkpoints.

## Tracing Task 4.1: Step Budget Bound Enforcement
- **Goal:** Trace an agent exceeding its configured step budget.
- **Trace Points:**
  1. Configure agent with `maxSteps = 3`.
  2. Prompt agent to resolve an impossible cyclic task.
  3. Observe loop iterations:
     - Step 1: Tool call attempted.
     - Step 2: Tool call attempted.
     - Step 3: Tool call attempted.
     - Step 4: Step budget boundary reached.
  4. Verify agent aborts cleanly, throws `StepBudgetExceededError`, and logs current execution history.

---

## Tracing Task 4.2: Idempotency Key Duplicate Prevention
- **Goal:** Trace duplicate financial refund tool calls returning cached results.
- **Trace Points:**
  1. Agent calls tool `issue_refund` with `orderId: 'ord_123'`, `amount: 45`, `idempotencyKey: 'idemp_ord_123'`.
  2. First execution: Payment gateway contacted, refund processed, result stored.
  3. Simulate agent hallucination or network retry invoking identical tool call with same idempotency key.
  4. Trace tool response: Detects key collision in `IdempotencyStore`, avoids payment gateway, and returns prior result.
  5. Confirm financial ledger records only one single refund transaction.

---

## Tracing Task 4.3: Human-in-the-Loop Approval Workflow
- **Goal:** Trace agent execution halting on a $250 refund and resuming post-approval.
- **Trace Points:**
  1. Inbound task: "Issue customer a \$250 refund for defective order ord_999".
  2. Agent calls `issue_refund` for \$250.
  3. ApprovalGate detects amount exceeds auto-approval threshold (\$50).
  4. Agent state transitions to `NEEDS_APPROVAL`.
  5. Inspect generated `approvalToken` and pending action payload.
  6. Operator invokes `approvalGate.approve(token)`.
  7. Resume agent: Tool executes safely, and agent completes workflow with confirmation.

