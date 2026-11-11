# Stage 2 Knowledge: High-Precision Hybrid Retrieval & RAG

## 1. Chunking Strategies: The Retrieval Unit
If a document is indexed whole (e.g., 50 pages), embedding representations average out and lose specific details. If chunked into individual sentences, context is lost.
- **Sliding Window:** Divides text into chunks of target token length (e.g., 100 to 200 tokens) with an overlap margin (e.g., 20 to 40 tokens).
- **Sentence Boundary Preservation:** Prevents splitting across sentence boundaries to keep thoughts coherent.
- **Reference:** See [TextChunker.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/TextChunker.ts).

---

## 2. Dense Embeddings vs. Sparse Lexical Search
Enterprise queries require both semantic intuition and keyword precision:
- **Dense Vector Search:** Maps text into continuous high-dimensional vector space. Measures semantic affinity via Cosine Similarity.
  - *Strength:* Understands that "cloud latency issues" is related to "AWS network packet drops".
  - *Weakness:* Poor with exact alphanumeric strings, error codes (`ERR_CONN_REFUSED`), or exact customer IDs.
- **Sparse BM25 Search:** Inverted index scoring terms by Inverse Document Frequency (IDF) with sub-linear Term Frequency (TF) saturation.
  - *Strength:* Pins exact keywords, names, and identifiers immediately.
  - *Weakness:* Blind to synonyms and semantic paraphrase.
- **Reference:** See [VectorStore.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/VectorStore.ts) and [BM25Index.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/BM25Index.ts).

---

## 3. Reciprocal Rank Fusion (RRF) Reranking
Combining dense cosine scores (0.0 to 1.0) and sparse BM25 scores (0.0 to unbounded) directly via addition causes calibration skew.
- **RRF Principle:** Discard raw score magnitudes; merge based on rank position in each list.
- **Formula:** 
  $$\text{RRF Score}(d) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$
  where $r_m(d)$ is the 1-based rank of document $d$ in system $m$, and $k$ is a smoothing constant (typically $60$).
- Documents appearing near the top of both dense and sparse lists receive the highest composite score.
- **Reference:** See [HybridSearchEngine.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/HybridSearchEngine.ts).

---

## 4. Metadata Filtering & Temporal Freshness Decay
In backend engineering, documents possess timestamps and tenant attributes. An outdated policy doc from 2021 should not override a 2026 update.
- **Hard Filters:** SQL/Document predicates (e.g., `tenantId = 'acme'`, `category = 'policy'`) executed before or during vector ranking.
- **Freshness Decay:** Multiplies composite retrieval score by an exponential decay factor:
  $$\text{Freshness Multiplier} = e^{-\lambda \cdot \Delta t}$$
  where $\Delta t$ is the age in days and $\lambda$ is the decay velocity parameter.
- **Reference:** See [HybridSearchEngine.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/HybridSearchEngine.ts).

---

## 5. Grounded RAG with Citation Provenance
Uncontrolled LLM outputs hallucinate facts. Production RAG pipelines require every generated claim to cite its exact source chunk.
- Chunks injected into the prompt carry explicit identifiers: `[doc_id:chunk_idx]`.
- System prompt instructs the model to suffix assertions with citations.
- Post-processor parses citations and verifies that cited chunk IDs actually exist in the retrieved context payload.
- **Reference:** See [RAGPipeline.ts](file:///Users/siminshoeibizadeh/mienne/Programming/dev/projects/dev-mine/ai-backend-engineering-fundumentals/stages/02-retrieval-rag/src/RAGPipeline.ts).

