# Stage 2: Retrieval & Hybrid RAG - Status

- **Status:** COMPLETED
- **Pass Rate:** 6/6 Tests Passing
- **Last Updated:** 2026-11-11
- **Module:** `stages/02-retrieval-rag/`

## Implemented Components
- [TextChunker.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/TextChunker.ts): Sliding-window token chunking with configurable overlap and sentence preservation.
- [EmbeddingEngine.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/EmbeddingEngine.ts): Dense embedding generator with L2 normalization and cosine similarity dot-product math.
- [VectorStore.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/VectorStore.ts): In-memory k-NN dense vector store with metadata filtering predicates.
- [BM25Index.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/BM25Index.ts): Sparse inverted index with Okapi BM25 term weighting, TF saturation, and document length normalization.
- [HybridSearchEngine.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/HybridSearchEngine.ts): Reciprocal Rank Fusion (RRF) combiner fusing dense and sparse lists with exponential freshness decay.
- [RAGPipeline.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/RAGPipeline.ts): Grounded QA pipeline injecting top-K candidate chunks and verifying source citation provenance tags.
- [HybridSearchEngine.test.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/tests/HybridSearchEngine.test.ts): Unit tests for chunking, BM25, RRF, and freshness decay.
- [RAGPipeline.test.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/tests/RAGPipeline.test.ts): Integration tests for citation verification and provenance auditing.
