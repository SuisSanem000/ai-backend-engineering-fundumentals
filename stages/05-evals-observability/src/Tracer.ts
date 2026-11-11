/**
 * Tracer: Lightweight OpenTelemetry-compatible distributed tracing utility.
 * Generates structured spans with hierarchical parent-child relationships,
 * attributes, status codes, and JSON DAG export for observability visualization.
 */

import { randomBytes } from 'node:crypto';

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: 'OK' | 'ERROR';
  attributes: Record<string, unknown>;
  events: Array<{ name: string; timestamp: number; attributes?: Record<string, unknown> }>;
}

export interface SpanNode extends Span {
  children: SpanNode[];
}

export class Tracer {
  private readonly spans: Span[] = [];
  private readonly activeSpans = new Map<string, Span>();

  /**
   * Generates a 16-byte hex trace ID.
   */
  public static generateTraceId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Generates an 8-byte hex span ID.
   */
  public static generateSpanId(): string {
    return randomBytes(8).toString('hex');
  }

  /**
   * Starts a new span.
   * 
   * @param name - Operation name (e.g., 'llm.generate', 'rag.search').
   * @param traceId - Root trace identifier.
   * @param parentSpanId - Optional ID of the enclosing parent span.
   * @param initialAttributes - Initial key-value metadata.
   * @returns Newly initialized active Span.
   */
  public startSpan(
    name: string,
    traceId?: string,
    parentSpanId?: string,
    initialAttributes?: Record<string, unknown>
  ): Span {
    const span: Span = {
      traceId: traceId ?? Tracer.generateTraceId(),
      spanId: Tracer.generateSpanId(),
      parentSpanId,
      name,
      startTime: Date.now(),
      status: 'OK',
      attributes: { ...initialAttributes },
      events: [],
    };

    this.activeSpans.set(span.spanId, span);
    this.spans.push(span);
    return span;
  }

  /**
   * Closes an active span, calculating elapsed duration.
   * 
   * @param spanId - Identifier of the span to close.
   * @param status - Final completion status.
   * @param finalAttributes - Additional attributes to append.
   */
  public endSpan(
    spanId: string,
    status: 'OK' | 'ERROR' = 'OK',
    finalAttributes?: Record<string, unknown>
  ): Span {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      throw new Error(`SpanNotFoundError: Active span '${spanId}' not found.`);
    }

    span.endTime = Date.now();
    span.durationMs = span.endTime - span.startTime;
    span.status = status;
    if (finalAttributes) {
      span.attributes = { ...span.attributes, ...finalAttributes };
    }

    this.activeSpans.delete(spanId);
    return span;
  }

  /**
   * Adds an instant timeline event to an active span.
   */
  public addEvent(
    spanId: string,
    name: string,
    attributes?: Record<string, unknown>
  ): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.events.push({
        name,
        timestamp: Date.now(),
        attributes,
      });
    }
  }

  /**
   * Exports all recorded spans as a hierarchical Directed Acyclic Graph (DAG) tree.
   * 
   * @returns Array of root SpanNodes containing nested children.
   */
  public exportTraceTree(): SpanNode[] {
    const nodeMap = new Map<string, SpanNode>();
    for (const span of this.spans) {
      nodeMap.set(span.spanId, { ...span, children: [] });
    }

    const roots: SpanNode[] = [];
    for (const node of nodeMap.values()) {
      if (node.parentSpanId && nodeMap.has(node.parentSpanId)) {
        nodeMap.get(node.parentSpanId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Clears accumulated spans (for test teardown).
   */
  public clear(): void {
    this.spans.length = 0;
    this.activeSpans.clear();
  }
}
