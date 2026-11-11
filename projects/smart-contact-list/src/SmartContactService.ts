/**
 * SmartContactService: Master unified microservice facade.
 * Coordinates Ingestion (Stage 1), Hybrid Search (Stage 2), Caching & Routing (Stage 3),
 * Safe Agent Operations (Stage 4), and OpenTelemetry Distributed Tracing (Stage 5).
 */

import { ContactRecord, IngestionResult, ContactSearchResponse } from './ContactTypes.ts';
import { ContactIngestionService } from './ContactIngestionService.ts';
import { ContactSearchService } from './ContactSearchService.ts';
import { ContactOperationsAgent } from './ContactOperationsAgent.ts';
import { HybridSearchEngine } from '../../../stages/02-retrieval-rag/src/HybridSearchEngine.ts';
import { CostLatencyOptimizer } from '../../../stages/03-cost-and-latency/src/CostLatencyOptimizer.ts';
import { ResilientLLMClient } from '../../../stages/01-resilient-llm-calls/src/ResilientLLMClient.ts';
import { MockLLMProvider } from '../../../stages/01-resilient-llm-calls/src/MockLLMProvider.ts';
import { Tracer, SpanNode } from '../../../stages/05-evals-observability/src/Tracer.ts';

export class SmartContactService {
  private readonly tracer: Tracer;
  private readonly ingestionService: ContactIngestionService;
  private readonly searchService: ContactSearchService;
  private readonly operationsAgent: ContactOperationsAgent;

  /**
   * Initializes the complete Smart Contact Intelligence platform.
   */
  constructor() {
    this.tracer = new Tracer();

    // Set up mock provider for default offline operations
    const defaultExtractorResponse = JSON.stringify({
      fullName: 'Sarah Connor',
      company: 'Cyberdyne Systems',
      email: 'sarah@cyberdyne.com',
      phone: '+1-555-0199',
      role: 'Chief of Security',
      tags: ['security', 'enterprise', 'infrastructure'],
      summary: 'Discussed neural network defense architecture and infrastructure security.',
    });

    const mockProvider = new MockLLMProvider({
      modelName: 'gemini-1.5-pro',
      simulatedLatencyMs: 10,
      defaultResponse: defaultExtractorResponse,
    });

    const llmClient = new ResilientLLMClient(
      {
        primaryModel: 'gemini-1.5-pro',
        fallbackModel: 'gemini-1.5-flash',
        timeoutMs: 2000,
        maxRetries: 2,
        baseBackoffMs: 10,
      },
      mockProvider
    );

    const hybridSearch = new HybridSearchEngine();
    const optimizer = new CostLatencyOptimizer();

    this.ingestionService = new ContactIngestionService(llmClient, hybridSearch);
    this.searchService = new ContactSearchService(
      hybridSearch,
      optimizer,
      (id) => this.ingestionService.getContact(id)
    );
    this.operationsAgent = new ContactOperationsAgent(this.ingestionService, llmClient);
  }

  /**
   * Ingests unstructured conversational text, returning a structured ContactRecord.
   */
  public async ingestContact(rawText: string): Promise<IngestionResult> {
    const traceId = Tracer.generateTraceId();
    const span = this.tracer.startSpan('contact.ingest', traceId, undefined, {
      rawTextLength: rawText.length,
    });

    try {
      const result = await this.ingestionService.ingestFromText(rawText);
      this.tracer.endSpan(span.spanId, 'OK', {
        contactId: result.contact.id,
        tokensUsed: result.tokensUsed,
        costUsd: result.costUsd,
      });
      return result;
    } catch (err) {
      this.tracer.endSpan(span.spanId, 'ERROR', { error: (err as Error).message });
      throw err;
    }
  }

  /**
   * Performs hybrid search over contact records and notes with multi-tier caching.
   */
  public async searchContacts(query: string, topK = 5): Promise<ContactSearchResponse> {
    const traceId = Tracer.generateTraceId();
    const span = this.tracer.startSpan('contact.search', traceId, undefined, { query, topK });

    try {
      const response = await this.searchService.search(query, topK);
      this.tracer.endSpan(span.spanId, 'OK', {
        matchCount: response.items.length,
        cacheHit: response.cacheHit,
      });
      return response;
    } catch (err) {
      this.tracer.endSpan(span.spanId, 'ERROR', { error: (err as Error).message });
      throw err;
    }
  }

  /**
   * Dispatches an operational CRM directive to the safe autonomous agent.
   */
  public async executeAgentDirective(directive: string) {
    const traceId = Tracer.generateTraceId();
    const span = this.tracer.startSpan('contact.agent_directive', traceId, undefined, { directive });

    try {
      const result = await this.operationsAgent.executeDirective(directive);
      this.tracer.endSpan(span.spanId, 'OK', {
        agentState: result.state,
        stepsExecuted: result.steps.length,
      });
      return result;
    } catch (err) {
      this.tracer.endSpan(span.spanId, 'ERROR', { error: (err as Error).message });
      throw err;
    }
  }

  /**
   * Authorizes a suspended high-risk action using an operator approval token.
   */
  public async approveOperation(approvalToken: string) {
    const traceId = Tracer.generateTraceId();
    const span = this.tracer.startSpan('contact.approve_operation', traceId, undefined, { approvalToken });

    try {
      const result = await this.operationsAgent.approveAndResume(approvalToken);
      this.tracer.endSpan(span.spanId, 'OK', { finalState: result.state });
      return result;
    } catch (err) {
      this.tracer.endSpan(span.spanId, 'ERROR', { error: (err as Error).message });
      throw err;
    }
  }

  /**
   * Exports accumulated distributed trace spans as a hierarchical DAG.
   */
  public getTraceTree(): SpanNode[] {
    return this.tracer.exportTraceTree();
  }

  /**
   * Returns all contacts currently in repository.
   */
  public getAllContacts(): ContactRecord[] {
    return this.ingestionService.getAllContacts();
  }
}
