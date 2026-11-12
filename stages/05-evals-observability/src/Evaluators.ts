/**
 * Evaluators: Multi-tiered evaluation engines assessing AI outputs across
 * deterministic assertions, semantic vector similarity, and LLM-as-a-judge rubrics.
 */

import { GoldenTestCase } from './GoldenDataset.ts';
import { EmbeddingEngine } from '../../02-retrieval-rag/src/EmbeddingEngine.ts';

export interface EvaluationResult {
  testCaseId: string;
  passed: boolean;
  score: number; // 0.0 to 1.0
  deterministicPass: boolean;
  semanticSimilarity: number;
  judgeScore?: number; // 1 to 5
  rationale: string;
}

export class Evaluators {
  private readonly embedder: EmbeddingEngine;

  constructor(embedder?: EmbeddingEngine) {
    this.embedder = embedder ?? new EmbeddingEngine();
  }

  /**
   * Deterministically evaluates model output against keyword assertions and schema constraints.
   */
  public evaluateDeterministic(
    testCase: GoldenTestCase,
    actualOutput: string
  ): { passed: boolean; failures: string[] } {
    const failures: string[] = [];
    const lower = actualOutput.toLowerCase();

    // Check required keywords
    for (const kw of testCase.expectedKeywords) {
      if (!lower.includes(kw.toLowerCase())) {
        failures.push(`Missing expected keyword: '${kw}'`);
      }
    }

    // Check forbidden keywords
    if (testCase.forbiddenKeywords) {
      for (const kw of testCase.forbiddenKeywords) {
        if (lower.includes(kw.toLowerCase())) {
          failures.push(`Contains forbidden keyword: '${kw}'`);
        }
      }
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }

  /**
   * Evaluates semantic cosine similarity against the golden reference answer.
   */
  public evaluateSemantic(
    testCase: GoldenTestCase,
    actualOutput: string
  ): number {
    const vRef = this.embedder.embed(testCase.referenceAnswer);
    const vAct = this.embedder.embed(actualOutput);
    const sim = this.embedder.cosineSimilarity(vRef, vAct);
    return Math.max(0, Math.min(1, sim));
  }

  /**
   * Evaluates output using an automated judge rubric.
   * In local/offline mode, computes rubric score deterministically from semantic alignment and fact coverage.
   */
  public evaluateJudge(
    testCase: GoldenTestCase,
    actualOutput: string,
    deterministicPassed: boolean,
    semanticSim: number
  ): { score: number; rationale: string } {
    if (!deterministicPassed) {
      return {
        score: 1,
        rationale: 'Output failed deterministic assertions (missing key facts or contained forbidden tokens).',
      };
    }

    if (semanticSim >= 0.85) {
      return {
        score: 5,
        rationale: 'Exceptional alignment with golden reference answer. All key facts present with accurate phrasing.',
      };
    } else if (semanticSim >= 0.70) {
      return {
        score: 4,
        rationale: 'Good factual accuracy and completeness. Minor stylistic divergence from golden reference.',
      };
    } else if (semanticSim >= 0.50) {
      return {
        score: 3,
        rationale: 'Partially complete; captures some concepts but diverges in semantic depth.',
      };
    }

    return {
      score: 2,
      rationale: 'Low semantic alignment; fails to adequately address the inquiry.',
    };
  }

  /**
   * Runs the complete multi-tiered evaluation pipeline on a single test case.
   */
  public evaluateTestCase(
    testCase: GoldenTestCase,
    actualOutput: string
  ): EvaluationResult {
    const det = this.evaluateDeterministic(testCase, actualOutput);
    const sem = this.evaluateSemantic(testCase, actualOutput);
    const judge = this.evaluateJudge(testCase, actualOutput, det.passed, sem);

    // Composite score: 50% deterministic, 25% semantic, 25% judge
    const judgeNormalized = (judge.score - 1) / 4;
    const compositeScore = det.passed ? 0.5 + sem * 0.25 + judgeNormalized * 0.25 : 0;
    const passed = det.passed && compositeScore >= 0.75;

    return {
      testCaseId: testCase.id,
      passed,
      score: Number(compositeScore.toFixed(3)),
      deterministicPass: det.passed,
      semanticSimilarity: Number(sem.toFixed(3)),
      judgeScore: judge.score,
      rationale: det.passed ? judge.rationale : det.failures.join('; '),
    };
  }
}

