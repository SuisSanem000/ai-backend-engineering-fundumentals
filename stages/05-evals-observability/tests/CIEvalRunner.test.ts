import { describe, it, expect } from 'bun:test';
import { CIEvalRunner } from '../src/CIEvalRunner.ts';

describe('Stage 5: Continuous Integration Eval Harness', () => {
  it('passes CI when candidate prompt matches golden requirements', async () => {
    const runner = new CIEvalRunner({ passThreshold: 0.85 });

    // High quality candidate generator that aligns with golden requirements
    const goodCandidate = async (prompt: string): Promise<string> => {
      if (prompt.includes('Alice Henderson')) {
        return 'Contact: Alice Henderson, Company: Stripe, Email: alice@stripe.com.';
      }
      if (prompt.includes('refund window')) {
        return 'Customers have 30 days to request a full refund according to company documentation.';
      }
      if (prompt.includes('SLA')) {
        return 'Our enterprise SLA provides 99.99% uptime availability.';
      }
      return 'Generic response';
    };

    const report = await runner.runBenchmark(goodCandidate);
    expect(report.passed).toBe(true);
    expect(report.passRate).toBe(1.0);
    expect(report.passedCount).toBe(3);
    expect(report.failedCount).toBe(0);
    expect(report.averageScore).toBeGreaterThanOrEqual(0.8);
  });

  it('blocks CI when prompt regression causes assertion failures', async () => {
    const runner = new CIEvalRunner({ passThreshold: 0.85 });

    // Degraded candidate generator: produces hallucinations and omits required facts
    const degradedCandidate = async (prompt: string): Promise<string> => {
      if (prompt.includes('Alice Henderson')) {
        // Omits Stripe company and email
        return 'Found someone named Alice Henderson somewhere.';
      }
      if (prompt.includes('refund window')) {
        // Hallucinates 14 days (which is forbidden!)
        return 'The policy allows 14 days only.';
      }
      if (prompt.includes('SLA')) {
        // Contains forbidden keyword '95%'
        return 'Enterprise uptime is about 95% with no guarantee.';
      }
      return 'I do not know';
    };

    const report = await runner.runBenchmark(degradedCandidate);
    // The degraded prompt MUST be blocked by CI!
    expect(report.passed).toBe(false);
    expect(report.passRate).toBeLessThan(0.85);
    expect(report.failedCount).toBeGreaterThanOrEqual(2);
  });
});
