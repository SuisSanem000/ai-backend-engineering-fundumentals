/**
 * ExecutionGuardrail: Runtime tripwires preventing model runaways, infinite tool loops,
 * hallucinated repetitive cycles, and unauthorized execution spikes.
 */

import { z } from 'zod';

export interface GuardrailConfig {
  maxConsecutiveIdenticalCalls: number;
  maxTotalSteps: number;
  globalTimeoutMs: number;
}

export class ExecutionGuardrail {
  private readonly config: GuardrailConfig;
  private readonly callHistory: string[] = [];
  private currentStep = 0;
  private readonly startTime: number;

  /**
   * Initializes the guardrail with safety boundaries.
   * @param config - Configurable limits for loop repetition, step count, and wall-clock time.
   */
  constructor(config: GuardrailConfig) {
    this.config = config;
    this.startTime = Date.now();
  }

  /**
   * Evaluates whether an agent action violates safety boundaries before execution.
   * Throws a GuardrailViolationError if any safety tripwire is activated.
   * @param toolName - Identifier of the tool or action about to execute.
   * @param toolArgs - Serialized or object representation of tool arguments.
   */
  public assertCanExecute(toolName: string, toolArgs: unknown): void {
    this.currentStep++;

    // 1. Check global execution timeout
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.config.globalTimeoutMs) {
      throw new Error(
        `GuardrailViolation: Global timeout exceeded (${elapsed}ms > ${this.config.globalTimeoutMs}ms)`
      );
    }

    // 2. Check maximum step budget
    if (this.currentStep > this.config.maxTotalSteps) {
      throw new Error(
        `GuardrailViolation: Maximum step budget exceeded (${this.currentStep} > ${this.config.maxTotalSteps})`
      );
    }

    // 3. Check loop detection (identical consecutive tool invocations)
    const signature = `${toolName}:${JSON.stringify(toolArgs)}`;
    this.callHistory.push(signature);

    const len = this.callHistory.length;
    const threshold = this.config.maxConsecutiveIdenticalCalls;
    if (len >= threshold) {
      const recent = this.callHistory.slice(len - threshold);
      const allIdentical = recent.every((call) => call === signature);
      if (allIdentical) {
        throw new Error(
          `GuardrailViolation: Infinite loop detected. Action '${toolName}' invoked ${threshold} times with identical arguments.`
        );
      }
    }
  }

  /**
   * Validates structured output against a Zod schema, returning typed data or throwing a clean error.
   * @param rawData - Unverified data returned by LLM.
   * @param schema - Target Zod validation schema.
   * @returns Strongly-typed validated data.
   */
  public validateOutput<T>(rawData: unknown, schema: z.ZodSchema<T>): T {
    const result = schema.safeParse(rawData);
    if (!result.success) {
      throw new Error(
        `GuardrailViolation: Schema validation failed: ${result.error.issues.map((i) => i.message).join(', ')}`
      );
    }
    return result.data;
  }

  /**
   * Resets execution tracking state.
   */
  public reset(): void {
    this.callHistory.length = 0;
    this.currentStep = 0;
  }
}
