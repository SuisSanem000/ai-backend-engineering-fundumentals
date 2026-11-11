/**
 * VectorStore: In-memory dense vector similarity index.
 * Supports k-Nearest Neighbors (k-NN) cosine search and metadata filtering predicates.
 */

import { Chunk } from './TextChunker.ts';
import { EmbeddingEngine } from './EmbeddingEngine.ts';

export interface VectorRecord {
  chunk: Chunk;
  vector: Float64Array;
}

export interface SearchMatch {
  chunk: Chunk;
  score: number;
}

export type MetadataFilter = (metadata?: Record<string, unknown>) => boolean;

export class VectorStore {
  private readonly records: VectorRecord[] = [];
  private readonly embedder: EmbeddingEngine;

  /**
   * Constructs an in-memory vector store bound to an embedding engine.
   * 
   * @param embedder - Embedding engine used for vector projection.
   */
  constructor(embedder?: EmbeddingEngine) {
    this.embedder = embedder ?? new EmbeddingEngine();
  }

  /**
   * Indexes a chunk, generating and storing its dense embedding vector.
   * 
   * @param chunk - Document chunk to index.
   */
  public addChunk(chunk: Chunk): void {
    const vector = this.embedder.embed(chunk.content);
    this.records.push({ chunk, vector });
  }

  /**
   * Bulk indexes an array of document chunks.
   * 
   * @param chunks - Array of chunks to index.
   */
  public addChunks(chunks: Chunk[]): void {
    for (const chunk of chunks) {
      this.addChunk(chunk);
    }
  }

  /**
   * Queries the vector index for the top-k most semantically similar chunks.
   * 
   * @param queryText - Search query string.
   * @param topK - Maximum number of matches to return.
   * @param filter - Optional metadata predicate filter.
   * @returns Array of SearchMatch objects sorted descending by cosine similarity score.
   */
  public search(
    queryText: string,
    topK = 5,
    filter?: MetadataFilter
  ): SearchMatch[] {
    const queryVector = this.embedder.embed(queryText);
    const matches: SearchMatch[] = [];

    for (const record of this.records) {
      if (filter && !filter(record.chunk.metadata)) {
        continue;
      }

      const score = this.embedder.cosineSimilarity(queryVector, record.vector);
      matches.push({ chunk: record.chunk, score });
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, topK);
  }

  /**
   * Returns total count of indexed vector records.
   */
  public count(): number {
    return this.records.length;
  }

  /**
   * Clears the index.
   */
  public clear(): void {
    this.records.length = 0;
  }
}

