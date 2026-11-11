# Stage 5 Code Tasks: Implementation Specifications

This document outlines the implementation specifications and acceptance criteria for Stage 5.

## Task 5.1: OpenTelemetry Distributed Tracer
- **Source File:**
  - [Tracer.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/05-evals-observability/src/Tracer.ts)
- **Acceptance Criteria:**
  - Generates unique hex `traceId` and `spanId`.
  - Supports nested child spans with `parentSpanId`.
  - Records arbitrary key-value attributes and timestamps.
  - Exports a hierarchical DAG tree representing the entire trace lifecycle.

---

## Task 5.2: Golden Dataset Definition
- **Source File:**
  - [GoldenDataset.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/05-evals-observability/src/GoldenDataset.ts)
- **Acceptance Criteria:**
  - Standardized benchmark test case interface: input prompt, required keywords, forbidden keywords, reference answer, schema.
  - Curated default golden dataset covering customer support, entity extraction, and policy lookups.

---

## Task 5.3: Multi-Tier Evaluator Engine
- **Source File:**
  - [Evaluators.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/05-evals-observability/src/Evaluators.ts)
- **Acceptance Criteria:**
  - `DeterministicEvaluator`: Checks schema, required keywords, forbidden keywords.
  - `SemanticEvaluator`: Computes cosine similarity against reference.
  - `LLMJudgeEvaluator`: Rubric-based scoring (1 to 5) with explanation.

---

## Task 5.4: CI Eval Suite Runner
- **Source File:**
  - [CIEvalRunner.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/05-evals-observability/src/CIEvalRunner.ts)
- **Acceptance Criteria:**
  - Executes all golden cases against a candidate prompt.
  - Computes composite pass percentage.
  - Returns `passed: true` if $\ge \text{passThreshold}$, otherwise `passed: false`.
  - Blocks degraded prompt changes in CI environments.
