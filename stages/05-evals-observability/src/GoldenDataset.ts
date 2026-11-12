/**
 * GoldenDataset: Benchmark dataset contracts and curated baseline test cases.
 * Serves as the ground truth regression suite for continuous evaluation in CI.
 */

import { z } from 'zod';

export interface GoldenTestCase {
  id: string;
  category: 'contact_extraction' | 'policy_qa' | 'support_intent';
  inputPrompt: string;
  expectedKeywords: string[];
  forbiddenKeywords?: string[];
  referenceAnswer: string;
  expectedSchema?: z.ZodSchema<unknown>;
}

export const BASELINE_GOLDEN_DATASET: GoldenTestCase[] = [
  {
    id: 'case_01_contact_extraction',
    category: 'contact_extraction',
    inputPrompt: 'Extract contact details for Alice Henderson at Stripe, email alice@stripe.com.',
    expectedKeywords: ['Alice Henderson', 'Stripe', 'alice@stripe.com'],
    forbiddenKeywords: ['unknown', 'null'],
    referenceAnswer: 'Contact: Alice Henderson, Company: Stripe, Email: alice@stripe.com.',
  },
  {
    id: 'case_02_refund_policy',
    category: 'policy_qa',
    inputPrompt: 'What is our standard customer refund window according to documentation?',
    expectedKeywords: ['30 days', 'refund'],
    forbiddenKeywords: ['14 days', 'non-refundable'],
    referenceAnswer: 'Customers may request a full refund within 30 days of initial purchase.',
  },
  {
    id: 'case_03_enterprise_sla',
    category: 'support_intent',
    inputPrompt: 'What is our uptime SLA for enterprise tier customers?',
    expectedKeywords: ['99.99%', 'uptime'],
    forbiddenKeywords: ['95%', 'no guarantee'],
    referenceAnswer: 'Enterprise tier includes a 99.99% uptime SLA backed by service credits.',
  },
];

