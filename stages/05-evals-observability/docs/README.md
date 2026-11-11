# Stage 5: Evals & Observability

In traditional backend engineering, unit tests and regression suites guard against code regressions. In AI engineering, changing a single word in a system prompt can silently break output formatting, introduce hallucinations, or double token consumption.

## Architectural Objectives
- Treat prompt and model updates with the same rigor as database migrations and core API changes.
- Establish **Golden Datasets** representing production edge cases and ground-truth references.
- Implement **Multi-Tier Evaluators**:
  - Deterministic evaluators (schema compliance, regex assertion, latency bounds).
  - Semantic similarity evaluators (cosine similarity against reference).
  - LLM-as-a-Judge evaluators (rubric-based automated scoring).
- Integrate **Distributed Tracing** compatible with OpenTelemetry spans and trace hierarchies.
- Implement a **CI Eval Runner** that calculates composite accuracy and automatically blocks CI deployments on regression.

## Component Map

| Component | Responsibility | Implementation |
| :--- | :--- | :--- |
| **Distributed Tracer** | Creates OpenTelemetry-compatible spans, attributes, and DAG traces | [Tracer.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/05-evals-observability/src/Tracer.ts) |
| **Golden Dataset** | Manages benchmark test cases and ground truth assertions | [GoldenDataset.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/05-evals-observability/src/GoldenDataset.ts) |
| **Evaluators** | Deterministic, semantic, and LLM-as-judge rubric scoring engines | [Evaluators.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/05-evals-observability/src/Evaluators.ts) |
| **CI Eval Runner** | Executes benchmark suites, computes pass rates, and enforces CI quality gates | [CIEvalRunner.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/05-evals-observability/src/CIEvalRunner.ts) |

## Documentation & Exercises
- [Knowledge Guide](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/05-evals-observability/docs/knowledge.md)
- [Tracing Tasks](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/05-evals-observability/docs/tracing-tasks.md)
- [Code Tasks & Acceptance Criteria](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/05-evals-observability/docs/code-tasks.md)
- [Stage Status](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/05-evals-observability/status.md)
