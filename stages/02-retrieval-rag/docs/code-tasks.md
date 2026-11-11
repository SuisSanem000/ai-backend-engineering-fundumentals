# Stage 2 Code Tasks: Implementation Specifications

This document outlines the implementation specifications and acceptance criteria for Stage 2.

## Task 2.1: Sliding Window Text Chunker
- **Source File:**
  - [TextChunker.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/TextChunker.ts)
- **Acceptance Criteria:**
  - Splits text documents into chunks of configurable token sizes (e.g. 100 tokens).
  - Maintains configurable overlap between adjacent chunks (e.g. 20 tokens).
  - Preserves sentence boundaries where possible.
  - Generates stable chunk IDs: `<docId>:chunk_<index>`.

---

## Task 2.2: Dual Indices: VectorStore & BM25Index
- **Source Files:**
  - [VectorStore.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/VectorStore.ts)
  - [BM25Index.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/BM25Index.ts)
- **Acceptance Criteria:**
  - `VectorStore`: In-memory storage with cosine similarity computation and metadata filter predicate support.
  - `BM25Index`: Tokenizes text, computes document lengths and inverse document frequencies, and returns ranked BM25 scores.

---

## Task 2.3: HybridSearchEngine with RRF & Freshness Decay
- **Source File:**
  - [HybridSearchEngine.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/HybridSearchEngine.ts)
- **Acceptance Criteria:**
  - Executes simultaneous queries against dense and sparse indices.
  - Combines rankings using Reciprocal Rank Fusion: `1 / (k + rank)`.
  - Applies exponential decay based on document timestamp age: `decay = exp(-lambda * deltaDays)`.
  - Returns top-K results sorted by decayed composite score.

---

## Task 2.4: Grounded RAG Pipeline with Citations
- **Source File:**
  - [RAGPipeline.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/RAGPipeline.ts)
- **Acceptance Criteria:**
  - Retrieves top-K context chunks.
  - Formats grounded prompt requiring `[docId:chunkIdx]` citation tags.
  - Invokes ResilientLLMClient.
  - Extracts and verifies citations from completion text against retrieved candidates.

