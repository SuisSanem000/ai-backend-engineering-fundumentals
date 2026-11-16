# Session Activity & Change Log

Atomic record of user requests, architectural fixes, and deployment milestones.

## 1. Initial Curriculum & Master Project Build (2026-11-11)
- Captured initial prompt in [initial-prompt.md](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/docs/ai-asistant/initial-prompt.md).
- Created 30-hour curriculum plans in [plans/](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/plans/README.md).
- Implemented AI Management Harness in [harness/](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/harness/docs/README.md).
- Implemented Stages 1 through 5 and Master Project (`SmartContactService`), achieving 35/35 passing tests.

## 2. Package Manager & Entrypoint Initialization (2026-11-16)
- Diagnosed missing global `pnpm` binary and generated `pnpm-lock.yaml`.
- Added live CLI demonstration entrypoint in [src/index.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/src/index.ts).
- Configured `start`, `demo`, `build`, and `test` scripts in [package.json](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/package.json).

## 3. Interactive Local UI Dashboard (2026-11-16)
- Built self-contained HTTP server and interactive dashboard in [src/server.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/src/server.ts) serving REST APIs and UI on port 3000.

## 4. Bugfixes, Browser Bundle & GitHub Actions Release Deployment (2026-11-16)
- **Fixed L1/L2 Search Caching:** Updated [ContactSearchService.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/projects/smart-contact-list/src/ContactSearchService.ts) to cache and return structured `SearchResultItem[]` payloads for exact (`EXACT`) and paraphrased (`SEMANTIC`) cache hits.
- **Fixed Dynamic CRM Extraction:** Updated [MockLLMProvider.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/01-resilient-llm-calls/src/MockLLMProvider.ts) to parse names, companies, and emails dynamically from unstructured text.
- **Browser Runtime Compatibility:** Replaced `node:crypto` imports in [Tracer.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/05-evals-observability/src/Tracer.ts), [ApprovalGate.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/04-production-agents/src/ApprovalGate.ts), and [ExactPromptCache.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/03-cost-and-latency/src/ExactPromptCache.ts) with universal Web Crypto / pure TypeScript primitives.
- **Static Pages Build & CI/CD:** Added [src/browser-app.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/src/browser-app.ts), [scripts/build-pages.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/scripts/build-pages.ts), and GitHub Actions workflow [deploy.yml](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/.github/workflows/deploy.yml) deploying automated GitHub Releases and live GitHub Pages.
