/**
 * ContactIngestionService: Parses unstructured text (emails, meeting notes) into strongly-typed
 * ContactRecord domain entities using resilient LLM extraction with Zod schema enforcement.
 */

import { z } from 'zod';
import { ContactRecord, InteractionNote, IngestionResult } from './ContactTypes.ts';
import { ResilientLLMClient } from '../../../stages/01-resilient-llm-calls/src/ResilientLLMClient.ts';
import { HybridSearchEngine } from '../../../stages/02-retrieval-rag/src/HybridSearchEngine.ts';
import { TextChunker } from '../../../stages/02-retrieval-rag/src/TextChunker.ts';

const ExtractedContactSchema = z.object({
  fullName: z.string(),
  company: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.string().optional(),
  tags: z.array(z.string()).default([]),
  summary: z.string(),
});

export class ContactIngestionService {
  private readonly llmClient: ResilientLLMClient;
  private readonly searchEngine: HybridSearchEngine;
  private readonly chunker: TextChunker;
  private readonly contactStore = new Map<string, ContactRecord>();

  /**
   * Initializes Ingestion Service with resilient LLM client and hybrid search engine.
   */
  constructor(llmClient: ResilientLLMClient, searchEngine: HybridSearchEngine) {
    this.llmClient = llmClient;
    this.searchEngine = searchEngine;
    this.chunker = new TextChunker({ chunkTokenSize: 60, overlapTokens: 10 });
  }

  /**
   * Ingests unstructured conversational text, extracts structured contact details,
   * stores the record, and indexes its interaction notes for hybrid search.
   * 
   * @param rawText - Freeform unstructured text (e.g. email, call transcript).
   * @returns IngestionResult with structured contact, note, and telemetry metrics.
   */
  public async ingestFromText(rawText: string): Promise<IngestionResult> {
    const start = Date.now();
    const prompt = `You are a CRM data extraction engine. Extract contact details from the following text.
Respond in JSON matching schema:
{
  "fullName": "First Last",
  "company": "Company Name",
  "email": "user@example.com",
  "phone": "+1...",
  "role": "Title",
  "tags": ["tag1", "tag2"],
  "summary": "Brief summary of meeting/context"
}

[RAW TEXT]:
${rawText}`;

    // Execute resilient extraction with schema parsing
    const result = await this.llmClient.execute(prompt, ExtractedContactSchema);
    const extracted = result.data;

    const contactId = `cnt_${Math.random().toString(36).slice(2, 9)}`;
    const noteId = `not_${Math.random().toString(36).slice(2, 9)}`;
    const now = Date.now();

    const contact: ContactRecord = {
      id: contactId,
      fullName: extracted.fullName,
      company: extracted.company,
      email: extracted.email,
      phone: extracted.phone,
      role: extracted.role,
      tags: extracted.tags,
      notesSummary: extracted.summary,
      createdAt: now,
      updatedAt: now,
    };

    const note: InteractionNote = {
      noteId,
      contactId,
      content: rawText,
      timestamp: now,
    };

    // Store in domain repository
    this.contactStore.set(contactId, contact);

    // Chunk and index for hybrid retrieval
    const chunks = this.chunker.chunkDocument(contactId, rawText, {
      contactId,
      fullName: contact.fullName,
      company: contact.company,
      timestamp: now,
    });
    this.searchEngine.indexChunks(chunks);

    return {
      contact,
      note,
      tokensUsed: result.receipt.totalTokens,
      costUsd: result.receipt.totalCostUsd,
      durationMs: Date.now() - start,
    };
  }

  /**
   * Directly retrieves a contact record by ID.
   */
  public getContact(id: string): ContactRecord | undefined {
    return this.contactStore.get(id);
  }

  /**
   * Deletes a contact record by ID.
   */
  public deleteContact(id: string): boolean {
    return this.contactStore.delete(id);
  }

  /**
   * Returns all stored contacts.
   */
  public getAllContacts(): ContactRecord[] {
    return Array.from(this.contactStore.values());
  }
}
