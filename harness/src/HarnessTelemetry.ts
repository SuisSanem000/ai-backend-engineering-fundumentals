/**
 * HarnessTelemetry: Structured event emission and metrics collection for AI backend operations.
 * Captures latency distributions, token usage, cost accounting, and error states.
 */

export type TelemetryEventType =
  | 'llm_call_start'
  | 'llm_call_complete'
  | 'llm_call_retry'
  | 'llm_call_fallback'
  | 'llm_call_circuit_break'
  | 'guardrail_violation';

export interface TelemetryPayload {
  requestId: string;
  timestamp: number;
  type: TelemetryEventType;
  model?: string;
  durationMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  costUsd?: number;
  error?: string;
  attributes?: Record<string, unknown>;
}

export type TelemetrySubscriber = (event: TelemetryPayload) => void;

export class HarnessTelemetry {
  private static instance: HarnessTelemetry;
  private readonly subscribers: TelemetrySubscriber[] = [];
  private readonly events: TelemetryPayload[] = [];

  private constructor() {}

  /**
   * Singleton accessor for global telemetry dispatch.
   */
  public static getInstance(): HarnessTelemetry {
    if (!HarnessTelemetry.instance) {
      HarnessTelemetry.instance = new HarnessTelemetry();
    }
    return HarnessTelemetry.instance;
  }

  /**
   * Subscribes a listener callback to telemetry events.
   * @param subscriber - Function receiving emitted telemetry payloads.
   */
  public subscribe(subscriber: TelemetrySubscriber): () => void {
    this.subscribers.push(subscriber);
    return () => {
      const idx = this.subscribers.indexOf(subscriber);
      if (idx !== -1) {
        this.subscribers.splice(idx, 1);
      }
    };
  }

  /**
   * Emits a structured telemetry event to all registered listeners.
   * @param event - Telemetry event data.
   */
  public emit(event: TelemetryPayload): void {
    this.events.push(event);
    for (const sub of this.subscribers) {
      try {
        sub(event);
      } catch {
        // Defensive: telemetry listeners should never break runtime flow
      }
    }
  }

  /**
   * Retrieves an array of all recorded telemetry events.
   */
  public getEvents(): TelemetryPayload[] {
    return [...this.events];
  }

  /**
   * Clears accumulated event records (useful in test teardown).
   */
  public clear(): void {
    this.events.length = 0;
  }
}
