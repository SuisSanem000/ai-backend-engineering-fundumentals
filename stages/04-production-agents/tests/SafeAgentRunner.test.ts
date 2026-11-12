import { describe, it, expect, beforeEach } from 'bun:test';
import { z } from 'zod';
import { SafeAgentRunner, StepBudgetExceededError } from '../src/SafeAgentRunner.ts';
import { ToolRegistry } from '../src/ToolRegistry.ts';
import { ApprovalGate } from '../src/ApprovalGate.ts';
import { IdempotencyStore } from '../src/IdempotencyStore.ts';
import { ResilientLLMClient } from '../../01-resilient-llm-calls/src/ResilientLLMClient.ts';
import { MockLLMProvider } from '../../01-resilient-llm-calls/src/MockLLMProvider.ts';

describe('Stage 4: Safe Production Agents', () => {
  let toolRegistry: ToolRegistry;
  let approvalGate: ApprovalGate;
  let idempotencyStore: IdempotencyStore;
  let refundGatewayExecutionCount: number;

  beforeEach(() => {
    idempotencyStore = new IdempotencyStore();
    toolRegistry = new ToolRegistry(idempotencyStore);
    approvalGate = new ApprovalGate();
    refundGatewayExecutionCount = 0;

    // Register safe tool
    toolRegistry.registerTool({
      name: 'lookup_order',
      description: 'Look up order details by ID',
      riskLevel: 'SAFE',
      requiresIdempotencyKey: false,
      schema: z.object({ orderId: z.string() }),
      execute: async ({ orderId }) => ({
        orderId,
        status: 'DELIVERED',
        totalUsd: 150,
      }),
    });

    // Register high-risk side-effect tool
    toolRegistry.registerTool({
      name: 'issue_refund',
      description: 'Issues a monetary refund to customer account',
      riskLevel: 'REQUIRES_APPROVAL',
      requiresIdempotencyKey: true,
      schema: z.object({ orderId: z.string(), amountUsd: z.number().positive() }),
      execute: async ({ orderId, amountUsd }) => {
        refundGatewayExecutionCount++;
        return {
          refundId: `ref_${Math.random().toString(36).slice(2, 8)}`,
          orderId,
          amountUsd,
          status: 'PROCESSED',
        };
      },
    });
  });

  it('enforces idempotency keys preventing duplicate side effects under retries', async () => {
    const key = 'idemp_unique_refund_101';
    const refundArgs = { orderId: 'ord_101', amountUsd: 75 };

    // First execution -> calls actual gateway
    const res1 = await toolRegistry.executeTool('issue_refund', refundArgs, key);
    expect(res1.isIdempotentReplay).toBe(false);
    expect(refundGatewayExecutionCount).toBe(1);

    // Duplicate execution (retry with same idempotency key) -> skips gateway!
    const res2 = await toolRegistry.executeTool('issue_refund', refundArgs, key);
    expect(res2.isIdempotentReplay).toBe(true);
    // Gateway execution count MUST remain 1!
    expect(refundGatewayExecutionCount).toBe(1);
    expect(res2.result).toEqual(res1.result);
  });

  it('suspends on high-risk operations and resumes post-human-approval', async () => {
    const mockProvider = new MockLLMProvider({
      modelName: 'gemini-1.5-pro',
      simulatedLatencyMs: 5,
    });

    const llmClient = new ResilientLLMClient(
      {
        primaryModel: 'gemini-1.5-pro',
        timeoutMs: 1000,
        maxRetries: 1,
        baseBackoffMs: 10,
      },
      mockProvider
    );

    const runner = new SafeAgentRunner(
      { maxSteps: 5, agentName: 'RefundOpsAgent' },
      toolRegistry,
      approvalGate,
      llmClient
    );

    // Initiate task requiring a refund
    const initialResult = await runner.run('Issue a $150 refund for defective order ord_123');

    // 1. Must suspend in NEEDS_APPROVAL state
    expect(initialResult.state).toBe('NEEDS_APPROVAL');
    expect(initialResult.pendingApproval).toBeDefined();
    expect(initialResult.pendingApproval?.toolName).toBe('issue_refund');
    expect(refundGatewayExecutionCount).toBe(0); // Not executed yet!

    const token = initialResult.pendingApproval!.approvalToken;

    // 2. Operator grants approval
    const resumeResult = await runner.resumeWithApproval(token);

    // 3. Must execute and finish in COMPLETED state
    expect(resumeResult.state).toBe('COMPLETED');
    expect(refundGatewayExecutionCount).toBe(1);
    expect(resumeResult.steps.length).toBeGreaterThan(0);
  });

  it('halts with StepBudgetExceededError when step budget is exhausted', async () => {
    const cyclicProvider = new MockLLMProvider({
      modelName: 'gemini-1.5-pro',
      defaultResponse: JSON.stringify({
        thought: 'Looking up order repeatedly in cyclic loop...',
        toolCall: { name: 'lookup_order', args: { orderId: 'ord_loop' } },
      }),
    });

    const llmClient = new ResilientLLMClient(
      {
        primaryModel: 'gemini-1.5-pro',
        timeoutMs: 1000,
        maxRetries: 0,
        baseBackoffMs: 10,
      },
      cyclicProvider
    );

    const runner = new SafeAgentRunner(
      { maxSteps: 3, agentName: 'BoundedAgent' },
      toolRegistry,
      approvalGate,
      llmClient
    );

    expect(runner.run('Cyclic task that never terminates')).rejects.toThrow(
      StepBudgetExceededError
    );
  });
});

