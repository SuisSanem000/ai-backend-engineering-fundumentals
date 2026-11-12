import { describe, it, expect, beforeEach } from 'bun:test';
import { HybridSearchEngine } from '../src/HybridSearchEngine.ts';
import { RAGPipeline } from '../src/RAGPipeline.ts';
import { ResilientLLMClient } from '../../01-resilient-llm-calls/src/ResilientLLMClient.ts';
import { MockLLMProvider } from '../../01-resilient-llm-calls/src/MockLLMProvider.ts';

describe('Stage 2: RAG Pipeline with Citations', () => {
  let searchEngine: HybridSearchEngine;
  let mockProvider: MockLLMProvider;
  let llmClient: ResilientLLMClient;
  let rag: RAGPipeline;

  beforeEach(() => {
    searchEngine = new HybridSearchEngine();
    mockProvider = new MockLLMProvider({
      modelName: 'gemini-1.5-pro',
      simulatedLatencyMs: 10,
      defaultResponse: 'The refund window is 30 calendar days [policy_doc:chunk_0].',
    });
    llmClient = new ResilientLLMClient(
      {
        primaryModel: 'gemini-1.5-pro',
        timeoutMs: 1000,
        maxRetries: 1,
        baseBackoffMs: 10,
      },
      mockProvider
    );
    rag = new RAGPipeline(searchEngine, llmClient);
  });

  it('generates grounded answers with verified citations', async () => {
    searchEngine.indexChunks([
      {
        chunkId: 'policy_doc:chunk_0',
        docId: 'policy_doc',
        index: 0,
        content: 'Our updated company policy states all customers have 30 days to request a refund.',
        estimatedTokens: 18,
        metadata: { timestamp: Date.now() },
      },
    ]);

    const result = await rag.answerQuestion('What is the refund window?');

    expect(result.retrievedChunks.length).toBe(1);
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.citations).toContain('policy_doc:chunk_0');
    expect(result.isFullyGrounded).toBe(true);
    expect(result.costUsd).toBeGreaterThan(0);
  });

  it('returns graceful message when no documents are found', async () => {
    const result = await rag.answerQuestion('Unknown query with empty store');
    expect(result.retrievedChunks.length).toBe(0);
    expect(result.answer).toContain('No relevant documentation found');
  });
});

