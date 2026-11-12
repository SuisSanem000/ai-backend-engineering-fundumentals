/**
 * AgentTypes: Contracts, state machine definitions, and execution payloads for autonomous agents.
 */

import { z } from 'zod';

export type AgentState =
  | 'IDLE'
  | 'RUNNING'
  | 'NEEDS_APPROVAL'
  | 'COMPLETED'
  | 'FAILED';

export type ActionRiskLevel = 'SAFE' | 'REQUIRES_APPROVAL';

export interface ToolDefinition<TArgs = unknown, TResult = unknown> {
  name: string;
  description: string;
  riskLevel: ActionRiskLevel;
  requiresIdempotencyKey: boolean;
  schema: z.ZodSchema<TArgs>;
  execute: (args: TArgs, idempotencyKey?: string) => Promise<TResult>;
}

export interface AgentStep {
  stepIndex: number;
  thought: string;
  toolCall?: {
    toolName: string;
    args: Record<string, unknown>;
    idempotencyKey?: string;
  };
  observation?: string;
  timestamp: number;
}

export interface PendingApproval {
  approvalToken: string;
  toolName: string;
  args: Record<string, unknown>;
  idempotencyKey?: string;
  reason: string;
  createdAt: number;
  expiresAt: number;
  approved: boolean;
}

export interface AgentExecutionResult {
  state: AgentState;
  finalAnswer?: string;
  steps: AgentStep[];
  pendingApproval?: PendingApproval;
  totalTokensUsed: number;
  totalCostUsd: number;
  durationMs: number;
}

