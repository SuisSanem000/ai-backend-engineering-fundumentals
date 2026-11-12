/**
 * ContactTypes: Domain models and validation schemas for the Smart Contact Intelligence platform.
 */

import { z } from 'zod';

export const ContactRecordSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  company: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notesSummary: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type ContactRecord = z.infer<typeof ContactRecordSchema>;

export interface InteractionNote {
  noteId: string;
  contactId: string;
  content: string;
  timestamp: number;
}

export interface IngestionResult {
  contact: ContactRecord;
  note: InteractionNote;
  tokensUsed: number;
  costUsd: number;
  durationMs: number;
}

export interface SearchResultItem {
  contact: ContactRecord;
  relevanceScore: number;
  matchedSnippet: string;
  freshnessMultiplier: number;
}

export interface ContactSearchResponse {
  query: string;
  items: SearchResultItem[];
  cacheHit: 'EXACT' | 'SEMANTIC' | 'NONE';
  durationMs: number;
  costUsd: number;
}

