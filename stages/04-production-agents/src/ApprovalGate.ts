/**
 * ApprovalGate: Human-in-the-Loop (HITL) authorization state machine.
 * Issues and tracks one-time cryptographic approval tokens for high-risk operations.
 */

import { randomBytes } from 'node:crypto';
import { PendingApproval } from './AgentTypes.ts';

export class ApprovalGate {
  private readonly pendingApprovals = new Map<string, PendingApproval>();
  private readonly defaultExpiryMs: number;

  /**
   * Initializes ApprovalGate with default token expiration window.
   * 
   * @param defaultExpiryMs - Token validity duration in milliseconds (default: 15 minutes).
   */
  constructor(defaultExpiryMs = 900000) {
    this.defaultExpiryMs = defaultExpiryMs;
  }

  /**
   * Creates a pending approval record and issues a unique approval token.
   * 
   * @param toolName - Gated tool name.
   * @param args - Proposed tool arguments.
   * @param reason - Explanation for human operator review.
   * @param idempotencyKey - Optional transaction key.
   * @returns PendingApproval object containing token and expiration.
   */
  public requestApproval(
    toolName: string,
    args: Record<string, unknown>,
    reason: string,
    idempotencyKey?: string
  ): PendingApproval {
    const approvalToken = `appr_${randomBytes(12).toString('hex')}`;
    const now = Date.now();

    const pending: PendingApproval = {
      approvalToken,
      toolName,
      args,
      idempotencyKey,
      reason,
      createdAt: now,
      expiresAt: now + this.defaultExpiryMs,
      approved: false,
    };

    this.pendingApprovals.set(approvalToken, pending);
    return pending;
  }

  /**
   * Authorizes a pending approval token.
   * 
   * @param token - The approval token string.
   * @returns Authorized PendingApproval record.
   */
  public approve(token: string): PendingApproval {
    const entry = this.pendingApprovals.get(token);
    if (!entry) {
      throw new Error(`InvalidApprovalToken: Token '${token}' not found.`);
    }

    if (Date.now() > entry.expiresAt) {
      this.pendingApprovals.delete(token);
      throw new Error(`ExpiredApprovalToken: Token '${token}' has expired.`);
    }

    entry.approved = true;
    return entry;
  }

  /**
   * Rejects and revokes a pending approval token.
   * 
   * @param token - The approval token string.
   * @param reason - Operator rejection rationale.
   */
  public reject(token: string, reason: string): void {
    const entry = this.pendingApprovals.get(token);
    if (!entry) {
      throw new Error(`InvalidApprovalToken: Token '${token}' not found.`);
    }
    this.pendingApprovals.delete(token);
  }

  /**
   * Retrieves pending approval details.
   */
  public getPending(token: string): PendingApproval | undefined {
    return this.pendingApprovals.get(token);
  }
}
