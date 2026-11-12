# Stage 4 Code Tasks: Implementation Specifications

This document defines the implementation requirements and acceptance criteria for Stage 4.

## Task 4.1: Agent Protocols & Idempotency Store
- **Source Files:**
  - [AgentTypes.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/src/AgentTypes.ts)
  - [IdempotencyStore.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/src/IdempotencyStore.ts)
- **Acceptance Criteria:**
  - Define state transitions: `IDLE`, `RUNNING`, `NEEDS_APPROVAL`, `COMPLETED`, `FAILED`.
  - `IdempotencyStore`: Thread-safe key-value cache indexed by idempotency key with TTL.
  - Return cached result if key exists; store newly executed tool result on commit.

---

## Task 4.2: Tool Registry with Risk Levels
- **Source File:**
  - [ToolRegistry.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/src/ToolRegistry.ts)
- **Acceptance Criteria:**
  - Tools declare Zod argument validation schemas.
  - Tools declare risk levels: `SAFE` (auto-executable) vs `REQUIRES_APPROVAL` (gated).
  - Enforce required `idempotencyKey` on state-mutating actions.

---

## Task 4.3: Human-in-the-Loop Approval Gate
- **Source File:**
  - [ApprovalGate.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/src/ApprovalGate.ts)
- **Acceptance Criteria:**
  - Issues cryptographically random `approvalToken` for gated actions.
  - Stores action parameters and expiration timestamp.
  - Provides `approve(token)` and `reject(token, reason)` methods.

---

## Task 4.4: Safe Agent Runner (Refund Practice Scenario)
- **Source File:**
  - [SafeAgentRunner.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/src/SafeAgentRunner.ts)
- **Acceptance Criteria:**
  - Implements ReAct state machine loop.
  - Enforces `maxSteps` (hard budget).
  - Suspends execution when approval is needed and resumes when token is granted.
  - Implements `issue_refund` safe scenario verifying zero duplicate refunds under retries.

