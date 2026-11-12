/**
 * CIEvalRunner: Automated Continuous Integration evaluation harness.
 * Executes benchmark test suites against candidate prompts/models, calculates
 * pass rates, and enforces gate thresholds to block regressions before deployment.
 */

import { GoldenTestCase, BASELINE_GOLDEN_DATASET } from './GoldenDataset.ts';
import { Evaluators, EvaluationResult } from './Evaluators.ts';
import { Tracer } from './Tracer.ts';

export interface CIRunnerOptions {
  passThreshold?: number; // Minimum acceptable pass rate (e.g. 0.85 = 85%)
  dataset?: GoldenTestCase[];
}

export interface CIReport {
  passed: boolean;
  passRate: number;
  totalCases: number;
  passedCount: number;
  failedCount: number;
  averageScore: number;
  results: EvaluationResult[];
  traceId: string;
}

export class CIEvalRunner {
  private readonly passThreshold: number;
  private readonly dataset: GoldenTestCase[];
  private readonly evaluators: Evaluators;
  private readonly tracer: Tracer;

  /**
   * Initializes the CI eval runner.
   * 
   * @param options - Threshold requirements and custom test dataset.
   */
  constructor(options?: CIRunnerOptions) {
    this.passThreshold = options?.passThreshold ?? 0.85;
    this.dataset = options?.dataset ?? BASELINE_GOLDEN_DATASET;
    this.evaluators = new Evaluators();
    this.tracer = new Tracer();
  }

  /**
   * Executes candidate prompt generator against all test cases in the dataset.
   * 
   * @param candidateFn - Function taking input prompt and returning LLM completion.
   * @returns CIReport detailing pass/fail decisions and quality metrics.
   */
  public async runBenchmark(
    candidateFn: (prompt: string) => Promise<string>
  ): Promise<CIReport> {
    const traceId = Tracer.generateTraceId();
    const rootSpan = this.tracer.startSpan('ci.eval_suite_run', traceId);

    const results: EvaluationResult[] = [];
    let passedCount = 0;
    let scoreSum = 0;

    for (const testCase of this.dataset) {
      const caseSpan = this.tracer.startSpan(
        `ci.case_${testCase.id}`,
        traceId,
        rootSpan.spanId,
        { category: testCase.category }
      );

      try {
        const actualOutput = await candidateFn(testCase.inputPrompt);
        const evalResult = this.evaluators.evaluateTestCase(testCase, actualOutput);

        results.push(evalResult);
        scoreSum += evalResult.score;

        if (evalResult.passed) {
          passedCount++;
          this.tracer.endSpan(caseSpan.spanId, 'OK', { score: evalResult.score });
        } else {
          this.tracer.endSpan(caseSpan.spanId, 'ERROR', {
            score: evalResult.score,
            failures: evalResult.rationale,
          });
        }
      } catch (err) {
        this.tracer.endSpan(caseSpan.spanId, 'ERROR', { error: (err as Error).message });
        results.push({
          testCaseId: testCase.id,
          passed: false,
          score: 0,
          deterministicPass: false,
          semanticSimilarity: 0,
          rationale: `Execution threw runtime error: ${(err as Error).message}`,
        });
      }
    }

    const totalCases = this.dataset.length;
    const passRate = totalCases > 0 ? passedCount / totalCases : 0;
    const averageScore = totalCases > 0 ? scoreSum / totalCases : 0;
    const ciPassed = passRate >= this.passThreshold;

    this.tracer.endSpan(rootSpan.spanId, ciPassed ? 'OK' : 'ERROR', {
      passRate,
      averageScore,
      ciPassed,
    });

    return {
      passed: ciPassed,
      passRate: Number(passRate.toFixed(3)),
      totalCases,
      passedCount,
      failedCount: totalCases - passedCount,
      averageScore: Number(averageScore.toFixed(3)),
      results,
      traceId,
    };
  }

  /**
   * Retrieves the internal tracer instance for inspection.
   */
  public getTracer(): Tracer {
    return this.tracer;
  }
}

