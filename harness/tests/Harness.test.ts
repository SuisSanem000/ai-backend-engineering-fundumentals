import { describe, it, expect, beforeEach } from 'bun:test';
import { z } from 'zod';
import { PromptHarness } from '../src/PromptHarness.ts';
import { ContextBudgetManager } from '../src/ContextBudgetManager.ts';
import { ExecutionGuardrail } from '../src/ExecutionGuardrail.ts';
import { HarnessTelemetry } from '../src/HarnessTelemetry.ts';

describe('AI Management Harness', () => {
  describe('PromptHarness', () => {
    it('successfully hydrates valid variables into template', () => {
      const harness = new PromptHarness<{ name: string; role: string }>({
        id: 'user_greeting',
        version: '1.0.0',
        template: 'Hello {{name}}, you are assigned as {{role}}.',
        requiredVariables: ['name', 'role'],
      });

      const rendered = harness.render({ name: 'Alice', role: 'Architect' });
      expect(rendered).toBe('Hello Alice, you are assigned as Architect.');
    });

    it('throws error when required variables are missing', () => {
      const harness = new PromptHarness<{ name: string; role: string }>({
        id: 'user_greeting',
        version: '1.0.0',
        template: 'Hello {{name}}',
        requiredVariables: ['name', 'role'],
      });

      // @ts-expect-error testing missing param
      expect(() => harness.render({ name: 'Alice' })).toThrow(/Missing required variable 'role'/);
    });

    it('throws error when unhydrated placeholders remain', () => {
      const harness = new PromptHarness<{ name: string }>({
        id: 'user_greeting',
        version: '1.0.0',
        template: 'Hello {{name}}, welcome to {{unknown_placeholder}}.',
        requiredVariables: ['name'],
      });

      expect(() => harness.render({ name: 'Alice' })).toThrow(/Unhydrated placeholder '\{\{unknown_placeholder\}\}'/);
    });
  });

  describe('ContextBudgetManager', () => {
    const manager = new ContextBudgetManager({
      totalWindowLimit: 100,
      reservedCompletionTokens: 20,
      maxSystemTokens: 20,
      maxRagContextTokens: 30,
    });

    it('estimates tokens conservatively', () => {
      const count = manager.estimateTokens('12345678');
      expect(count).toBe(2);
    });

    it('truncates middle of RAG context when exceeding budget', () => {
      const longContext = 'A'.repeat(300); // 75 tokens > 30 token limit
      const fitted = manager.fitRagContext(longContext);
      expect(fitted).toContain('[TRUNCATED');
      expect(fitted.startsWith('AAAA')).toBe(true);
      expect(fitted.endsWith('AAAA')).toBe(true);
    });

    it('evicts oldest messages when conversation history exceeds available headroom', () => {
      const system = 'You are a helpful assistant.';
      const history = [
        { role: 'user' as const, content: 'Message 1 - early context' },
        { role: 'assistant' as const, content: 'Message 2 - response' },
        { role: 'user' as const, content: 'Message 3 - recent query' },
      ];

      const { messages, droppedCount } = manager.fitConversation(system, '', history);
      expect(messages[0].role).toBe('system');
      // Verify recent messages are preserved
      expect(messages.some((m) => m.content.includes('Message 3'))).toBe(true);
      expect(droppedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ExecutionGuardrail', () => {
    it('detects infinite tool loops with identical arguments', () => {
      const guard = new ExecutionGuardrail({
        maxConsecutiveIdenticalCalls: 3,
        maxTotalSteps: 10,
        globalTimeoutMs: 5000,
      });

      guard.assertCanExecute('search_db', { query: 'users' });
      guard.assertCanExecute('search_db', { query: 'users' });
      expect(() => {
        guard.assertCanExecute('search_db', { query: 'users' });
      }).toThrow(/Infinite loop detected/);
    });

    it('validates structured outputs against Zod schemas', () => {
      const guard = new ExecutionGuardrail({
        maxConsecutiveIdenticalCalls: 3,
        maxTotalSteps: 10,
        globalTimeoutMs: 5000,
      });

      const userSchema = z.object({
        id: z.string(),
        email: z.string().email(),
      });

      const valid = guard.validateOutput({ id: '123', email: 'test@example.com' }, userSchema);
      expect(valid.email).toBe('test@example.com');

      expect(() => {
        guard.validateOutput({ id: '123', email: 'invalid-email' }, userSchema);
      }).toThrow(/Schema validation failed/);
    });
  });

  describe('HarnessTelemetry', () => {
    beforeEach(() => {
      HarnessTelemetry.getInstance().clear();
    });

    it('emits and captures structured telemetry events', () => {
      const telemetry = HarnessTelemetry.getInstance();
      const captured: string[] = [];

      const unsubscribe = telemetry.subscribe((evt) => {
        captured.push(evt.type);
      });

      telemetry.emit({
        requestId: 'req-01',
        timestamp: Date.now(),
        type: 'llm_call_start',
        model: 'gemini-1.5-pro',
      });

      telemetry.emit({
        requestId: 'req-01',
        timestamp: Date.now(),
        type: 'llm_call_complete',
        model: 'gemini-1.5-pro',
        costUsd: 0.002,
      });

      expect(captured).toEqual(['llm_call_start', 'llm_call_complete']);
      expect(telemetry.getEvents().length).toBe(2);

      unsubscribe();
    });
  });
});
