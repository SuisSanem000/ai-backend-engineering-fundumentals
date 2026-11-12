import { describe, it, expect, beforeEach } from 'bun:test';
import { SmartContactService } from '../src/SmartContactService.ts';

describe('Master Project: Smart Contact List Service', () => {
  let service: SmartContactService;

  beforeEach(() => {
    service = new SmartContactService();
  });

  it('executes full end-to-end lifecycle: ingestion, hybrid search, caching, agent ops, and tracing', async () => {
    // 1. Ingestion: Convert messy raw text into strongly-typed ContactRecord
    const rawNote =
      'Met with Sarah Connor from Cyberdyne Systems today. Her email is sarah@cyberdyne.com. Discussed neural network defense architecture and infrastructure security.';
    const ingestion = await service.ingestContact(rawNote);

    expect(ingestion.contact.fullName).toBe('Sarah Connor');
    expect(ingestion.contact.company).toBe('Cyberdyne Systems');
    expect(ingestion.contact.email).toBe('sarah@cyberdyne.com');
    expect(ingestion.tokensUsed).toBeGreaterThan(0);
    expect(ingestion.costUsd).toBeGreaterThan(0);

    // 2. Hybrid Search: Retrieve by conceptual keywords
    const searchRes1 = await service.searchContacts('neural network defense architecture', 3);
    expect(searchRes1.items.length).toBeGreaterThan(0);
    expect(searchRes1.items[0].contact.fullName).toBe('Sarah Connor');
    expect(searchRes1.items[0].relevanceScore).toBeGreaterThan(0);

    // 3. Safe Agent Operation: Attempt a refund requiring human approval
    const agentRes = await service.executeAgentDirective(
      `Issue a $150 refund for contact ${ingestion.contact.id}`
    );

    // Verify agent halts safely in NEEDS_APPROVAL state
    expect(agentRes.state).toBe('NEEDS_APPROVAL');
    expect(agentRes.pendingApproval).toBeDefined();
    const token = agentRes.pendingApproval!.approvalToken;

    // Operator grants human sign-off
    const resumeRes = await service.approveOperation(token);
    expect(resumeRes.state).toBe('COMPLETED');

    // 4. Verify OpenTelemetry Tracing DAG
    const traceTree = service.getTraceTree();
    expect(traceTree.length).toBeGreaterThanOrEqual(3);
    const spanNames = traceTree.map((s) => s.name);
    expect(spanNames).toContain('contact.ingest');
    expect(spanNames).toContain('contact.search');
    expect(spanNames).toContain('contact.agent_directive');
  });
});

