# Stage 4: Agents in Production (Safe Action Execution)

Autonomous LLM agents with tool-calling capabilities can execute real-world side effects. In backend production environments, uncontrolled agents introduce catastrophic risks: runaway API loops, duplicate database writes, and unauthorized financial transactions.

## Architectural Objectives
- Frame the ReAct (Reasoning + Acting) loop as a strictly bounded, deterministic state machine.
- Enforce hard step budgets to prevent runaway recursion and financial burn.
- Guarantee that external side-effects (e.g. database mutations, payment refunds) are **strictly idempotent** via cryptographic idempotency keys.
- Implement a **Human-in-the-Loop (HITL)** approval gate for high-risk operations (e.g., monetary transactions above a risk threshold).
- Maintain an immutable audit log of all agent thoughts, tool calls, and human approvals.

## Component Map

| Component | Responsibility | Implementation |
| :--- | :--- | :--- |
| **Agent Types & Contracts** | Defines state machine, tool definitions, and message protocols | [AgentTypes.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/src/AgentTypes.ts) |
| **Idempotency Store** | Caches tool execution results by idempotency key to prevent double execution | [IdempotencyStore.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/src/IdempotencyStore.ts) |
| **Tool Registry** | Typed RPC tool registry with Zod validation and risk levels | [ToolRegistry.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/src/ToolRegistry.ts) |
| **Approval Gate** | Manages HITL approval tokens, expirations, and authorizations | [ApprovalGate.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/src/ApprovalGate.ts) |
| **Safe Agent Runner** | ReAct orchestrator enforcing step budgets, idempotency, and HITL gates | [SafeAgentRunner.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/src/SafeAgentRunner.ts) |

## Documentation & Exercises
- [Knowledge Guide](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/docs/knowledge.md)
- [Tracing Tasks](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/docs/tracing-tasks.md)
- [Code Tasks & Acceptance Criteria](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/docs/code-tasks.md)
- [Stage Status](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/status.md)

