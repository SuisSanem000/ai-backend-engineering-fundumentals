# Stage 2: Retrieval & Hybrid RAG

In production AI backend systems, generative models suffer from knowledge cutoffs and hallucinations. Retrieval-Augmented Generation (RAG) grounds model completions with real, private enterprise documents.

## Architectural Objectives
- Overcome the limitations of pure vector search (which misses exact keyword matches, SKU codes, and acronyms) and pure lexical search (which misses semantic synonyms and conceptual equivalence).
- Implement a dual-index architecture: Dense Vector Embeddings + Sparse BM25 Inverted Index.
- Fuse multi-modal rankings into an optimal ranking order using **Reciprocal Rank Fusion (RRF)**.
- Apply temporal freshness exponential decay to deprioritize stale documentation.
- Enforce strict citation attribution to verify claims against source document chunks.

## Component Map

| Component | Responsibility | Implementation |
| :--- | :--- | :--- |
| **Text Chunker** | Slides window over documents with token overlap | [TextChunker.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/TextChunker.ts) |
| **Embedding Engine** | Computes vector representations and cosine similarity | [EmbeddingEngine.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/EmbeddingEngine.ts) |
| **Dense Vector Store** | In-memory similarity index with metadata filtering | [VectorStore.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/VectorStore.ts) |
| **BM25 Lexical Index** | Sparse inverted index with term frequency & length normalization | [BM25Index.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/BM25Index.ts) |
| **Hybrid Search Engine** | Merges dense & sparse results via RRF and applies freshness decay | [HybridSearchEngine.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/HybridSearchEngine.ts) |
| **RAG Pipeline** | Injects retrieved context and enforces citation verification | [RAGPipeline.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/RAGPipeline.ts) |

## Documentation & Exercises
- [Knowledge Guide](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/docs/knowledge.md)
- [Tracing Tasks](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/docs/tracing-tasks.md)
- [Code Tasks & Acceptance Criteria](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/docs/code-tasks.md)
- [Stage Status](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/status.md)

