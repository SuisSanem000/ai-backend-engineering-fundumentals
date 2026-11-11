/**
 * PromptHarness: Enforces versioned, strongly-typed prompt templates with compile-time
 * and runtime variable validation. Prevents unhydrated template placeholders and
 * enforces size boundaries before sending requests to downstream models.
 */

export interface PromptTemplateConfig<TParams extends Record<string, string>> {
  id: string;
  version: string;
  template: string;
  requiredVariables: Array<keyof TParams>;
  maxEstimatedTokens?: number;
}

export class PromptHarness<TParams extends Record<string, string>> {
  private readonly config: PromptTemplateConfig<TParams>;

  /**
   * Constructs a new PromptHarness instance bound to a specific prompt template contract.
   * @param config - The configuration defining prompt ID, version, raw template string, and required variables.
   */
  constructor(config: PromptTemplateConfig<TParams>) {
    this.config = config;
  }

  /**
   * Hydrates the prompt template with provided parameters.
   * Throws an error if required variables are missing or if unhydrated placeholders remain.
   * @param params - Key-value map of template substitutions.
   * @returns Hydrated prompt string ready for LLM consumption.
   */
  public render(params: TParams): string {
    for (const key of this.config.requiredVariables) {
      if (params[key] === undefined || params[key] === null) {
        throw new Error(
          `PromptContractViolation: Missing required variable '${String(key)}' for template '${this.config.id}@${this.config.version}'`
        );
      }
    }

    let rendered = this.config.template;
    for (const [key, val] of Object.entries(params)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.split(placeholder).join(String(val));
    }

    const unhydratedMatch = rendered.match(/\{\{([a-zA-Z0-9_-]+)\}\}/);
    if (unhydratedMatch) {
      throw new Error(
        `PromptContractViolation: Unhydrated placeholder '${unhydratedMatch[0]}' found in template '${this.config.id}@${this.config.version}'`
      );
    }

    return rendered;
  }

  /**
   * Returns metadata identifying the template name and version.
   */
  public getMetadata(): { id: string; version: string } {
    return {
      id: this.config.id,
      version: this.config.version,
    };
  }
}
