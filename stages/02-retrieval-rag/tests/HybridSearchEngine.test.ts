import { describe, it, expect, beforeEach } from 'bun:test';
import { TextChunker } from '../src/TextChunker.ts';
import { VectorStore } from '../src/VectorStore.ts';
import { BM25Index } from '../src/BM25Index.ts';
import { HybridSearchEngine } from '../src/HybridSearchEngine.ts';

describe('Stage 2: Hybrid Search & Retrieval', () => {
  let chunker: TextChunker;
  let hybridEngine: HybridSearchEngine;

  beforeEach(() => {
    chunker = new TextChunker({ chunkTokenSize: 50, overlapTokens: 10 });
    hybridEngine = new HybridSearchEngine();
  });

  it('chunks documents with overlapping sliding windows and sentence preservation', () => {
    const docText =
      'First sentence introduces backend resilience. Second sentence explains circuit breakers. Third sentence covers retries and exponential jitter. Fourth sentence touches on token budgeting.';
    const chunks = chunker.chunkDocument('doc_resilience', docText, { tenant: 'engineering' });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].chunkId).toBe('doc_resilience:chunk_0');
    expect(chunks[0].metadata?.tenant).toBe('engineering');
  });

  it('ranks exact keywords with high relevance using BM25', () => {
    const bm25 = new BM25Index();
    const chunks = [
      {
        chunkId: 'doc_1:chunk_0',
        docId: 'doc_1',
        index: 0,
        content: 'System error ERR_SOCKET_HANGUP occurred during network transmission.',
        estimatedTokens: 10,
      },
      {
        chunkId: 'doc_2:chunk_0',
        docId: 'doc_2',
        index: 0,
        content: 'General performance monitoring and throughput metrics for database clusters.',
        estimatedTokens: 10,
      },
    ];

    bm25.addChunks(chunks);
    const results = bm25.search('ERR_SOCKET_HANGUP', 2);
    expect(results[0].chunk.chunkId).toBe('doc_1:chunk_0');
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('fuses dense and sparse rankings with Reciprocal Rank Fusion (RRF)', () => {
    const chunks = [
      {
        chunkId: 'doc_auth:chunk_0',
        docId: 'doc_auth',
        index: 0,
        content: 'OAuth2 and JWT token verification protocols for microservice gateways.',
        estimatedTokens: 12,
      },
      {
        chunkId: 'doc_db:chunk_0',
        docId: 'doc_db',
        index: 0,
        content: 'PostgreSQL indexing strategies and vacuuming optimization.',
        estimatedTokens: 10,
      },
    ];

    hybridEngine.indexChunks(chunks);
    const results = hybridEngine.search('JWT authentication tokens', { topK: 2 });

    expect(results.length).toBe(2);
    expect(results[0].chunk.chunkId).toBe('doc_auth:chunk_0');
    expect(results[0].finalScore).toBeGreaterThan(results[1].finalScore);
  });

  it('penalizes stale documents using exponential freshness decay', () => {
    const now = Date.now();
    const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

    const chunks = [
      {
        chunkId: 'policy_old:chunk_0',
        docId: 'policy_old',
        index: 0,
        content: 'Refund policy guidelines: customers have 14 days to request a refund.',
        estimatedTokens: 15,
        metadata: { timestamp: oneYearAgo },
      },
      {
        chunkId: 'policy_new:chunk_0',
        docId: 'policy_new',
        index: 0,
        content: 'Refund policy guidelines: customers have 30 days to request a refund.',
        estimatedTokens: 15,
        metadata: { timestamp: twoDaysAgo },
      },
    ];

    hybridEngine.indexChunks(chunks);

    // Search with reference time = now
    const results = hybridEngine.search('refund policy guidelines', {
      topK: 2,
      referenceTimeMs: now,
      decayLambda: 0.05,
    });

    // The newer document (policy_new) must rank above the older one due to freshness decay
    expect(results[0].chunk.chunkId).toBe('policy_new:chunk_0');
    expect(results[0].freshnessMultiplier).toBeGreaterThan(results[1].freshnessMultiplier);
  });
});
