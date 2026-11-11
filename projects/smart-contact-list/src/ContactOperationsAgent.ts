/**
 * ContactOperationsAgent: Autonomous CRM operations agent.
 * Handles safe read operations automatically while enforcing idempotency keys
 * and Human-in-the-Loop (HITL) authorization tokens for destructive mutations or refunds.
 */

import { z } from 'zod';
import { ToolRegistry } from '../../../stages/04-production-agents/src/ToolRegistry.ts';
import { ApprovalGate } from '../../../stages/04-production-agents/src/ApprovalGate.ts';
import { SafeAgentRunner } from '../../../stages/04-production-agents/src/SafeAgentRunner.ts';
import { ResilientLLMClient } from '../../../stages/01-resilient-llm-calls/src/ResilientLLMClient.ts';
import { ContactIngestionService } from './ContactIngestionService.ts';

export class ContactOperationsAgent {
  private readonly runner: SafeAgentRunner;
  private readonly approvalGate: ApprovalGate;
  private readonly toolRegistry: ToolRegistry;

  /**
   * Initializes operations agent with CRM tools and safety barriers.
   */
  constructor(
    ingestionService: ContactIngestionService,
    llmClient: ResilientLLMClient,
    approvalGate?: ApprovalGate
  ) {
    this.approvalGate = approvalGate ?? new ApprovalGate();
    this.toolRegistry = new ToolRegistry();

    // 1. Safe tool: Lookup contact details
    this.toolRegistry.registerTool({
      name: 'get_contact_by_id',
      description: 'Retrieves full contact record by contact ID',
      riskLevel: 'SAFE',
      requiresIdempotencyKey: false,
      schema: z.object({ contactId: z.string() }),
      execute: async ({ contactId }) => {
        const contact = ingestionService.getContact(contactId);
        return contact ?? { error: `Contact '${contactId}' not found.` };
      },
    });

    // 2. Safe mutating tool: Update contact notes (requires idempotencyKey)
    this.toolRegistry.registerTool({
      name: 'update_contact_notes',
      description: 'Appends an updated note to an existing contact record',
      riskLevel: 'SAFE',
      requiresIdempotencyKey: true,
      schema: z.object({
        contactId: z.string(),
        additionalNotes: z.string(),
      }),
      execute: async ({ contactId, additionalNotes }) => {
        const contact = ingestionService.getContact(contactId);
        if (!contact) return { error: 'Contact not found' };

        contact.notesSummary = `${contact.notesSummary || ''}\n${additionalNotes}`.trim();
        contact.updatedAt = Date.now();
        return { success: true, contactId, notesSummary: contact.notesSummary };
      },
    });

    // 3. High-risk mutating tool: Delete contact (REQUIRES_APPROVAL)
    this.toolRegistry.registerTool({
      name: 'delete_contact',
      description: 'Permanently deletes a contact record from the system',
      riskLevel: 'REQUIRES_APPROVAL',
      requiresIdempotencyKey: true,
      schema: z.object({ contactId: z.string() }),
      execute: async ({ contactId }) => {
        const deleted = ingestionService.deleteContact(contactId);
        return { success: deleted, contactId };
      },
    });

    // 4. High-risk financial tool: Issue contact refund (REQUIRES_APPROVAL)
    this.toolRegistry.registerTool({
      name: 'issue_contact_refund',
      description: 'Issues a monetary refund to a contact billing account',
      riskLevel: 'REQUIRES_APPROVAL',
      requiresIdempotencyKey: true,
      schema: z.object({
        contactId: z.string(),
        amountUsd: z.number().positive(),
        reason: z.string(),
      }),
      execute: async ({ contactId, amountUsd, reason }) => {
        return {
          refundId: `ref_${Math.random().toString(36).slice(2, 9)}`,
          contactId,
          amountUsd,
          reason,
          status: 'PROCESSED',
        };
      },
    });

    this.runner = new SafeAgentRunner(
      { maxSteps: 6, agentName: 'SmartContactOpsAgent' },
      this.toolRegistry,
      this.approvalGate,
      llmClient
    );
  }

  /**
   * Executes a directive through the agent.
   */
  public async executeDirective(directive: string) {
    return await this.runner.run(directive);
  }

  /**
   * Resumes execution after operator approval.
   */
  public async approveAndResume(token: string) {
    return await this.runner.resumeWithApproval(token);
  }

  /**
   * Gets the underlying approval gate.
   */
  public getApprovalGate(): ApprovalGate {
    return this.approvalGate;
  }
}
