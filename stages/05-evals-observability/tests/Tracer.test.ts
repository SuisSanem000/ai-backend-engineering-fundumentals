import { describe, it, expect } from 'bun:test';
import { Tracer } from '../src/Tracer.ts';

describe('Stage 5: Distributed Tracer', () => {
  it('records hierarchical spans and exports valid DAG tree', () => {
    const tracer = new Tracer();
    const traceId = Tracer.generateTraceId();

    // Root span: Inbound request
    const rootSpan = tracer.startSpan('http.request', traceId, undefined, {
      path: '/api/v1/contacts',
    });

    // Child span 1: Cache check
    const cacheSpan = tracer.startSpan('cache.lookup', traceId, rootSpan.spanId);
    tracer.endSpan(cacheSpan.spanId, 'OK', { hit: false });

    // Child span 2: LLM generation
    const llmSpan = tracer.startSpan('llm.generate', traceId, rootSpan.spanId, {
      model: 'gemini-1.5-pro',
    });
    tracer.addEvent(llmSpan.spanId, 'ttft_received', { latencyMs: 15 });
    tracer.endSpan(llmSpan.spanId, 'OK', { promptTokens: 40, completionTokens: 25 });

    // Close root span
    tracer.endSpan(rootSpan.spanId, 'OK', { statusCode: 200 });

    const tree = tracer.exportTraceTree();
    expect(tree.length).toBe(1);
    expect(tree[0].name).toBe('http.request');
    expect(tree[0].children.length).toBe(2);
    expect(tree[0].children[0].name).toBe('cache.lookup');
    expect(tree[0].children[1].name).toBe('llm.generate');
    expect(tree[0].children[1].events.length).toBe(1);
    expect(tree[0].durationMs).toBeGreaterThanOrEqual(0);
  });
});
